from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import loader

app = FastAPI()

# ✅ CORS setup
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
def run_loader(input: ApiInput):
    try:
        result = loader.run_loader(input.apis)
        return {"message": "✅ Data loading completed", "details": result}
    except Exception as e:
        return {"message": f"❌ Error: {str(e)}"}
