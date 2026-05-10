from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

memory = []

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {"status": "NurseMate AI Running"}

@app.post("/save")
def save_note(req: ChatRequest):
    memory.append(req.message)
    return {"saved": req.message}

@app.post("/chat")
def chat(req: ChatRequest):

    saved_data = "\n".join(memory)

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

    return {
        "reply": response.output_text
    }