import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Droplets,
  Dumbbell,
  Heart,
  LineChart,
  Loader2,
  LogOut,
  Menu,
  Mic,
  MicOff,
  Moon,
  Pill,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Target,
  User,
  X,
  Zap
} from "lucide-react";
import "./App.css";

const API = "https://nursemate-ai-production.up.railway.app";

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getError = (err) =>
  err?.response?.data?.detail ||
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Something went wrong. Please check backend logs.";

const NAV = [
  {
    section: "Intelligence",
    items: [
      { id: "chat", label: "AI Agent", icon: Bot },
      { id: "profile", label: "AI Profile", icon: Sparkles },
      { id: "command", label: "Command Center", icon: Target },
      { id: "patterns", label: "Patterns", icon: Brain }
    ]
  },
  {
    section: "Tracking",
    items: [
      { id: "accountability", label: "Accountability", icon: ShieldCheck },
      { id: "mood", label: "Mood", icon: Heart },
      { id: "sleep", label: "Sleep", icon: Moon },
      { id: "water", label: "Water", icon: Droplets },
      { id: "symptom", label: "Symptoms", icon: Stethoscope }
    ]
  },
  {
    section: "Planning",
    items: [
      { id: "gym", label: "Gym Planner", icon: Dumbbell },
      { id: "study", label: "Study Planner", icon: BookOpen },
      { id: "med", label: "Medication", icon: Pill },
      { id: "memory", label: "Memory", icon: ClipboardList },
      { id: "reports", label: "Reports", icon: BarChart3 }
    ]
  }
];

const PAGE_META = {
  chat: {
    title: "AI Agent",
    sub: "Your personal wellness intelligence agent"
  },
  profile: {
    title: "AI Lifestyle Profile",
    sub: "A living summary of your habits, stress, sleep, study, and goals"
  },
  command: {
    title: "Daily Command Center",
    sub: "Body score, mind score, and today’s best action"
  },
  patterns: {
    title: "Pattern Intelligence",
    sub: "Find hidden links between sleep, stress, workouts, and focus"
  },
  accountability: {
    title: "Night Accountability",
    sub: "End your day with a quick honest check-in"
  },
  mood: {
    title: "Mood Tracker",
    sub: "Capture mood, energy, stress, and context"
  },
  sleep: {
    title: "Sleep Tracker",
    sub: "Track hours and sleep quality"
  },
  water: {
    title: "Water Tracker",
    sub: "Hydration log for better daily consistency"
  },
  symptom: {
    title: "Symptom Tracker",
    sub: "Log symptoms for pattern tracking, not diagnosis"
  },
  gym: {
    title: "Gym Planner",
    sub: "Save workout goals and plans"
  },
  study: {
    title: "Study Planner",
    sub: "Save study goals and focused plans"
  },
  med: {
    title: "Medication Reminders",
    sub: "Save reminder details and notes"
  },
  memory: {
    title: "Personal Memory",
    sub: "Teach the AI what it should remember"
  },
  reports: {
    title: "Reports",
    sub: "Daily AI plan and weekly wellness review"
  }
};

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nm_user") || "null");
    } catch {
      return null;
    }
  });

  const onAuth = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("nm_user", JSON.stringify(newUser || null));
    setToken(newToken);
    setUser(newUser || null);
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nm_user");
    setToken(null);
    setUser(null);
  };

  return (
    <div className="nm-app">
      {!token ? (
        <AuthPage onAuth={onAuth} />
      ) : (
        <Dashboard user={user} onLogout={onLogout} />
      )}
    </div>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "register") {
        await api.post("/register", {
          full_name: fullName,
          email,
          password
        });

        setSuccess("Account created successfully. Please login now.");
        setMode("login");
        setPassword("");
        return;
      }

      const { data } = await api.post("/login", { email, password });
      const jwt = data?.token || data?.access_token || data?.jwt;

      if (!jwt) throw new Error("Login response did not include token.");

      onAuth(jwt, data?.user || { email, full_name: fullName });
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <section className="auth-brand-panel">
        <div className="brand-line">
          <div className="brand-mark">
            <Stethoscope size={24} />
          </div>
          <div>
            <h2>
              NurseMate <span>AI Pro</span>
            </h2>
            <p>Personal Wellness Intelligence Agent</p>
          </div>
        </div>

        <div className="auth-hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> AI-powered daily guidance
          </span>
          <h1>Your private wellness command center.</h1>
          <p>
            Track mood, sleep, water, symptoms, workouts, study plans,
            medication reminders, and daily habits in one polished dashboard.
          </p>
        </div>

        <div className="feature-stack">
          <Feature
            icon={Target}
            title="Daily Command Center"
            text="Body and mind scores with clear next steps."
          />
          <Feature
            icon={Brain}
            title="Pattern Intelligence"
            text="Detect links between sleep, stress, mood, and consistency."
          />
          <Feature
            icon={Shield}
            title="Safe Wellness Guidance"
            text="General wellness support only — not medical diagnosis."
          />
        </div>
      </section>

      <section className="auth-card-wrap">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="muted">
            {mode === "login"
              ? "Login to continue your wellness journey."
              : "Create your NurseMate AI profile."}
          </p>

          {error && <Alert type="error" text={error} />}
          {success && <Alert type="success" text={success} />}

          {mode === "register" && (
            <Field label="Full name">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mayank Surani"
                required
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={17} /> Working...
              </>
            ) : (
              <>
                {mode === "login" ? "Login" : "Create account"}{" "}
                <ChevronRight size={17} />
              </>
            )}
          </button>

          <p className="tiny-note">
            General wellness guidance only. For emergencies, contact emergency
            services.
          </p>
        </form>
      </section>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const meta = PAGE_META[page] || PAGE_META.chat;
  const displayName = user?.full_name || user?.name || user?.email || "Member";
  const initial = displayName?.[0]?.toUpperCase() || "U";

  const openPage = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="shell">
      <div
        className={sidebarOpen ? "sidebar-backdrop show" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <div className="brand-mark small">
            <Stethoscope size={18} />
          </div>
          <div>
            <h2>
              NurseMate <span>AI</span>
            </h2>
            <p>Pro · Wellness OS</p>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="nav-list">
          {NAV.map((group) => (
            <div className="nav-group" key={group.section}>
              <h6>{group.section}</h6>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={page === item.id ? "nav-item active" : "nav-item"}
                    onClick={() => openPage(item.id)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="avatar">{initial}</div>
          <div className="user-info">
            <b>{displayName}</b>
            <small>{user?.email || "Signed in"}</small>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Logout">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="mobile-topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <b>
            NurseMate <span>AI</span>
          </b>
          <button className="icon-btn" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>

        <header className="topbar">
          <div>
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className="online-pill">
            <span /> Agent online
          </div>
        </header>

        {page === "chat" && <ChatPage />}
        {page === "profile" && <ProfilePage />}
        {page === "command" && <CommandCenterPage />}
        {page === "patterns" && <PatternsPage />}
        {page === "accountability" && <AccountabilityPage />}
        {page === "mood" && <MoodPage />}
        {page === "sleep" && <SleepPage />}
        {page === "water" && <WaterPage />}
        {page === "symptom" && <SymptomPage />}
        {page === "gym" && <GymPage />}
        {page === "study" && <StudyPage />}
        {page === "med" && <MedicationPage />}
        {page === "memory" && <MemoryPage />}
        {page === "reports" && <ReportsPage />}
      </main>
    </div>
  );
}

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/chat-history");
      const list = Array.isArray(data) ? data : data?.history || data?.messages || [];

      const expanded = [];

      list.forEach((m, i) => {
        if (m.user_message) {
          expanded.push({ id: `u-${i}`, role: "user", text: m.user_message });
        }
        if (m.ai_response) {
          expanded.push({ id: `a-${i}`, role: "assistant", text: m.ai_response });
        }
        if (!m.user_message && !m.ai_response) {
          expanded.push({
            id: m.id || i,
            role: m.role || "assistant",
            text: m.message || m.text || m.content || ""
          });
        }
      });

      setMessages(expanded);
    } catch {
      setMessages([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendMessage = async (customText) => {
    const text = (customText ?? input).trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);

    try {
      const { data } = await api.post("/chat", { message: text });
      const reply =
        data?.reply ||
        data?.response ||
        data?.ai_response ||
        data?.message ||
        JSON.stringify(data);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: reply }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          text: "⚠️ " + getError(err)
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + text);
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  const suggestions = [
    "I slept 5 hours. How should I adjust today?",
    "Build me a 90-minute study block.",
    "Plan a simple gym routine for this week.",
    "Why do I feel tired after studying?"
  ];

  return (
    <section className="chat-page">
      <div className="chat-disclaimer">
        <Shield size={15} />
        General wellness guidance only. Not medical diagnosis.
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {historyLoading ? (
          <EmptyState icon={Loader2} spin title="Loading history" text="Getting your previous chats..." />
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">
              <Bot size={32} />
            </div>
            <h3>Meet your wellness agent</h3>
            <p>
              Ask about sleep, training, recovery, mood, study focus, habits, or
              your daily plan.
            </p>

            <div className="suggest-grid">
              {suggestions.map((item) => (
                <button key={item} onClick={() => sendMessage(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.role === "user" ? "msg-row user" : "msg-row"}
            >
              <div className={msg.role === "user" ? "msg-avatar user" : "msg-avatar"}>
                {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={msg.role === "user" ? "bubble user" : "bubble"}>
                {msg.text}
              </div>
            </div>
          ))
        )}

        {sending && (
          <div className="msg-row">
            <div className="msg-avatar">
              <Bot size={15} />
            </div>
            <div className="bubble typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-wrap">
        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask your AI agent..."
          />

          <button
            className={recording ? "voice recording" : "voice"}
            onClick={toggleVoice}
            title="Voice input"
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            className="send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
          >
            {sending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/profile");
      setProfile(data?.profile || data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  const generateProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/profile/generate", {});
      setProfile(data?.profile || data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <section className="page-stack">
      {error && <Alert type="error" text={error} />}

      <div className="action-card">
        <div>
          <h2>AI User Profile</h2>
          <p>
            Generate a profile from your workout style, stress level, sleep,
            study weakness, medication reminders, and weekly goals.
          </p>
        </div>

        <div className="button-row">
          <button className="btn btn-primary" onClick={generateProfile} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="spin" size={16} /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate / Update
              </>
            )}
          </button>

          <button className="btn btn-ghost" onClick={loadProfile} disabled={loading}>
            Load Profile
          </button>
        </div>
      </div>

      {!profile ? (
        <EmptyState
          icon={Sparkles}
          title="No profile loaded"
          text="Generate your AI lifestyle profile to see insights here."
        />
      ) : (
        <>
          <div className="grid-3">
            <InfoCard icon={Dumbbell} title="Workout Style">
              {profile.workout_style || "—"}
            </InfoCard>
            <InfoCard icon={Brain} title="Stress Profile">
              {profile.stress_profile || "—"}
            </InfoCard>
            <InfoCard icon={Moon} title="Sleep Pattern">
              {profile.sleep_pattern || "—"}
            </InfoCard>
            <InfoCard icon={BookOpen} title="Study Weakness">
              {profile.study_weakness || "—"}
            </InfoCard>
            <InfoCard icon={Pill} title="Medication Summary">
              {profile.medication_summary ||
                profile.medication_reminders ||
                "—"}
            </InfoCard>
            <InfoCard icon={Target} title="Weekly Goals">
              {profile.weekly_goals || "—"}
            </InfoCard>
          </div>

          <Panel title="AI Summary" icon={Sparkles} meta="Profile insight">
            <div className="report-text">
              {profile.ai_summary ||
                profile.summary ||
                "Generate your profile to see a personalized summary."}
            </div>
          </Panel>
        </>
      )}
    </section>
  );
}

function CommandCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCommandCenter = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/command-center");
      setData(data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandCenter();
  }, []);

  const bodyScore = data?.body_score ?? data?.bodyScore ?? null;
  const mindScore = data?.mind_score ?? data?.mindScore ?? null;
  const report =
    data?.command_center ||
    data?.recommendation ||
    data?.ai_recommendation ||
    data?.report ||
    "";

  return (
    <section className="page-stack">
      {error && <Alert type="error" text={error} />}

      <div className="button-row">
        <button className="btn btn-primary" onClick={loadCommandCenter} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="spin" size={16} /> Loading...
            </>
          ) : (
            <>
              <Zap size={16} /> Generate Today’s Command Center
            </>
          )}
        </button>
      </div>

      <div className="grid-2">
        <ScoreCard title="Body Score" icon={Activity} value={bodyScore} />
        <ScoreCard title="Mind Score" icon={Brain} value={mindScore} />
      </div>

      <Panel title="Today’s AI Recommendation" icon={Zap} meta="Daily">
        <div className="report-text">
          {report || "Log your daily data to unlock a useful recommendation."}
        </div>
      </Panel>
    </section>
  );
}

function PatternsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPatterns = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/patterns");
      setData(data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatterns();
  }, []);

  const rules =
    data?.rule_patterns ||
    data?.rule_based ||
    data?.patterns ||
    data?.rules ||
    [];

  const aiPatterns =
    data?.ai_patterns ||
    data?.ai_report ||
    data?.report ||
    data?.ai_pattern_report ||
    "";

  return (
    <section className="page-stack">
      {error && <Alert type="error" text={error} />}

      <div className="button-row">
        <button className="btn btn-primary" onClick={loadPatterns} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="spin" size={16} /> Detecting...
            </>
          ) : (
            <>
              <LineChart size={16} /> Detect My Patterns
            </>
          )}
        </button>
      </div>

      <Panel title="Rule-Based Patterns" icon={Brain} meta="Detected">
        <div className="chip-grid">
          {Array.isArray(rules) && rules.length > 0 ? (
            rules.map((item, index) => (
              <span className="chip" key={index}>
                <Sparkles size={13} />
                {typeof item === "string"
                  ? item
                  : item.message || item.pattern || JSON.stringify(item)}
              </span>
            ))
          ) : (
            <p className="muted">No rule-based patterns yet. Keep logging daily.</p>
          )}
        </div>
      </Panel>

      <Panel title="AI Pattern Report" icon={LineChart} meta="Insight">
        <div className="report-text">
          {aiPatterns || "Log more data so the AI can detect meaningful trends."}
        </div>
      </Panel>
    </section>
  );
}

function AccountabilityPage() {
  const fields = [
    {
      name: "drank_water",
      label: "Did you drink water?",
      type: "select",
      options: ["", "yes", "no"]
    },
    {
      name: "studied",
      label: "Did you study?",
      type: "select",
      options: ["", "yes", "no"]
    },
    {
      name: "worked_out",
      label: "Did you workout?",
      type: "select",
      options: ["", "yes", "no"]
    },
    {
      name: "mood",
      label: "How was your mood?",
      placeholder: "Good, low, stressed..."
    },
    {
      name: "sleep",
      label: "How was your sleep?",
      placeholder: "Good, average, poor..."
    },
    {
      name: "note",
      label: "Extra note",
      type: "textarea",
      placeholder: "Anything the AI should know about today..."
    }
  ];

  return (
    <SimpleForm
      icon={ShieldCheck}
      title="Night Accountability Check-In"
      endpoint="/accountability"
      success="Night accountability saved"
      fields={fields}
    />
  );
}

function MoodPage() {
  return (
    <SimpleForm
      icon={Heart}
      title="Log Mood"
      endpoint="/mood"
      success="Mood logged"
      fields={[
        { name: "mood", label: "Mood", placeholder: "Happy, tired, stressed...", required: true },
        {
          name: "energy_level",
          label: "Energy Level",
          type: "range",
          min: 1,
          max: 10,
          defaultValue: 5
        },
        {
          name: "stress_level",
          label: "Stress Level",
          type: "range",
          min: 1,
          max: 10,
          defaultValue: 5
        },
        {
          name: "note",
          label: "Note",
          type: "textarea",
          placeholder: "What affected your mood?"
        }
      ]}
    />
  );
}

function SleepPage() {
  return (
    <SimpleForm
      icon={Moon}
      title="Log Sleep"
      endpoint="/sleep"
      success="Sleep logged"
      fields={[
        {
          name: "hours",
          label: "Hours Slept",
          type: "number",
          defaultValue: 7,
          required: true
        },
        {
          name: "quality",
          label: "Quality",
          placeholder: "Good, average, poor..."
        },
        {
          name: "note",
          label: "Note",
          type: "textarea",
          placeholder: "Woke up late, interrupted sleep..."
        }
      ]}
    />
  );
}

function WaterPage() {
  return (
    <SimpleForm
      icon={Droplets}
      title="Log Water Intake"
      endpoint="/water"
      success="Water intake logged"
      fields={[
        {
          name: "glasses",
          label: "Glasses",
          type: "number",
          defaultValue: 8,
          required: true
        }
      ]}
    />
  );
}

function SymptomPage() {
  return (
    <SimpleForm
      icon={Stethoscope}
      title="Log Symptom"
      endpoint="/symptom"
      success="Symptom logged"
      fields={[
        {
          name: "symptom",
          label: "Symptom",
          placeholder: "Headache, cough, fatigue...",
          required: true
        },
        {
          name: "severity",
          label: "Severity",
          type: "range",
          min: 1,
          max: 10,
          defaultValue: 5
        },
        {
          name: "note",
          label: "Note",
          type: "textarea",
          placeholder: "When did it start? What made it worse?"
        }
      ]}
    />
  );
}

function GymPage() {
  return (
    <SimpleForm
      icon={Dumbbell}
      title="Save Gym Plan"
      endpoint="/gym-plan"
      success="Gym plan saved"
      fields={[
        {
          name: "title",
          label: "Title",
          placeholder: "May workout plan",
          required: true
        },
        {
          name: "goal",
          label: "Goal",
          placeholder: "Build muscle, lose fat, improve stamina...",
          required: true
        },
        {
          name: "plan",
          label: "Plan",
          type: "textarea",
          placeholder: "Write your workout split, exercises, days...",
          required: true
        }
      ]}
    />
  );
}

function StudyPage() {
  return (
    <SimpleForm
      icon={BookOpen}
      title="Save Study Plan"
      endpoint="/study-plan"
      success="Study plan saved"
      fields={[
        {
          name: "subject",
          label: "Subject",
          placeholder: "Database, nursing, Java...",
          required: true
        },
        {
          name: "goal",
          label: "Goal",
          placeholder: "Finish chapter 3, prepare quiz...",
          required: true
        },
        {
          name: "plan",
          label: "Study Plan",
          type: "textarea",
          placeholder: "Pomodoro plan, topics, practice questions...",
          required: true
        }
      ]}
    />
  );
}

function MedicationPage() {
  return (
    <SimpleForm
      icon={Pill}
      title="Save Medication Reminder"
      endpoint="/medication"
      success="Medication reminder saved"
      fields={[
        {
          name: "medicine_name",
          label: "Medicine Name",
          placeholder: "Vitamin D",
          required: true
        },
        {
          name: "dosage",
          label: "Dosage",
          placeholder: "1000 IU",
          required: true
        },
        {
          name: "reminder_time",
          label: "Reminder Time",
          placeholder: "08:00 AM",
          required: true
        },
        {
          name: "note",
          label: "Note",
          type: "textarea",
          placeholder: "Take with food..."
        }
      ]}
    />
  );
}

function MemoryPage() {
  return (
    <SimpleForm
      icon={ClipboardList}
      title="Save Personal Memory"
      endpoint="/memory"
      success="Memory saved"
      fields={[
        {
          name: "title",
          label: "Title",
          placeholder: "Workout preference",
          required: true
        },
        {
          name: "content",
          label: "What should AI remember?",
          type: "textarea",
          placeholder: "I study best at night...",
          required: true
        }
      ]}
    />
  );
}

function ReportsPage() {
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [dailyLoading, setDailyLoading] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState("");

  const getDailyPlan = async () => {
    setDailyLoading(true);
    setError("");

    try {
      const { data } = await api.get("/daily-plan");
      setDaily(
        data?.plan ||
          data?.daily_plan ||
          data?.report ||
          JSON.stringify(data, null, 2)
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setDailyLoading(false);
    }
  };

  const getWeeklyReport = async () => {
    setWeeklyLoading(true);
    setError("");

    try {
      const { data } = await api.get("/weekly-report");
      setWeekly(
        data?.report ||
          data?.weekly_report ||
          data?.summary ||
          JSON.stringify(data, null, 2)
      );
    } catch (err) {
      setError(getError(err));
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <section className="page-stack">
      {error && <Alert type="error" text={error} />}

      <div className="grid-2">
        <Panel title="Daily AI Plan" icon={Sun} meta="Today">
          <button
            className="btn btn-primary"
            onClick={getDailyPlan}
            disabled={dailyLoading}
          >
            {dailyLoading ? (
              <>
                <Loader2 className="spin" size={16} /> Generating...
              </>
            ) : (
              "Generate Daily Plan"
            )}
          </button>
          <div className="report-text spaced">
            {daily || "Your daily plan will appear here."}
          </div>
        </Panel>

        <Panel title="Weekly Wellness Report" icon={Calendar} meta="Last 7 days">
          <button
            className="btn btn-primary"
            onClick={getWeeklyReport}
            disabled={weeklyLoading}
          >
            {weeklyLoading ? (
              <>
                <Loader2 className="spin" size={16} /> Generating...
              </>
            ) : (
              "Generate Weekly Report"
            )}
          </button>
          <div className="report-text spaced">
            {weekly || "Your weekly report will appear here."}
          </div>
        </Panel>
      </div>
    </section>
  );
}

function SimpleForm({ icon: Icon, title, endpoint, success, fields }) {
  const initial = Object.fromEntries(
    fields.map((field) => [field.name, field.defaultValue ?? ""])
  );

  const [form, setForm] = useState(initial);
  const [state, setState] = useState({
    loading: false,
    error: "",
    success: ""
  });

  const setValue = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: "", success: "" });

    try {
      await api.post(endpoint, form);
      setState({ loading: false, error: "", success });
      setForm(initial);
    } catch (err) {
      setState({ loading: false, error: getError(err), success: "" });
    }
  };

  return (
    <section className="page-stack">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-head">
          <div className="panel-title">
            <div className="card-icon">
              <Icon size={18} />
            </div>
            <h2>{title}</h2>
          </div>
        </div>

        {state.error && <Alert type="error" text={state.error} />}
        {state.success && <Alert type="success" text={state.success} />}

        <div className="form-grid">
          {fields.map((field) => (
            <Field key={field.name} label={field.label} wide={field.type === "textarea"}>
              {field.type === "textarea" ? (
                <textarea
                  value={form[field.name] || ""}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === "range" ? (
                <div className="range-row">
                  <input
                    type="range"
                    min={field.min || 1}
                    max={field.max || 10}
                    value={form[field.name] || field.defaultValue || field.min || 1}
                    onChange={(e) => setValue(field.name, Number(e.target.value))}
                  />
                  <span>{form[field.name] || field.defaultValue || field.min || 1}</span>
                </div>
              ) : field.type === "select" ? (
                <select
                  value={form[field.name] || ""}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  required={field.required}
                >
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt ? opt.toUpperCase() : "Select"}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  value={form[field.name] ?? ""}
                  onChange={(e) =>
                    setValue(
                      field.name,
                      field.type === "number" ? Number(e.target.value) : e.target.value
                    )
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </Field>
          ))}
        </div>

        <button className="btn btn-primary" disabled={state.loading} type="submit">
          {state.loading ? (
            <>
              <Loader2 className="spin" size={16} /> Saving...
            </>
          ) : (
            <>
              Save <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="feature">
      <div>
        <Icon size={16} />
      </div>
      <section>
        <b>{title}</b>
        <p>{text}</p>
      </section>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Alert({ type, text }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`alert ${type}`}>
      <Icon size={16} /> {text}
    </div>
  );
}

function Panel({ title, icon: Icon, meta, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">
          <div className="card-icon">
            <Icon size={18} />
          </div>
          <h2>{title}</h2>
        </div>
        {meta && <span>{meta}</span>}
      </div>

      {children}
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="info-card">
      <div className="info-head">
        <div className="card-icon">
          <Icon size={17} />
        </div>
        <h3>{title}</h3>
      </div>
      <p>{typeof children === "string" ? children : JSON.stringify(children)}</p>
    </div>
  );
}

function ScoreCard({ title, icon: Icon, value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="score-card">
      <div className="score-label">
        <Icon size={15} /> {title}
      </div>
      <strong>{value !== null && value !== undefined ? `${value}/100` : "—"}</strong>
      <div className="progress">
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, spin, title, text }) {
  return (
    <div className="empty-chat">
      <div className="empty-icon">
        <Icon className={spin ? "spin" : ""} size={30} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}