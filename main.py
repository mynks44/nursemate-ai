from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

app = FastAPI()

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash-8b")
    # model = genai.GenerativeModel("gemini-2.0-flash")
else:
    model = None

memory = []

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {
        "status": "NurseMate AI Running with Gemini"
    }

@app.get("/debug-env")
def debug():
    return {
        "has_gemini_key": bool(api_key)
    }

@app.post("/save")
def save_note(req: ChatRequest):
    memory.append(req.message)

    return {
        "saved": req.message
    }

@app.post("/chat")
def chat(req: ChatRequest):

    if not model:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key missing"
        )

    saved_data = "\n".join(memory)

    prompt = f"""
You are NurseMate AI.

Rules:
- Give general wellness guidance only
- Never diagnose disease
- Recommend doctor/emergency services for serious symptoms

Saved notes:
{saved_data}

User:
{req.message}
"""

    try:
        response = model.generate_content(prompt)

        return {
            "reply": response.text
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )