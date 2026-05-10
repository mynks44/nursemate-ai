from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from groq import Groq
from dotenv import load_dotenv
import os

from database import Base, engine, SessionLocal
from models import (
    User,
    ChatMessage,
    Memory,
    GymPlan,
    StudyPlan,
    MedicationReminder,
    SymptomLog,
    MoodLog,
    SleepLog,
    WaterLog
)
from schemas import (
    RegisterRequest,
    LoginRequest,
    ChatRequest,
    MemoryRequest,
    GymPlanRequest,
    StudyPlanRequest,
    MedicationRequest,
    SymptomRequest,
    MoodRequest,
    SleepRequest,
    WaterRequest
)
from auth import hash_password, verify_password, create_token, verify_token


# Load local .env file
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NurseMate AI Pro")


# ✅ Correct CORS for Vercel + localhost
# For now, this is fully open because your app uses token auth, not cookies.
# This fixes: No Access-Control-Allow-Origin header.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Groq setup
api_key = os.getenv("GROQ_API_KEY")

if api_key:
    client = Groq(api_key=api_key)
else:
    client = None


EMERGENCY_WORDS = [
    "chest pain",
    "can't breathe",
    "cannot breathe",
    "stroke",
    "suicide",
    "overdose",
    "severe bleeding",
    "fainting",
    "unconscious",
    "heart attack",
    "seizure"
]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "").strip()
    payload = verify_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == payload["email"]).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@app.get("/")
def home():
    return {"status": "NurseMate AI Pro running"}


@app.get("/version")
def version():
    return {
        "version": "cors-fixed-v3",
        "cors": "enabled",
        "backend": "backend/main.py"
    }


@app.get("/debug-env")
def debug_env():
    return {"has_groq_key": bool(api_key)}


@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        full_name=req.full_name,
        email=req.email,
        password=hash_password(req.password)
    )

    db.add(user)
    db.commit()

    return {"message": "Account created successfully"}


@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token({"email": user.email})

    return {
        "token": token,
        "user": {
            "name": user.full_name,
            "email": user.email
        }
    }


@app.post("/chat")
def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    lowered = req.message.lower()

    for word in EMERGENCY_WORDS:
        if word in lowered:
            emergency_reply = (
                "This may be urgent. I cannot diagnose you. "
                "Please call emergency services immediately or contact a healthcare professional right now."
            )

            db.add(ChatMessage(user_id=user.id, role="user", message=req.message))
            db.add(ChatMessage(user_id=user.id, role="assistant", message=emergency_reply))
            db.commit()

            return {"reply": emergency_reply}

    memories = db.query(Memory).filter(Memory.user_id == user.id).all()
    gym_plans = db.query(GymPlan).filter(GymPlan.user_id == user.id).all()
    study_plans = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).all()
    medications = db.query(MedicationReminder).filter(MedicationReminder.user_id == user.id).all()

    symptoms = (
        db.query(SymptomLog)
        .filter(SymptomLog.user_id == user.id)
        .order_by(SymptomLog.id.desc())
        .limit(5)
        .all()
    )

    moods = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == user.id)
        .order_by(MoodLog.id.desc())
        .limit(5)
        .all()
    )

    sleeps = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == user.id)
        .order_by(SleepLog.id.desc())
        .limit(5)
        .all()
    )

    context = ""

    for item in memories:
        context += f"Memory - {item.title}: {item.content}\n"

    for item in gym_plans:
        context += f"Gym Plan - {item.title}, Goal: {item.goal}, Plan: {item.plan}\n"

    for item in study_plans:
        context += f"Study Plan - {item.subject}, Goal: {item.goal}, Plan: {item.plan}\n"

    for item in medications:
        context += (
            f"Medication - {item.medicine_name}, "
            f"Dosage: {item.dosage}, "
            f"Time: {item.reminder_time}, "
            f"Note: {item.note}\n"
        )

    for item in symptoms:
        context += f"Recent Symptom - {item.symptom}, Severity: {item.severity}, Note: {item.note}\n"

    for item in moods:
        context += (
            f"Recent Mood - {item.mood}, "
            f"Energy: {item.energy_level}, "
            f"Stress: {item.stress_level}, "
            f"Note: {item.note}\n"
        )

    for item in sleeps:
        context += f"Recent Sleep - {item.hours} hours, Quality: {item.quality}, Note: {item.note}\n"

    db.add(ChatMessage(user_id=user.id, role="user", message=req.message))
    db.commit()

    prompt = f"""
You are NurseMate AI Pro.

You are not just a chatbot.
You are a personal wellness, fitness, study, habit, and lifestyle AI agent.

Important safety rules:
- You are not a doctor.
- Never diagnose.
- Never prescribe medicine.
- Give general wellness information only.
- For serious symptoms, tell the user to contact emergency services.
- For medication questions, tell the user to confirm with a doctor or pharmacist.
- Be clear, practical, and supportive.

User:
Name: {user.full_name}
Email: {user.email}

Saved user context:
{context}

User message:
{req.message}

Reply in a professional, clean, personalized way.
Use headings and simple steps.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        reply = response.choices[0].message.content

        db.add(ChatMessage(user_id=user.id, role="assistant", message=reply))
        db.commit()

        return {"reply": reply}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat-history")
def chat_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.id.asc())
        .all()
    )


@app.post("/memory")
def save_memory(
    req: MemoryRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = Memory(user_id=user.id, title=req.title, content=req.content)
    db.add(item)
    db.commit()
    return {"message": "Memory saved"}


@app.get("/memories")
def get_memories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Memory).filter(Memory.user_id == user.id).all()


@app.post("/gym-plan")
def save_gym_plan(
    req: GymPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = GymPlan(
        user_id=user.id,
        title=req.title,
        goal=req.goal,
        plan=req.plan
    )

    db.add(item)
    db.commit()

    return {"message": "Gym plan saved"}


@app.get("/gym-plans")
def get_gym_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(GymPlan).filter(GymPlan.user_id == user.id).all()


@app.post("/study-plan")
def save_study_plan(
    req: StudyPlanRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = StudyPlan(
        user_id=user.id,
        subject=req.subject,
        goal=req.goal,
        plan=req.plan
    )

    db.add(item)
    db.commit()

    return {"message": "Study plan saved"}


@app.get("/study-plans")
def get_study_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(StudyPlan).filter(StudyPlan.user_id == user.id).all()


@app.post("/medication")
def save_medication(
    req: MedicationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = MedicationReminder(
        user_id=user.id,
        medicine_name=req.medicine_name,
        dosage=req.dosage,
        reminder_time=req.reminder_time,
        note=req.note
    )

    db.add(item)
    db.commit()

    return {"message": "Medication reminder saved"}


@app.get("/medications")
def get_medications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(MedicationReminder).filter(MedicationReminder.user_id == user.id).all()


@app.post("/symptom")
def save_symptom(
    req: SymptomRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = SymptomLog(
        user_id=user.id,
        symptom=req.symptom,
        severity=req.severity,
        note=req.note
    )

    db.add(item)
    db.commit()

    return {"message": "Symptom logged"}


@app.get("/symptoms")
def get_symptoms(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()


@app.post("/mood")
def save_mood(
    req: MoodRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = MoodLog(
        user_id=user.id,
        mood=req.mood,
        energy_level=req.energy_level,
        stress_level=req.stress_level,
        note=req.note
    )

    db.add(item)
    db.commit()

    return {"message": "Mood logged"}


@app.post("/sleep")
def save_sleep(
    req: SleepRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = SleepLog(
        user_id=user.id,
        hours=req.hours,
        quality=req.quality,
        note=req.note
    )

    db.add(item)
    db.commit()

    return {"message": "Sleep logged"}


@app.post("/water")
def save_water(
    req: WaterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = WaterLog(
        user_id=user.id,
        glasses=req.glasses
    )

    db.add(item)
    db.commit()

    return {"message": "Water intake logged"}


@app.get("/daily-plan")
def daily_plan(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    prompt = f"""
Create a professional daily wellness plan for {user.full_name}.

Include:
- Morning routine
- Workout suggestion
- Study/productivity block
- Hydration
- Meal guidance
- Evening wind-down
- Safe reminder that this is general wellness guidance
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        return {"plan": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/weekly-report")
def weekly_report(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()
    moods = db.query(MoodLog).filter(MoodLog.user_id == user.id).all()
    sleeps = db.query(SleepLog).filter(SleepLog.user_id == user.id).all()
    waters = db.query(WaterLog).filter(WaterLog.user_id == user.id).all()

    data = f"""
Symptoms: {[s.symptom for s in symptoms]}
Moods: {[m.mood for m in moods]}
Sleep hours: {[s.hours for s in sleeps]}
Water glasses: {[w.glasses for w in waters]}
"""

    prompt = f"""
Create a weekly wellness report for {user.full_name}.

Data:
{data}

Include:
- Summary
- Positive patterns
- Areas to improve
- Safe wellness suggestions
- Reminder to consult a healthcare professional for medical concerns
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        return {"report": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))