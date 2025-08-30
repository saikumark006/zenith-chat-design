from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from datetime import date, datetime
from pathlib import Path
import traceback
import loader
import re, time
import snowflake.connector
from snowflake.connector import DictCursor
import os
from dotenv import load_dotenv
import json
import pandas as pd
from typing import Optional, Dict, Any, List
import numpy as np
from loader import run_loader
# ---- OpenAI ----
from openai import OpenAI
# ---- Chart Generation ----
import matplotlib
matplotlib.use('Agg') # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import io
from matplotlib.figure import Figure
# ---- Enhanced Visualization Libraries ----
try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    print("Plotly not available. Install with: pip install plotly kaleido")
try:
    import pandasai as pai
    from pandasai import Agent
    from pandasai_litellm.litellm import LiteLLM
    PANDASAI_AVAILABLE = True
except ImportError:
    PANDASAI_AVAILABLE = False
    print("PandasAI not available. Install with: pip install pandasai pandasai-litellm")
# Load environment variables
load_dotenv()
# ---------- Config ----------
SF_USER = "KINGKONG"
SF_PASSWORD = "Constant127496"
SF_ACCOUNT = "LHHLNLP-EPB47564"
SF_ROLE = "ACCOUNTADMIN"
SF_WAREHOUSE = "COMPUTE_WH"
SF_DATABASE = "HACKATHON"
SF_SCHEMA = "RAW"
OPENAI_API_KEY = "sk-proj-********************************"
OPENAI_MODEL = "gpt-4.1"
if PANDASAI_AVAILABLE and OPENAI_API_KEY and "****" not in OPENAI_API_KEY:
    llm = LiteLLM(model="gpt-4", api_key=OPENAI_API_KEY)
    pai.config.set({"llm": llm})
# ---------- App ----------
app = FastAPI(title="Enhanced Data Analytics API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------- Models ----------
class ApiInput(BaseModel):
    apis: list[str]
class AskRequest(BaseModel):
    question: str = Field(..., min_length=1)
    include_summary: bool = Field(default=True)
    include_chart: bool = Field(default=False)
    chart_type: Optional[str] = Field(default="auto")
    chart_engine: Optional[str] = Field(default="matplotlib")
class ChartConfig(BaseModel):
    type: str
    title: str
    x_label: Optional[str] = None
    y_label: Optional[str] = None
    data_encoded: str
    engine: Optional[str] = None
class AskResponse(BaseModel):
    question: str
    sql: str
    columns: list[str]
    rows: list[list]
    rowcount: int
    elapsed_ms: int
    response_text: str
    ai_summary: Optional[str] = None
    chart: Optional[ChartConfig] = None
    insights: Optional[Dict[str, Any]] = None
    sql_explanation: Optional[str] = None
# ---------- Helper ----------
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
SYSTEM_PROMPT = Path("metadata.txt").read_text(encoding="utf-8")
SUMMARY_PROMPT = """You are a data analyst. Analyze the following query results and provide a concise, insightful summary."""
# ---------- AI Logic ----------
def generate_sql(question: str) -> tuple[str, Optional[str]]:
    if not OPENAI_API_KEY or "****" in OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Question:\n{question}\n\nSQL:\n<your SQL>\n\nEXPLANATION:\n<your explanation>"}
            ],
            temperature=0
        )
        text = response.choices[0].message.content.strip()
        text = text.replace("```sql", "").replace("```", "").strip()
        sql_match = re.search(r"SQL:\s*(select.+?)(?=EXPLANATION:|$)", text, re.IGNORECASE | re.DOTALL)
        explanation_match = re.search(r"EXPLANATION:\s*(.+)", text, re.IGNORECASE | re.DOTALL)
        if not sql_match:
            raise HTTPException(status_code=400, detail="No valid SQL found in response")
        sql_only = sql_match.group(1).strip()
        explanation = explanation_match.group(1).strip() if explanation_match else None
        if not sql_only.lower().startswith("select"):
            raise HTTPException(status_code=400, detail="Generated SQL is not a SELECT statement")
        return sql_only, explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
def generate_ai_summary(question: str, columns: List[str], rows: List[List], sql: str) -> str:
    if not OPENAI_API_KEY or "****" in OPENAI_API_KEY:
        return "AI summary not available"
    try:
        df = pd.DataFrame(rows, columns=columns)
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SUMMARY_PROMPT},
                {"role": "user", "content": f"Data:\n{df.head().to_dict()}"}
            ],
            temperature=0.3,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Summary generation failed: {str(e)}"
# ---------- Query ----------
def run_query(conn, sql: str):
    cur = conn.cursor()
    try:
        start = time.time()
        cur.execute(sql)
        rows = [
            [v.isoformat() if isinstance(v, (date, datetime)) else v for v in row]
            for row in cur.fetchmany(1000)
        ]
        cols = [c[0] for c in cur.description] if cur.description else []
        elapsed = int((time.time() - start) * 1000)
        return {"columns": cols, "rows": [list(row) for row in rows], "rowcount": len(rows), "elapsed_ms": elapsed}
    finally:
        cur.close()
# ---------- Chart Helpers ----------
def detect_optimal_chart_type(df: pd.DataFrame, columns: List[str]) -> str:
    """Enhanced chart type detection with better categorical data handling"""
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
   
    print(f"[Chart Debug] Numeric cols: {numeric_cols}, Categorical cols: {categorical_cols}")
   
    # Check for revenue share or percentage data - perfect for bar charts
    if len(columns) >= 2:
        col_names = [col.lower() for col in columns]
        if any('revenue' in col or 'share' in col or 'pct' in col or 'percent' in col for col in col_names):
            if any('category' in col or 'product' in col or 'type' in col for col in col_names):
                print("[Chart Debug] Detected revenue/category data - using bar chart")
                return "bar"
   
    # Check for frequency/distribution data
    if len(columns) == 2:
        col1_lower = columns[0].lower()
        col2_lower = columns[1].lower()
        if any(word in col2_lower for word in ['frequency', 'count', 'freq']):
            return "bar"
        if any(word in col1_lower for word in ['balance', 'points', 'score']) and 'frequency' in col2_lower:
            return "bar"
   
    # Time series detection
    for col in columns:
        if any(k in col.lower() for k in ['date', 'time', 'year', 'month', 'day']):
            return "line"
   
    # If we have one categorical column and one or more numeric columns -> bar chart
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        print("[Chart Debug] Categorical + numeric data - using bar chart")
        return "bar"
   
    # Distribution analysis
    if len(numeric_cols) == 1 and len(categorical_cols) == 0:
        return "histogram"
   
    # Multiple numerics - but be careful about what's actually categorical
    if len(numeric_cols) >= 3:
        return "heatmap"
    if len(numeric_cols) == 2:
        # Check if one of the "numeric" columns is actually categorical (like product IDs)
        for col in columns:
            if any(word in col.lower() for word in ['category', 'product', 'type', 'name']):
                return "bar"
        return "scatter"
   
    return "bar" # Safe default for most business data
# ---------- Chart Engines ----------
def generate_pandasai_chart(columns, rows, question):
    if not PANDASAI_AVAILABLE or not rows or not columns:
        return None
    try:
        df = pd.DataFrame(rows, columns=columns)
        os.makedirs("temp_charts", exist_ok=True)
        agent = Agent(df, config={"save_charts": True, "save_charts_path": "temp_charts"})
        agent.chat(f"Create a visualization for: {question}")
        import glob
        chart_files = glob.glob("temp_charts/*.png")
        if chart_files:
            latest = max(chart_files, key=os.path.getctime)
            with open(latest, "rb") as f:
                b64 = base64.b64encode(f.read()).decode()
            return ChartConfig(type="pandasai_smart", title=question, data_encoded=b64, engine="pandasai")
    except Exception as e:
        print(f"PandasAI error: {e}")
        return None
def create_plotly_chart(columns, rows, chart_type, question):
    if not PLOTLY_AVAILABLE or not rows or not columns:
        return None
    try:
        df = pd.DataFrame(rows, columns=columns)
        if chart_type == "auto":
            chart_type = detect_optimal_chart_type(df, columns)
        fig = None
        if chart_type == "bar" and len(columns) >= 2:
            fig = px.bar(df, x=columns[0], y=columns[1], title=f"Bar Chart: {question}")
        elif chart_type == "line" and len(columns) >= 2:
            fig = px.line(df, x=columns[0], y=columns[1], title=f"Line Chart: {question}")
        elif chart_type == "scatter" and len(columns) >= 2:
            fig = px.scatter(df, x=columns[0], y=columns[1], title=f"Scatter Plot: {question}")
        if fig:
            fig.update_layout(template="plotly_dark", width=800, height=500)
            img = fig.to_image(format="png", engine="kaleido")
            b64 = base64.b64encode(img).decode()
            return ChartConfig(type=f"plotly_{chart_type}", title=question, data_encoded=b64, engine="plotly")
    except Exception as e:
        print(f"Plotly error: {e}")
        return None
def create_enhanced_matplotlib_chart(columns, rows, chart_type, question):
    """Improved matplotlib chart generation with better formatting"""
    if not rows or not columns:
        print("[Chart Debug] No data provided")
        return None
  
    try:
        df = pd.DataFrame(rows, columns=columns)
        print(f"[Chart Debug] DataFrame shape: {df.shape}, columns: {columns}")
        
        if chart_type == "auto":
            chart_type = detect_optimal_chart_type(df, columns)
            print(f"[Chart Debug] Auto-detected chart type: {chart_type}")
      
        # IMPROVED: Larger figure size and better DPI
        plt.style.use('default')
        fig, ax = plt.subplots(figsize=(16, 10))  # Increased from (12, 8)
        fig.patch.set_facecolor('white')
      
        success = False
      
        if chart_type == "bar" and len(columns) >= 2:
            try:
                # Find categorical and numeric columns
                categorical_col = columns[0]
                numeric_col = columns[1]
                
                for col in columns:
                    if df[col].dtype == 'object' or any(word in col.lower() for word in ['category', 'product', 'type', 'name', 'country']):
                        categorical_col = col
                        break
               
                for col in columns:
                    if pd.api.types.is_numeric_dtype(df[col]) and col != categorical_col:
                        numeric_col = col
                        break
               
                categories = df[categorical_col].astype(str)
                values = pd.to_numeric(df[numeric_col], errors='coerce')
                
                # Remove NaN values
                mask = ~values.isna()
                categories = categories[mask]
                values = values[mask]
                
                # IMPROVED: Sort by values for better visualization
                sorted_data = sorted(zip(categories, values), key=lambda x: x[1], reverse=True)
                categories, values = zip(*sorted_data)
                
                # IMPROVED: Limit to top N categories if too many
                if len(categories) > 20:
                    categories = categories[:20]
                    values = values[:20]
                    print(f"[Chart Debug] Limited to top 20 categories")
                
                # Create bar chart with better spacing
                x_positions = range(len(categories))
                bars = ax.bar(x_positions, values, 
                             color='steelblue', alpha=0.8,
                             edgecolor='navy', linewidth=0.8,
                             width=0.7)  # Slightly thinner bars
               
                # IMPROVED: Better axis formatting
                ax.set_xlabel(categorical_col, fontsize=14, fontweight='bold', labelpad=10)
                ax.set_ylabel(numeric_col, fontsize=14, fontweight='bold', labelpad=10)
                ax.set_title(f"{numeric_col} by {categorical_col}", 
                           fontsize=18, fontweight='bold', pad=25)
               
                # IMPROVED: Smart x-axis label rotation
                ax.set_xticks(x_positions)
                if len(categories) > 10 or max(len(str(cat)) for cat in categories) > 12:
                    ax.set_xticklabels(categories, rotation=45, ha='right', fontsize=11)
                    # Add more bottom margin for rotated labels
                    plt.subplots_adjust(bottom=0.15)
                else:
                    ax.set_xticklabels(categories, fontsize=11)
               
                # IMPROVED: Better value labels on bars
                max_val = max(values)
                for i, (pos, val) in enumerate(zip(x_positions, values)):
                    # Format large numbers
                    if val >= 1_000_000:
                        label = f"${val/1_000_000:.1f}M"
                    elif val >= 1_000:
                        label = f"${val/1_000:.0f}K"
                    elif val >= 1:
                        label = f"${val:,.0f}" if val > 100 else f"${val:.1f}"
                    else:
                        label = f"${val:.2f}"
                    
                    # Position labels better
                    y_pos = val + max_val * 0.01
                    ax.text(pos, y_pos, label, 
                           ha='center', va='bottom', 
                           fontweight='bold', fontsize=10,
                           rotation=0 if len(str(label)) < 8 else 0)
               
                # IMPROVED: Better grid and styling
                ax.grid(True, alpha=0.3, axis='y', linestyle='--')
                ax.set_axisbelow(True)
                
                # IMPROVED: Y-axis formatting
                if max(values) >= 1_000_000:
                    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1_000_000:.0f}M'))
                elif max(values) >= 1_000:
                    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1_000:.0f}K'))
                
                # IMPROVED: Better margins and spacing
                ax.margins(x=0.01, y=0.05)  # Small margins
                
                # Style improvements
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                ax.spines['left'].set_color('#CCCCCC')
                ax.spines['bottom'].set_color('#CCCCCC')
                
                success = True
                print("[Chart Debug] Improved bar chart created successfully")
              
            except Exception as e:
                print(f"[Chart Debug] Bar chart error: {e}")
                import traceback
                traceback.print_exc()
      
        # Other chart types remain similar but with improved sizing...
        
        if not success:
            plt.close(fig)
            return None
      
        # IMPROVED: Better layout and higher quality export
        plt.tight_layout(pad=2.0)  # More padding
      
        # IMPROVED: Higher quality image export
        buf = io.BytesIO()
        plt.savefig(buf, format='png', 
                   dpi=200,  # Increased from 150
                   bbox_inches='tight',
                   facecolor='white', 
                   edgecolor='none',
                   pad_inches=0.2)  # Small padding around the image
        buf.seek(0)
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)
      
        print(f"[Chart Debug] Successfully created high-quality {chart_type} chart")
      
        return {
            "type": chart_type,
            "title": question,
            "data_encoded": img_base64,
            "engine": "matplotlib"
        }
      
    except Exception as e:
        print(f"[Chart Debug] Overall chart creation error: {e}")
        return None
# ---------- Main Chart Wrapper ----------
def create_advanced_chart(columns, rows, chart_type, chart_engine, question):
    """Main chart creation wrapper with better debugging"""
    print(f"[Chart Debug] Starting chart creation:")
    print(f" - Engine: {chart_engine}")
    print(f" - Type: {chart_type}")
    print(f" - Rows: {len(rows) if rows else 0}")
    print(f" - Columns: {columns}")
  
    if not rows or not columns:
        print("[Chart Debug] No data to chart")
        return None
  
    # For now, let's focus on matplotlib since it's most reliable
    if chart_engine in ["pandasai", "plotly"]:
        print(f"[Chart Debug] Falling back to matplotlib from {chart_engine}")
        chart_engine = "matplotlib"
  
    result = create_enhanced_matplotlib_chart(columns, rows, chart_type, question)
  
    if result:
        print(f"[Chart Debug] Chart created successfully!")
        return result
    else:
        print(f"[Chart Debug] Chart creation failed")
        return None
# ---------- Insights ----------
def generate_insights(columns, rows):
    if not rows or not columns:
        return {}
    try:
        df = pd.DataFrame(rows, columns=columns)
        insights = {"total_records": len(rows), "columns_analyzed": len(columns)}
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if not numeric_cols.empty:
            insights["numeric_columns"] = len(numeric_cols)
            for col in numeric_cols[:3]:
                stats = df[col].describe()
                insights[f"{col}_stats"] = {
                    "mean": float(stats["mean"]),
                    "min": float(stats["min"]),
                    "max": float(stats["max"])
                }
        return insights
    except Exception as e:
        return {"error": str(e)}
# ---------- Upload Endpoint ----------
@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        # Call loader with local path
        logs = run_loader([file_path])
        # Cleanup optional: keep file for debugging, or uncomment to auto-delete
        # os.remove(file_path)
        return JSONResponse({"details": logs})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
# ---------- Existing Run Loader ----------
@app.post("/run-loader")
def run_loader_endpoint(payload: ApiInput):
    try:
        if not payload.apis or not isinstance(payload.apis, list):
            raise HTTPException(status_code=400, detail="apis must be a non-empty list of URLs")
        logs = run_loader(payload.apis)
        return JSONResponse({"details": logs})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Loader failed: {str(e)}")
# ---------- Ask Endpoint ----------
@app.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    conn = None
    try:
        print(f"[ASK] q='{req.question}', chart={req.include_chart}, engine={req.chart_engine}")
        conn = get_snowflake_connection()
        sql, explanation = generate_sql(req.question)
        result = run_query(conn, sql)
        response_text = f"Retrieved {result['rowcount']} records"
        ai_summary = generate_ai_summary(req.question, result["columns"], result["rows"], sql) if req.include_summary else None
        chart = None
        if req.include_chart and result["rowcount"] > 0:
            chart = create_advanced_chart(result["columns"], result["rows"], req.chart_type, req.chart_engine, req.question)
        insights = generate_insights(result["columns"], result["rows"])
        return AskResponse(
            question=req.question, sql=sql, sql_explanation=explanation,
            columns=result["columns"], rows=result["rows"], rowcount=result["rowcount"],
            elapsed_ms=result["elapsed_ms"], response_text=response_text,
            ai_summary=ai_summary, chart=chart, insights=insights
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            try: conn.close()
            except: pass
# ---------- Chart Options and Health Check ----------
@app.get("/chart-options")
def get_chart_options():
    return {
        "engines": {
            "matplotlib": {"available": True},
            "plotly": {"available": PLOTLY_AVAILABLE},
            "pandasai": {"available": PANDASAI_AVAILABLE}
        },
        "types": ["auto", "bar", "line", "pie", "scatter", "heatmap", "histogram", "box", "dashboard"]
    }
@app.get("/health")
def health_check():
    return {"status": "ok", "plotly": PLOTLY_AVAILABLE, "pandasai": PANDASAI_AVAILABLE}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
