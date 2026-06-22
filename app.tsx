import { useState, useRef, useEffect } from "react";

const EDUCATION_OPTIONS = [
  { value: "", label: "-- Select --" },
  { value: "class8", label: "Class 8" },
  { value: "class9", label: "Class 9" },
  { value: "class10", label: "Class 10" },
  { value: "class11", label: "Class 11" },
  { value: "class12", label: "Class 12" },
  { value: "diploma", label: "Diploma / Polytechnic" },
  { value: "btech", label: "B.Tech / B.E." },
  { value: "bsc", label: "B.Sc" },
  { value: "bcom", label: "B.Com" },
  { value: "ba", label: "B.A." },
  { value: "degree", label: "Other Degree (UG)" },
  { value: "pharmacy", label: "B.Pharmacy" },
  { value: "mba", label: "MBA" },
  { value: "mtech", label: "M.Tech / M.E." },
  { value: "msc", label: "M.Sc" },
  { value: "ma", label: "M.A. / M.Com" },
  { value: "phd", label: "Ph.D" },
  { value: "dropout", label: "Currently not enrolled" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "-- Select --" },
  { value: "General", label: "General / Open" },
  { value: "OBC", label: "OBC (Other Backward Class)" },
  { value: "SC", label: "SC (Scheduled Caste)" },
  { value: "ST", label: "ST (Scheduled Tribe)" },
  { value: "EBC", label: "EBC (Economically Backward Class)" },
  { value: "Minority", label: "Minority" },
  { value: "DNT", label: "DNT (De-notified Tribe)" },
];

const STATE_OPTIONS = [
  { value: "", label: "-- Select --" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Telangana", label: "Telangana" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Delhi", label: "Delhi" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Bihar", label: "Bihar" },
  { value: "West Bengal", label: "West Bengal" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Haryana", label: "Haryana" },
  { value: "Kerala", label: "Kerala" },
  { value: "Other", label: "Other State" },
];

const LOADING_MESSAGES = [
  "Analyzing your profile...",
  "Checking eligibility criteria...",
  "Consulting AI for your personalized plan...",
  "Almost there — preparing your results...",
];

function getMarksLabel(education: string): string {
  switch (education) {
    case "class8": return "Class 7 Percentage (%)";
    case "class9": return "Class 8 Percentage (%)";
    case "class10": return "Class 9 Percentage (%)";
    case "class11": return "Class 10 Percentage (%)";
    case "class12": return "Class 11 Percentage (%)";
    default: return "Class 12 Percentage (%)";
  }
}

function getMarksHint(education: string): string {
  switch (education) {
    case "class8": return "Enter your Class 7 marks";
    case "class9": return "Enter your Class 8 marks";
    case "class10": return "Enter your Class 9 marks";
    case "class11": return "Enter your Class 10 (board) marks";
    case "class12": return "Enter your Class 11 marks";
    default: return "Enter 0 if not applicable";
  }
}

interface EligibleProgram {
  name: string;
  short_desc: string;
  benefit: string;
  portal: string;
  deadline: string;
  documents: string[];
  source: string;
}

interface IneligibleProgram {
  name: string;
  reasons: string[];
}

interface AnalyzeResult {
  student: { name: string };
  eligible: EligibleProgram[];
  ineligible: IneligibleProgram[];
  ai_explanation: string;
  action_plan: string[];
}

interface ChatMessage {
  role: "user" | "advisor";
  text: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.9rem", border: "1.5px solid #E5E7EB",
  borderRadius: "8px", fontSize: "0.95rem", background: "#F9FAFB",
  color: "#1F2937", outline: "none",
};

export default function App() {
  const [form, setForm] = useState({ name: "", age: "", education: "", category: "", income: "", state: "", marks: "" });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "advisor", text: "Hi! I'm your ClearPath AI Advisor. Ask me anything about scholarships, eligibility, documents, or how to apply for government programs." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatHistory = useRef<{ role: "user" | "model"; text: string }[]>([]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function analyze() {
    if (!form.name.trim()) { alert("Please enter your name."); return; }
    const age = parseInt(form.age);
    if (!form.age || age < 14 || age > 45) { alert("Please enter a valid age (14–45)."); return; }
    if (!form.education) { alert("Please select your education level."); return; }
    if (!form.category) { alert("Please select your caste category."); return; }
    if (form.income === "") { alert("Please enter your annual family income."); return; }
    if (!form.state) { alert("Please select your state."); return; }

    setLoading(true);
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % LOADING_MESSAGES.length; setLoadingMsg(LOADING_MESSAGES[i]); }, 1500);

    try {
      const res = await fetch(`/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), age, education: form.education, category: form.category, income: parseInt(form.income) || 0, state: form.state, marks: parseInt(form.marks) || 0 }),
      });
      setResult(await res.json());
    } catch {
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  async function sendChat() {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", text: q }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: chatHistory.current }),
      });
      const data = await res.json();
      const answer = data.answer || "Sorry, I couldn't get a response. Please try again.";
      chatHistory.current = [...chatHistory.current, { role: "user", text: q }, { role: "model", text: answer }];
      setChatMessages((m) => [...m, { role: "advisor", text: answer }]);
    } catch {
      setChatMessages((m) => [...m, { role: "advisor", text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function reset() {
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F9FAFB", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        input, select, textarea { font-family: 'Inter', sans-serif; }
        .form-input { width:100%; padding:0.65rem 0.9rem; border:1.5px solid #E5E7EB; border-radius:8px; font-size:0.95rem; background:#F9FAFB; color:#1F2937; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .form-input:focus { border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,0.1); background:#fff; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .chat-bubble { animation: fadeIn 0.2s ease; }
        @media (max-width:700px) {
          .main-layout { flex-direction:column !important; }
          .advisor-col { width:100% !important; min-height:400px !important; }
          .form-grid { grid-template-columns:1fr !important; }
          .hero-h1 { font-size:1.6rem !important; }
          .program-meta { grid-template-columns:1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "linear-gradient(135deg,#1E40AF 0%,#2563EB 60%,#3B82F6 100%)", color: "white", textAlign: "center", padding: "2.5rem 1rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "2rem" }}>🧭</span>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            ClearPath <span style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: "6px", padding: "0 6px", fontSize: "1rem", fontWeight: 700, verticalAlign: "middle" }}>AI</span>
          </span>
        </div>
        <p style={{ opacity: 0.85, fontSize: "0.95rem" }}>Your personal guide to educational support programs</p>
      </header>

      {/* MAIN LAYOUT */}
      <div className="main-layout" style={{ display: "flex", gap: "1.5rem", maxWidth: "1300px", margin: "0 auto", padding: "2rem 1rem 4rem", alignItems: "flex-start" }}>

        {/* LEFT: form + results */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* HERO */}
          {!result && (
            <section style={{ textAlign: "center", padding: "1.5rem 1rem 2rem" }}>
              <h1 className="hero-h1" style={{ fontFamily: "'Sora',sans-serif", fontSize: "2.2rem", fontWeight: 800, color: "#1F2937", lineHeight: 1.2, marginBottom: "0.75rem" }}>
                Find the benefits <em style={{ color: "#2563EB", fontStyle: "normal" }}>you deserve</em>
              </h1>
              <p style={{ color: "#4B5563", fontSize: "1.05rem", maxWidth: "580px", margin: "0 auto 2rem" }}>
                Answer a few questions and our AI will match you with scholarships, fee reimbursements, and skill programs — with a step-by-step action plan.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
                {[["5+", "Programs Covered"], ["₹25K+", "Annual Benefits"], ["Free", "Always"]].map(([num, label]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#2563EB" }}>{num}</span>
                    <span style={{ fontSize: "0.8rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FORM */}
          {!result && (
            <section style={{ background: "#fff", borderRadius: "12px", padding: "2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: "2rem" }}>
              <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.4rem" }}>Student Information</h2>
              <p style={{ color: "#9CA3AF", fontSize: "0.88rem", marginBottom: "1.5rem" }}>All information is used only to match you with programs. Nothing is stored.</p>

              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.8rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>Full Name</label>
                  <input className="form-input" type="text" placeholder="e.g. Priya Sharma" value={form.name} onChange={set("name")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>Age</label>
                  <input className="form-input" type="number" placeholder="e.g. 20" value={form.age} onChange={set("age")} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>Current Education Level</label>
                  <select className="form-input" value={form.education} onChange={set("education")}>
                    {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>Caste Category</label>
                  <select className="form-input" value={form.category} onChange={set("category")}>
                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>Annual Family Income (₹)</label>
                  <input className="form-input" type="number" placeholder="e.g. 150000" value={form.income} onChange={set("income")} />
                  <small style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>Enter total household income per year</small>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>State</label>
                  <select className="form-input" value={form.state} onChange={set("state")}>
                    {STATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "#1F2937" }}>{getMarksLabel(form.education)}</label>
                  <input className="form-input" type="number" placeholder="e.g. 85" value={form.marks} onChange={set("marks")} />
                  <small style={{ color: "#9CA3AF", fontSize: "0.78rem" }}>{getMarksHint(form.education)}</small>
                </div>
              </div>

              <button onClick={analyze} style={{ width: "100%", padding: "0.9rem", background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "white", border: "none", borderRadius: "10px", fontSize: "1.05rem", fontWeight: 700, fontFamily: "'Sora',sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span>🔍</span> Find My Benefits
              </button>
            </section>
          )}

          {/* RESULTS */}
          {result && (
            <section>
              <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>🤖</span>
                  <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1rem", fontWeight: 700, color: "#1E40AF" }}>AI Analysis for {result.student.name}</h3>
                </div>
                <p style={{ color: "#1E3A8A", fontSize: "0.97rem", lineHeight: 1.7 }}>{result.ai_explanation}</p>
              </div>

              {result.eligible.length > 0 && (
                <>
                  <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#16A34A", marginBottom: "1rem" }}>✅ Programs You May Qualify For</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "0.5rem" }}>
                    {result.eligible.map((p) => (
                      <div key={p.name} style={{ background: "#fff", border: "1.5px solid #DCFCE7", borderLeft: "4px solid #16A34A", borderRadius: "12px", padding: "1.4rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "1rem", color: "#1F2937" }}>{p.name}</span>
                          <span style={{ background: "#DCFCE7", color: "#16A34A", borderRadius: "20px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>✓ Eligible</span>
                        </div>
                        <p style={{ fontSize: "0.88rem", color: "#4B5563", marginBottom: "0.8rem" }}>{p.short_desc}</p>
                        <div style={{ background: "#DCFCE7", color: "#166534", borderRadius: "8px", padding: "0.4rem 0.8rem", fontSize: "0.88rem", fontWeight: 600, display: "inline-block", marginBottom: "1rem" }}>💰 {p.benefit}</div>
                        <div style={{ marginBottom: "1rem", fontSize: "0.84rem", color: "#4B5563" }}>
                          <span><strong style={{ color: "#1F2937" }}>Deadline:</strong> {p.deadline}</span>
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: "0.4rem" }}>Documents Required</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                          {p.documents.map((d) => <span key={d} style={{ background: "#F3F4F6", borderRadius: "6px", padding: "3px 8px", fontSize: "0.8rem", color: "#4B5563" }}>{d}</span>)}
                        </div>
                        <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.76rem", color: "#9CA3AF" }}>Source: {p.source}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {result.eligible.length === 0 && (
                <div style={{ padding: "1.5rem", background: "#FEF2F2", borderRadius: "12px", border: "1.5px solid #FECACA", marginBottom: "1rem" }}>
                  <p style={{ color: "#991B1B", fontWeight: 600 }}>No matching programs found based on your current profile.</p>
                  <p style={{ color: "#7F1D1D", fontSize: "0.88rem", marginTop: "0.5rem" }}>
                    We checked 5 programs. Try visiting scholarships.gov.in for a wider search, or contact your institution's scholarship cell.
                  </p>
                </div>
              )}

              {result.action_plan && result.action_plan.length > 0 && (
                <div style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>📋</span>
                    <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1rem", fontWeight: 700, color: "#92400E" }}>Your Action Plan</h3>
                  </div>
                  <ol style={{ paddingLeft: "1.4rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {result.action_plan.map((step, i) => <li key={i} style={{ fontSize: "0.95rem", color: "#78350F", lineHeight: 1.5 }}>{step}</li>)}
                  </ol>
                </div>
              )}

              {result.ineligible.length > 0 && (
                <>
                  <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#4B5563", marginTop: "2.5rem", marginBottom: "1rem" }}>ℹ️ Other Programs Checked</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "0.5rem" }}>
                    {result.ineligible.map((p) => (
                      <div key={p.name} style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderLeft: "4px solid #9CA3AF", borderRadius: "12px", padding: "1rem 1.2rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#4B5563", marginBottom: "0.4rem" }}>❌ {p.name}</div>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {p.reasons.map((r) => <li key={r} style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>· {r}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ background: "#FEF3C7", border: "1.5px solid #FDE68A", borderRadius: "12px", padding: "1.2rem 1.5rem", marginTop: "2.5rem", fontSize: "0.88rem", color: "#78350F" }}>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: "0.5rem" }}>⚠️ Important Disclaimer</h4>
                <p>This tool provides <strong>guidance only</strong>. Eligibility shown here is based on the information you provided and may not reflect the latest government rules. Final eligibility decisions are made by the relevant authorities. Always verify on the official portal before applying.</p>
              </div>

              <button onClick={reset} style={{ marginTop: "2rem", padding: "0.65rem 1.5rem", background: "#F3F4F6", border: "1.5px solid #E5E7EB", borderRadius: "8px", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", color: "#4B5563" }}>
                ← Start Over
              </button>
            </section>
          )}
        </div>

        {/* RIGHT: AI Advisor */}
        <div className="advisor-col" style={{ width: "360px", flexShrink: 0, background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", height: "600px", position: "sticky", top: "1.5rem", overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg,#1E40AF,#2563EB)", padding: "1rem 1.2rem", display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{ width: "38px", height: "38px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ color: "white", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>AI Advisor</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem" }}>Ask anything about scholarships</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: "8px", height: "8px", background: "#4ADE80", borderRadius: "50%" }} />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem" }}>Online</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem", background: "#F8FAFF" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} className="chat-bubble" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "advisor" && (
                  <div style={{ width: "26px", height: "26px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, marginRight: "0.5rem", alignSelf: "flex-end" }}>🤖</div>
                )}
                <div style={{ maxWidth: "78%", padding: "0.6rem 0.9rem", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: msg.role === "user" ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "#fff", color: msg.role === "user" ? "white" : "#1F2937", fontSize: "0.85rem", lineHeight: 1.55, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: msg.role === "advisor" ? "1.5px solid #E5E7EB" : "none" }}>
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div style={{ width: "26px", height: "26px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, marginLeft: "0.5rem", alignSelf: "flex-end" }}>👤</div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ width: "26px", height: "26px", background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, marginRight: "0.5rem", alignSelf: "flex-end" }}>🤖</div>
                <div style={{ padding: "0.6rem 0.9rem", background: "#fff", borderRadius: "14px 14px 14px 4px", border: "1.5px solid #E5E7EB", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 150, 300].map((d) => (
                    <div key={d} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#9CA3AF", animation: `spin 1s ${d}ms ease-in-out infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {chatMessages.length === 1 && (
            <div style={{ padding: "0.5rem 1rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", borderTop: "1px solid #F3F4F6" }}>
              {["What documents do I need?", "How to apply for NSP?", "Who is eligible for OBC scholarship?"].map((q) => (
                <button key={q} onClick={() => { setChatInput(q); }} style={{ fontSize: "0.72rem", padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "20px", color: "#2563EB", cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{q}</button>
              ))}
            </div>
          )}

          <div style={{ padding: "0.8rem 1rem", borderTop: "1.5px solid #E5E7EB", display: "flex", gap: "0.5rem", background: "#fff" }}>
            <input
              style={{ ...inputStyle, flex: 1, fontSize: "0.88rem", padding: "0.55rem 0.8rem", borderRadius: "20px" }}
              placeholder="Ask about scholarships..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              style={{ width: "36px", height: "36px", background: chatInput.trim() ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "#E5E7EB", border: "none", borderRadius: "50%", cursor: chatInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ textAlign: "center", background: "white", borderRadius: "16px", padding: "2.5rem 3rem", boxShadow: "0 8px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid #BFDBFE", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ color: "#4B5563", fontWeight: 600, fontSize: "0.95rem" }}>{loadingMsg}</p>
          </div>
        </div>
      )}

      {/* DISCLAIMER */}
      <div style={{ background: "#F8FAFF", borderTop: "1px solid #E5E7EB", padding: "2rem 1rem" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", background: "#fff", border: "1.5px solid #BFDBFE", borderRadius: "12px", padding: "1.5rem 1.8rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
            <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#1E40AF" }}>ClearPath AI Disclaimer</h4>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.65 }}>
              ClearPath AI provides <strong>informational guidance only</strong> and does not guarantee eligibility or approval for any scholarship or support program.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.65 }}>
              Recommendations are based on the information entered by the user and synthetic program rules used for demonstration purposes.
            </p>
            <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.65 }}>
              Final eligibility decisions are made by <strong>official authorities</strong>. Users should verify all details through official government or educational websites before applying.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.82rem", color: "#9CA3AF", borderTop: "1px solid #E5E7EB", background: "#fff" }}>
        ClearPath AI &nbsp;·&nbsp; Built for students, by students
      </footer>
    </div>
  );
}