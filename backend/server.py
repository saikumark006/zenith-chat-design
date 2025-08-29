from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import loader
import traceback

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow everything during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ApiInput(BaseModel):
    apis: list[str]

@app.post("/run-loader")
def run_loader_endpoint(input: ApiInput):
    try:
        print(f"Received request with APIs: {input.apis}")  # Debug logging
        
        # Validate input
        if not input.apis:
            return {"status": "error", "message": "No APIs provided"}
            
        valid_apis = [api.strip() for api in input.apis if api.strip()]
        if not valid_apis:
            return {"status": "error", "message": "No valid APIs provided"}
            
        print(f"Processing {len(valid_apis)} valid APIs")
        
        # Run the loader
        result = loader.run_loader(valid_apis)
        
        print("Loader completed, results:")
        for i, line in enumerate(result):
            print(f"{i+1}: {line}")
        
        # Check if there were any critical errors
        has_critical_error = any("CRITICAL ERROR" in str(line) for line in result)
        has_success = any("SUCCESS:" in str(line) for line in result)
        
        if has_critical_error:
            status = "error"
            message = "Critical error occurred during processing"
        elif has_success:
            status = "success"
            message = "Data loading completed successfully"
        else:
            status = "warning"
            message = "Process completed but no successful loads detected"
            
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
        error_msg = f"Server error: {str(e)}"
        print(f"Server error: {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        
        return {
            "status": "error", 
            "message": error_msg,
            "details": [traceback.format_exc()]
        }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Test Snowflake connection
        conn_success, conn_msg = loader.test_snowflake_connection()
        return {
            "status": "healthy" if conn_success else "unhealthy",
            "snowflake_connection": conn_msg
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}