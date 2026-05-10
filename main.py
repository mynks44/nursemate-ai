from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()

api_key = os.getenv("OPENAI_API_KEY")

if api_key:
    client = OpenAI(api_key=api_key)
else:
    client = None

memory = []

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "NurseMate AI Running"}

@app.get("/debug-env")
def debug_env():
    return {"has_openai_key": bool(os.getenv("OPENAI_API_KEY"))}

@app.post("/save")
def save_note(req: ChatRequest):
    memory.append(req.message)
    return {"saved": req.message}

@app.post("/chat")
def chat(req: ChatRequest):
    if not client:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing in Railway Variables")

    saved_data = "\n".join(memory)

    try:
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=f"""
You are NurseMate AI.

Rules:
- Give general wellness guidance only.
- Never diagnose.
- If emergency symptoms appear, tell user to contact emergency services.

Saved notes:
{saved_data}

User says:
{req.message}
"""
        )

        return {"reply": response.output_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))