from pydantic import BaseModel

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str

class MemoryRequest(BaseModel):
    title: str
    content: str

class GymPlanRequest(BaseModel):
    title: str
    goal: str
    plan: str

class StudyPlanRequest(BaseModel):
    subject: str
    goal: str
    plan: str

class MedicationRequest(BaseModel):
    medicine_name: str
    dosage: str
    reminder_time: str
    note: str

class SymptomRequest(BaseModel):
    symptom: str
    severity: int
    note: str

class MoodRequest(BaseModel):
    mood: str
    energy_level: int
    stress_level: int
    note: str

class SleepRequest(BaseModel):
    hours: float
    quality: str
    note: str

class WaterRequest(BaseModel):
    glasses: int


class AccountabilityRequest(BaseModel):
    drank_water: str
    studied: str
    worked_out: str
    mood: str
    sleep: str
    note: str = ""


class WeeklyGoalRequest(BaseModel):
    goal: str