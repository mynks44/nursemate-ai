import { useEffect, useState } from "react";
import axios from "axios";
import {
  Send,
  Mic,
  Dumbbell,
  BookOpen,
  Pill,
  Brain,
  Moon,
  Droplets,
  HeartPulse,
  LogOut,
  Activity,
  Sparkles
} from "lucide-react";
import "./App.css";

const API = "https://YOUR-RAILWAY-URL.up.railway.app";

function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [auth, setAuth] = useState({ full_name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [memory, setMemory] = useState({ title: "", content: "" });
  const [gym, setGym] = useState({ title: "", goal: "", plan: "" });
  const [study, setStudy] = useState({ subject: "", goal: "", plan: "" });
  const [med, setMed] = useState({ medicine_name: "", dosage: "", reminder_time: "", note: "" });
  const [symptom, setSymptom] = useState({ symptom: "", severity: 5, note: "" });
  const [mood, setMood] = useState({ mood: "", energy_level: 5, stress_level: 5, note: "" });
  const [sleep, setSleep] = useState({ hours: 7, quality: "", note: "" });
  const [water, setWater] = useState({ glasses: 8 });

  const [dailyPlan, setDailyPlan] = useState("");
  const [weeklyReport, setWeeklyReport] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    if (token) {
      setPage("dashboard");
      loadHistory();
    }
  }, [token]);

  const register = async () => {
    await axios.post(`${API}/register`, auth);
    alert("Account created. Login now.");
    setPage("login");
  };

  const login = async () => {
    const res = await axios.post(`${API}/login`, {
      email: auth.email,
      password: auth.password
    });

    localStorage.setItem("token", res.data.token);
    setToken(res.data.token);
    setPage("dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("login");
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/chat-history`, { headers });
      setChats(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const text = message;
    setMessage("");
    setAiLoading(true);

    setChats((prev) => [...prev, { role: "user", message: text }]);

    try {
      const res = await axios.post(`${API}/chat`, { message: text }, { headers });
      setChats((prev) => [...prev, { role: "assistant", message: res.data.reply }]);
    } catch (err) {
      alert("AI error. Check backend.");
    }

    setAiLoading(false);
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (event) => {
      setMessage(event.results[0][0].transcript);
    };
  };

  const saveData = async (endpoint, data, successMessage) => {
    await axios.post(`${API}${endpoint}`, data, { headers });
    alert(successMessage);
  };

  const getDailyPlan = async () => {
    const res = await axios.get(`${API}/daily-plan`, { headers });
    setDailyPlan(res.data.plan);
  };

  const getWeeklyReport = async () => {
    const res = await axios.get(`${API}/weekly-report`, { headers });
    setWeeklyReport(res.data.report);
  };

  if (page === "login") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>NurseMate AI Pro</h1>
          <p>The personal wellness, fitness, study, and habit intelligence agent.</p>

          <input placeholder="Email" onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input placeholder="Password" type="password" onChange={(e) => setAuth({ ...auth, password: e.target.value })} />

          <button onClick={login}>Login</button>

          <p>
            New here? <span onClick={() => setPage("register")}>Create account</span>
          </p>
        </div>
      </div>
    );
  }

  if (page === "register") {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Create Account</h1>

          <input placeholder="Full Name" onChange={(e) => setAuth({ ...auth, full_name: e.target.value })} />
          <input placeholder="Email" onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
          <input placeholder="Password" type="password" onChange={(e) => setAuth({ ...auth, password: e.target.value })} />

          <button onClick={register}>Register</button>

          <p>
            Already registered? <span onClick={() => setPage("login")}>Login</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <Sparkles />
          <h2>NurseMate</h2>
        </div>

        <button onClick={() => setPage("dashboard")}><Brain size={18} /> AI Agent</button>
        <button onClick={() => setPage("memory")}><Activity size={18} /> Memory</button>
        <button onClick={() => setPage("gym")}><Dumbbell size={18} /> Gym</button>
        <button onClick={() => setPage("study")}><BookOpen size={18} /> Study</button>
        <button onClick={() => setPage("med")}><Pill size={18} /> Medication</button>
        <button onClick={() => setPage("symptom")}><HeartPulse size={18} /> Symptoms</button>
        <button onClick={() => setPage("mood")}><Brain size={18} /> Mood</button>
        <button onClick={() => setPage("sleep")}><Moon size={18} /> Sleep</button>
        <button onClick={() => setPage("water")}><Droplets size={18} /> Water</button>
        <button onClick={() => setPage("reports")}><Sparkles size={18} /> Reports</button>
        <button onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>

      <main>
        {page === "dashboard" && (
          <>
            <div className="hero-card">
              <h1>Personal Wellness Intelligence Agent</h1>
              <p>
                Ask anything about your routine, fitness, study plan, habits, medication reminders,
                symptoms, mood, sleep, and daily productivity.
              </p>
              <div className="disclaimer">
                General wellness guidance only. Not medical diagnosis. For emergencies, contact emergency services.
              </div>
            </div>

            <div className="chat-box">
              {chats.map((c, i) => (
                <div key={i} className={c.role === "user" ? "user-msg" : "ai-msg"}>
                  {c.message}
                </div>
              ))}

              {aiLoading && <div className="ai-msg">Thinking...</div>}
            </div>

            <div className="input-row">
              <button onClick={startVoice}><Mic /></button>
              <input
                value={message}
                placeholder="Ask your AI agent..."
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}><Send /></button>
            </div>
          </>
        )}

        {page === "memory" && (
          <FormCard title="Personal AI Memory">
            <input placeholder="Title" onChange={(e) => setMemory({ ...memory, title: e.target.value })} />
            <textarea placeholder="What should the AI remember?" onChange={(e) => setMemory({ ...memory, content: e.target.value })} />
            <button onClick={() => saveData("/memory", memory, "Memory saved")}>Save Memory</button>
          </FormCard>
        )}

        {page === "gym" && (
          <FormCard title="Gym Planner">
            <input placeholder="Title" onChange={(e) => setGym({ ...gym, title: e.target.value })} />
            <input placeholder="Goal" onChange={(e) => setGym({ ...gym, goal: e.target.value })} />
            <textarea placeholder="Your gym plan" onChange={(e) => setGym({ ...gym, plan: e.target.value })} />
            <button onClick={() => saveData("/gym-plan", gym, "Gym plan saved")}>Save Gym Plan</button>
          </FormCard>
        )}

        {page === "study" && (
          <FormCard title="Study Planner">
            <input placeholder="Subject" onChange={(e) => setStudy({ ...study, subject: e.target.value })} />
            <input placeholder="Goal" onChange={(e) => setStudy({ ...study, goal: e.target.value })} />
            <textarea placeholder="Study plan" onChange={(e) => setStudy({ ...study, plan: e.target.value })} />
            <button onClick={() => saveData("/study-plan", study, "Study plan saved")}>Save Study Plan</button>
          </FormCard>
        )}

        {page === "med" && (
          <FormCard title="Medication Reminder">
            <input placeholder="Medicine Name" onChange={(e) => setMed({ ...med, medicine_name: e.target.value })} />
            <input placeholder="Dosage" onChange={(e) => setMed({ ...med, dosage: e.target.value })} />
            <input placeholder="Reminder Time" onChange={(e) => setMed({ ...med, reminder_time: e.target.value })} />
            <textarea placeholder="Note" onChange={(e) => setMed({ ...med, note: e.target.value })} />
            <button onClick={() => saveData("/medication", med, "Medication reminder saved")}>Save Reminder</button>
          </FormCard>
        )}

        {page === "symptom" && (
          <FormCard title="Symptom Tracker">
            <input placeholder="Symptom" onChange={(e) => setSymptom({ ...symptom, symptom: e.target.value })} />
            <input type="number" placeholder="Severity 1-10" onChange={(e) => setSymptom({ ...symptom, severity: Number(e.target.value) })} />
            <textarea placeholder="Note" onChange={(e) => setSymptom({ ...symptom, note: e.target.value })} />
            <button onClick={() => saveData("/symptom", symptom, "Symptom logged")}>Log Symptom</button>
          </FormCard>
        )}

        {page === "mood" && (
          <FormCard title="Mood Tracker">
            <input placeholder="Mood" onChange={(e) => setMood({ ...mood, mood: e.target.value })} />
            <input type="number" placeholder="Energy 1-10" onChange={(e) => setMood({ ...mood, energy_level: Number(e.target.value) })} />
            <input type="number" placeholder="Stress 1-10" onChange={(e) => setMood({ ...mood, stress_level: Number(e.target.value) })} />
            <textarea placeholder="Note" onChange={(e) => setMood({ ...mood, note: e.target.value })} />
            <button onClick={() => saveData("/mood", mood, "Mood logged")}>Log Mood</button>
          </FormCard>
        )}

        {page === "sleep" && (
          <FormCard title="Sleep Tracker">
            <input type="number" placeholder="Hours slept" onChange={(e) => setSleep({ ...sleep, hours: Number(e.target.value) })} />
            <input placeholder="Quality" onChange={(e) => setSleep({ ...sleep, quality: e.target.value })} />
            <textarea placeholder="Note" onChange={(e) => setSleep({ ...sleep, note: e.target.value })} />
            <button onClick={() => saveData("/sleep", sleep, "Sleep logged")}>Log Sleep</button>
          </FormCard>
        )}

        {page === "water" && (
          <FormCard title="Water Intake">
            <input type="number" placeholder="Glasses" onChange={(e) => setWater({ glasses: Number(e.target.value) })} />
            <button onClick={() => saveData("/water", water, "Water intake logged")}>Log Water</button>
          </FormCard>
        )}

        {page === "reports" && (
          <div className="report-grid">
            <div className="report-card">
              <h2>Daily AI Plan</h2>
              <button onClick={getDailyPlan}>Generate Daily Plan</button>
              <pre>{dailyPlan}</pre>
            </div>

            <div className="report-card">
              <h2>Weekly Wellness Report</h2>
              <button onClick={getWeeklyReport}>Generate Weekly Report</button>
              <pre>{weeklyReport}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div className="form-card">
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export default App;