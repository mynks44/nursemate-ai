from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
import os

app = FastAPI()

api_key = os.getenv("GROQ_API_KEY")

if api_key:
    client = Groq(api_key=api_key)
else:
    client = None

memory = []

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def home():
    return {
        "status": "NurseMate AI running with Groq"
    }

@app.get("/debug-env")
def debug():
    return {
        "has_groq_key": bool(api_key)
    }

@app.post("/save")
def save(req: ChatRequest):
    memory.append(req.message)

    return {
        "saved": req.message
    }

@app.post("/chat")
def chat(req: ChatRequest):

    if not client:
        raise HTTPException(
            status_code=500,
            detail="Groq API key missing"
        )

    saved_data = "\n".join(memory)

    prompt = f"""
You are NurseMate AI.

Rules:
- Give general wellness guidance only
- Never diagnose diseases
- Tell user to contact emergency services for serious symptoms

Saved notes:
{saved_data}

User:
{req.message}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        reply = response.choices[0].message.content

        return {
            "reply": reply
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )