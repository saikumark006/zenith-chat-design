from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import traceback
import loader
import re, time
import snowflake.connector
from snowflake.connector import DictCursor
import os
from dotenv import load_dotenv

# ---- OpenAI ----
from openai import OpenAI

# Load environment variables
load_dotenv()

# ---------- Config ----------


# ---------- App ----------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow any frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Existing Loader Models ----------
class ApiInput(BaseModel):
    apis: list[str]

@app.post("/run-loader")
def run_loader_endpoint(input: ApiInput):
    try:
        if not input.apis:
            return {"status": "error", "message": "No APIs provided"}
        valid_apis = [api.strip() for api in input.apis if api.strip()]
        if not valid_apis:
            return {"status": "error", "message": "No valid APIs provided"}

        result = loader.run_loader(valid_apis)
        has_critical_error = any("CRITICAL ERROR" in str(line) for line in result)
        has_success = any("SUCCESS:" in str(line) for line in result)

        if has_critical_error:
            status = "error"; message = "Critical error occurred during processing"
        elif has_success:
            status = "success"; message = "Data loading completed successfully"
        else:
            status = "warning"; message = "Process completed but no successful loads detected"

        return {
            "status": status,
            "message": message,
            "details": result,
            "summary": {
                "total_sources": len(valid_apis),
                "has_success": has_success,
                "has_errors": has_critical_error
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Server error: {e}",
            "details": [traceback.format_exc()]
        }

@app.get("/health")
def health_check():
    try:
        conn_success, conn_msg = loader.test_snowflake_connection()
        return {
            "status": "healthy" if conn_success else "unhealthy",
            "snowflake_connection": conn_msg
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# ---------- New AI Ask Models ----------
class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)

class AskResponse(BaseModel):
    question: str
    sql: str
    columns: list[str]
    rows: list[list]
    rowcount: int
    elapsed_ms: int

# ---------- Helpers ----------
def get_snowflake_connection():
    try:
        return snowflake.connector.connect(
            user=SF_USER,
            password=SF_PASSWORD,
            account=SF_ACCOUNT,
            role=SF_ROLE,
            warehouse=SF_WAREHOUSE,
            database=SF_DATABASE,
            schema=SF_SCHEMA,
            client_session_keep_alive=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Snowflake connection failed: {str(e)}")

def fetch_schema_snapshot(conn) -> str:
    sql = f"""
    SELECT table_name, column_name, data_type
    FROM {SF_DATABASE}.INFORMATION_SCHEMA.COLUMNS
    WHERE table_schema = %s
    ORDER BY table_name, ordinal_position
    LIMIT 5000
    """
    cur = conn.cursor(DictCursor)
    try:
        cur.execute(sql, (SF_SCHEMA,))
        rows = cur.fetchall()
        return "\n".join(f"{r['TABLE_NAME']}.{r['COLUMN_NAME']} ({r['DATA_TYPE']})" for r in rows)
    finally:
        cur.close()

SYSTEM_PROMPT = """You are a Snowflake SQL generator.
Rules:
- Only SELECT queries.
- Fully qualify with {db}.{schema}.{{table}}.
- Never modify data.
- Use LIMIT 100 for big results.
- Return SQL only, no explanations.
"""

def generate_sql(question: str, schema_snapshot: str) -> str:
    if not OPENAI_API_KEY or OPENAI_API_KEY == "your-api-key-here":
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Use the correct chat completions API
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {
                    "role": "system", 
                    "content": SYSTEM_PROMPT.format(db=SF_DATABASE, schema=SF_SCHEMA)
                },
                {
                    "role": "user", 
                    "content": f"Schema:\n{schema_snapshot}\n\nQuestion:\n{question}\n\nReturn only SQL."
                }
            ],
            temperature=0
        )
        
        text = response.choices[0].message.content.strip()
        
        # Clean up the response
        text = re.sub(r"^```(sql)?", "", text, flags=re.IGNORECASE).strip()
        text = re.sub(r"```$", "", text).strip()
        
        if not text.lower().startswith("select"):
            raise HTTPException(status_code=400, detail="Generated SQL is not a SELECT statement")
            
        return text
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

def run_query(conn, sql: str):
    cur = conn.cursor()
    try:
        start = time.time()
        cur.execute(sql)
        rows = cur.fetchmany(1000)
        cols = [c[0] for c in cur.description] if cur.description else []
        elapsed = int((time.time() - start) * 1000)
        return {"columns": cols, "rows": [list(row) for row in rows], "rowcount": len(rows), "elapsed_ms": elapsed}
    finally:
        cur.close()

# ---------- /ask Endpoint ----------
@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    conn = None
    try:
        conn = get_snowflake_connection()
        schema_snapshot = fetch_schema_snapshot(conn)
        
        if not schema_snapshot.strip():
            raise HTTPException(status_code=404, detail="No tables found in the database schema")
        
        sql = generate_sql(req.question, schema_snapshot)
        result = run_query(conn, sql)
        
        return AskResponse(
            question=req.question, 
            sql=sql, 
            columns=result["columns"],
            rows=result["rows"],
            rowcount=result["rowcount"],
            elapsed_ms=result["elapsed_ms"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass
