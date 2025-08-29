from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import loader  # our Snowflake loader file

app = FastAPI()

class ApiInput(BaseModel):
    apis: list[str]

@app.post("/run-loader")
def run_loader(input: ApiInput):
    try:
        result = loader.run_loader(input.apis)
        return {"message": "✅ Data loading completed", "details": result}
    except Exception as e:
        return {"message": f"❌ Error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
