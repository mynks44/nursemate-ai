from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime
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
    WaterLog,
    UserProfile,
    AccountabilityLog
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
    WaterRequest,
    AccountabilityRequest
)
from auth import hash_password, verify_password, create_token, verify_token


load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NurseMate AI Pro")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def extract_section(text, start_label, end_label=None):
    try:
        start = text.index(start_label) + len(start_label)

        if end_label:
            end = text.index(end_label)
            return text[start:end].strip()

        return text[start:].strip()

    except ValueError:
        return ""


def get_user_context(user: User, db: Session):
    memories = db.query(Memory).filter(Memory.user_id == user.id).all()
    gym_plans = db.query(GymPlan).filter(GymPlan.user_id == user.id).all()
    study_plans = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).all()
    medications = db.query(MedicationReminder).filter(MedicationReminder.user_id == user.id).all()
    symptoms = db.query(SymptomLog).filter(SymptomLog.user_id == user.id).all()
    moods = db.query(MoodLog).filter(MoodLog.user_id == user.id).all()
    sleeps = db.query(SleepLog).filter(SleepLog.user_id == user.id).all()
    waters = db.query(WaterLog).filter(WaterLog.user_id == user.id).all()
    accountability = db.query(AccountabilityLog).filter(AccountabilityLog.user_id == user.id).all()

    context = ""

    for item in memories:
        context += f"Memory: {item.title} - {item.content}\n"

    for item in gym_plans:
        context += f"Gym Plan: {item.title}, Goal: {item.goal}, Plan: {item.plan}\n"

    for item in study_plans:
        context += f"Study Plan: {item.subject}, Goal: {item.goal}, Plan: {item.plan}\n"

    for item in medications:
        context += (
            f"Medication: {item.medicine_name}, "
            f"Dosage: {item.dosage}, "
            f"Time: {item.reminder_time}, "
            f"Note: {item.note}\n"
        )

    for item in symptoms:
        context += (
            f"Symptom: {item.symptom}, "
            f"Severity: {item.severity}, "
            f"Note: {item.note}, "
            f"Date: {item.created_at}\n"
        )

    for item in moods:
        context += (
            f"Mood: {item.mood}, "
            f"Energy: {item.energy_level}, "
            f"Stress: {item.stress_level}, "
            f"Note: {item.note}, "
            f"Date: {item.created_at}\n"
        )

    for item in sleeps:
        context += (
            f"Sleep: {item.hours} hours, "
            f"Quality: {item.quality}, "
            f"Note: {item.note}, "
            f"Date: {item.created_at}\n"
        )

    for item in waters:
        context += f"Water: {item.glasses} glasses, Date: {item.created_at}\n"

    for item in accountability:
        context += (
            f"Accountability: "
            f"water={item.drank_water}, "
            f"studied={item.studied}, "
            f"worked_out={item.worked_out}, "
            f"mood={item.mood}, "
            f"sleep={item.sleep}, "
            f"note={item.note}, "
            f"date={item.created_at}\n"
        )

    return context


def calculate_body_score(db: Session, user: User):
    sleeps = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == user.id)
        .order_by(SleepLog.id.desc())
        .limit(7)
        .all()
    )

    waters = (
        db.query(WaterLog)
        .filter(WaterLog.user_id == user.id)
        .order_by(WaterLog.id.desc())
        .limit(7)
        .all()
    )

    accountability = (
        db.query(AccountabilityLog)
        .filter(AccountabilityLog.user_id == user.id)
        .order_by(AccountabilityLog.id.desc())
        .limit(7)
        .all()
    )

    score = 70

    if sleeps:
        avg_sleep = sum(s.hours for s in sleeps) / len(sleeps)

        if avg_sleep >= 7:
            score += 10
        elif avg_sleep < 6:
            score -= 15

    if waters:
        avg_water = sum(w.glasses for w in waters) / len(waters)

        if avg_water >= 8:
            score += 10
        elif avg_water < 5:
            score -= 10

    workout_yes = [
        a for a in accountability
        if a.worked_out and a.worked_out.lower() in ["yes", "y", "done"]
    ]

    if len(workout_yes) >= 3:
        score += 10

    return max(0, min(100, score))


def calculate_mind_score(db: Session, user: User):
    moods = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == user.id)
        .order_by(MoodLog.id.desc())
        .limit(7)
        .all()
    )

    accountability = (
        db.query(AccountabilityLog)
        .filter(AccountabilityLog.user_id == user.id)
        .order_by(AccountabilityLog.id.desc())
        .limit(7)
        .all()
    )

    score = 70

    if moods:
        avg_stress = sum(m.stress_level for m in moods) / len(moods)
        avg_energy = sum(m.energy_level for m in moods) / len(moods)

        if avg_stress >= 8:
            score -= 20
        elif avg_stress <= 4:
            score += 10

        if avg_energy >= 7:
            score += 10
        elif avg_energy <= 4:
            score -= 10

    studied_yes = [
        a for a in accountability
        if a.studied and a.studied.lower() in ["yes", "y", "done"]
    ]

    if len(studied_yes) >= 4:
        score += 10

    return max(0, min(100, score))


@app.get("/")
def home():
    return {"status": "NurseMate AI Pro running"}


@app.get("/version")
def version():
    return {
        "version": "ai-profile-command-center-patterns-v1",
        "cors": "enabled",
        "backend": "backend/main.py"
    }


@app.get("/debug-env")
def debug_env():
    return {"has_groq_key": bool(api_key)}


@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
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

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


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

    context = get_user_context(user, db)

    db.add(ChatMessage(user_id=user.id, role="user", message=req.message))
    db.commit()

    prompt = f"""
You are NurseMate AI Pro.

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

    context = get_user_context(user, db)

    prompt = f"""
Create a professional daily wellness plan for {user.full_name}.

User context:
{context}

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

    context = get_user_context(user, db)

    prompt = f"""
Create a weekly wellness report for {user.full_name}.

User data:
{context}

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


@app.post("/profile/generate")
def generate_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    context = get_user_context(user, db)

    prompt = f"""
You are building a personal AI lifestyle profile for this user.

User name: {user.full_name}

Analyze the saved user data below and create a clear profile.

Data:
{context}

Return exactly in this format:

Workout Style:
...

Stress Profile:
...

Sleep Pattern:
...

Study Weakness:
...

Medication Reminder Summary:
...

Weekly Goals:
...

AI Summary:
...
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        text = response.choices[0].message.content

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

        if not profile:
            profile = UserProfile(user_id=user.id)
            db.add(profile)

        profile.workout_style = extract_section(text, "Workout Style:", "Stress Profile:")
        profile.stress_profile = extract_section(text, "Stress Profile:", "Sleep Pattern:")
        profile.sleep_pattern = extract_section(text, "Sleep Pattern:", "Study Weakness:")
        profile.study_weakness = extract_section(text, "Study Weakness:", "Medication Reminder Summary:")
        profile.medication_summary = extract_section(text, "Medication Reminder Summary:", "Weekly Goals:")
        profile.weekly_goals = extract_section(text, "Weekly Goals:", "AI Summary:")
        profile.ai_summary = extract_section(text, "AI Summary:", None)
        profile.updated_at = datetime.utcnow()

        db.commit()

        return {
            "message": "AI profile generated",
            "profile": {
                "workout_style": profile.workout_style,
                "stress_profile": profile.stress_profile,
                "sleep_pattern": profile.sleep_pattern,
                "study_weakness": profile.study_weakness,
                "medication_summary": profile.medication_summary,
                "weekly_goals": profile.weekly_goals,
                "ai_summary": profile.ai_summary
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/profile")
def get_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()

    if not profile:
        return {
            "message": "No profile yet. Generate profile first.",
            "profile": None
        }

    return {
        "workout_style": profile.workout_style,
        "stress_profile": profile.stress_profile,
        "sleep_pattern": profile.sleep_pattern,
        "study_weakness": profile.study_weakness,
        "medication_summary": profile.medication_summary,
        "weekly_goals": profile.weekly_goals,
        "ai_summary": profile.ai_summary,
        "updated_at": profile.updated_at
    }


@app.get("/command-center")
def command_center(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    body_score = calculate_body_score(db, user)
    mind_score = calculate_mind_score(db, user)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    context = get_user_context(user, db)

    profile_text = ""

    if profile:
        profile_text = f"""
Workout Style: {profile.workout_style}
Stress Profile: {profile.stress_profile}
Sleep Pattern: {profile.sleep_pattern}
Study Weakness: {profile.study_weakness}
Medication Summary: {profile.medication_summary}
Weekly Goals: {profile.weekly_goals}
AI Summary: {profile.ai_summary}
"""

    prompt = f"""
Create today's Daily Command Center for {user.full_name}.

Body Score: {body_score}/100
Mind Score: {mind_score}/100

User Profile:
{profile_text}

User Data:
{context}

Return exactly this format:

Today's Body Score:
{body_score}/100 - short explanation

Today's Mind Score:
{mind_score}/100 - short explanation

Workout Recommendation:
...

Study Recommendation:
...

Risk Warning:
...

One Small Habit:
...
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "body_score": body_score,
            "mind_score": mind_score,
            "command_center": response.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/accountability-questions")
def accountability_questions():
    return {
        "questions": [
            "Did you drink enough water today?",
            "Did you study today?",
            "Did you work out today?",
            "How was your mood today?",
            "How was your sleep last night?"
        ]
    }


@app.post("/accountability")
def save_accountability(
    req: AccountabilityRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = AccountabilityLog(
        user_id=user.id,
        drank_water=req.drank_water,
        studied=req.studied,
        worked_out=req.worked_out,
        mood=req.mood,
        sleep=req.sleep,
        note=req.note
    )

    db.add(log)
    db.commit()

    return {"message": "Accountability check-in saved"}


@app.get("/accountability-history")
def accountability_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = (
        db.query(AccountabilityLog)
        .filter(AccountabilityLog.user_id == user.id)
        .order_by(AccountabilityLog.id.desc())
        .limit(30)
        .all()
    )

    return logs


@app.get("/patterns")
def detect_patterns(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not client:
        raise HTTPException(status_code=500, detail="Groq API key missing")

    moods = db.query(MoodLog).filter(MoodLog.user_id == user.id).all()
    sleeps = db.query(SleepLog).filter(SleepLog.user_id == user.id).all()
    accountability = db.query(AccountabilityLog).filter(AccountabilityLog.user_id == user.id).all()

    rule_patterns = []

    if moods and sleeps:
        high_stress_count = len([m for m in moods if m.stress_level >= 7])
        low_sleep_count = len([s for s in sleeps if s.hours < 6])

        if high_stress_count > 0 and low_sleep_count > 0:
            rule_patterns.append("Your stress seems higher when your sleep is below 6 hours.")

    workout_yes = [
        a for a in accountability
        if a.worked_out and a.worked_out.lower() in ["yes", "y", "done"]
    ]

    workout_no = [
        a for a in accountability
        if a.worked_out and a.worked_out.lower() in ["no", "n", "missed"]
    ]

    if len(workout_no) > len(workout_yes):
        rule_patterns.append("Your workout consistency may be low. You may need smaller, easier workout goals.")

    studied_yes = [
        a for a in accountability
        if a.studied and a.studied.lower() in ["yes", "y", "done"]
    ]

    if len(studied_yes) >= 3:
        rule_patterns.append("You show a positive study pattern when you check in consistently.")

    context = get_user_context(user, db)

    prompt = f"""
You are a pattern detection AI for a wellness and productivity app.

Find practical patterns from this user's data.

User data:
{context}

Rule-based patterns:
{rule_patterns}

Return:
1. Top Patterns
2. Possible Causes
3. What To Improve
4. One Smart Recommendation

Do not diagnose medical conditions.
Keep it practical and safe.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}]
        )

        return {
            "rule_patterns": rule_patterns,
            "ai_patterns": response.choices[0].message.content
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/dev-reset-db")
def dev_reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Database reset successfully"}