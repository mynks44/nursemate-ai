from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class GymPlan(Base):
    __tablename__ = "gym_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    goal = Column(String)
    plan = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subject = Column(String)
    goal = Column(String)
    plan = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class MedicationReminder(Base):
    __tablename__ = "medication_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    medicine_name = Column(String)
    dosage = Column(String)
    reminder_time = Column(String)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symptom = Column(String)
    severity = Column(Integer)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    mood = Column(String)
    energy_level = Column(Integer)
    stress_level = Column(Integer)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    hours = Column(Float)
    quality = Column(String)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class WaterLog(Base):
    __tablename__ = "water_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    glasses = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)