import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RepoInput from "../components/RepoInput";
import PersonaSelector from "../components/PersonaSelector";
import FocusAreaSelector from "../components/FocusAreaSelector";
import ResumeInput from "../components/ResumeInput";
import { parseRepo, parseUrl, startSession, startInterview } from "../services/api";
import { Grain, Logo, FlameIcon, LogoutButton, ThemeToggle } from "../components/shared";
import { useAuth } from "../context/AuthContext";

function Stat({ label, value, tone }) {
  const color = tone === "amber" ? "var(--accent-amber)" : "var(--text-primary)";
  return (
    <div style={{ background: "var(--bg-card)", padding: "12px 14px" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [persona, setPersona] = useState(null);
  const [focusAreas, setFocusAreas] = useState([]);
  const [parsedRepo, setParsedRepo] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const [appMode, setAppMode] = useState("pitch");
  const [interviewData, setInterviewData] = useState(null);
  const [interviewPersona, setInterviewPersona] = useState(null);

  async function handleParseRepo(url, mode = "github", description = "") {
    setError(""); setIsParsing(true); setParsedRepo(null); setRepoUrl(url); setProjectDescription(description);
    try {
      const result = mode === "url" ? await parseUrl(url, description) : await parseRepo(url);
      setParsedRepo(result);
    } catch (e) {
      setError(e.response?.data?.detail || (mode === "url" ? "Failed to fetch URL. Is it publicly accessible?" : "Failed to parse repo. Is it public?"));
    } finally { setIsParsing(false); }
  }

  async function handleStartSession() {
    if (!parsedRepo || !persona) return;
    setError(""); setIsStarting(true);
    try {
      const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
      const { session_id, first_message } = await startSession(repoUrl, persona, focusAreas, projectDescription, displayName);
      navigate("/session", { state: { session_id, first_message, persona, repoUrl, mode: "pitch" } });
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to start session.");
      setIsStarting(false);
    }
  }

  async function handleStartInterview() {
    if (!interviewData || !interviewPersona) return;
    setError(""); setIsStarting(true);
    try {
      const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
      const { session_id, first_message } = await startInterview(
        interviewData.file, interviewData.githubUrl, interviewData.role, interviewPersona, displayName
      );
      navigate("/session", { state: { session_id, first_message, persona: interviewPersona, mode: "interview" } });
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to start interview. Check your GitHub URL and try again.");
      setIsStarting(false);
    }
  }

  const canEnter = appMode === "pitch" ? (!!parsedRepo && !!persona) : (!!interviewData && !!interviewPersona);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      <header className="page-header">
        <Logo size="sm" />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link to="/leaderboard" className="btn btn-ghost home-nav-leaderboard" style={{ padding: "6px 12px", fontSize: 14 }}>Leaderboard</Link>
          <Link to="/profile" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 14 }}>Profile</Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="page-main">
        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 36, border: "1px solid var(--border-default)", width: "fit-content" }}>
          {["pitch", "interview"].map((m) => (
            <button
              key={m}
              onClick={() => { setAppMode(m); setError(""); }}
              className={appMode === m ? "btn btn-primary" : "btn btn-ghost"}
              style={{ padding: "8px 24px", fontSize: 13, letterSpacing: "0.08em", borderRadius: 0, border: "none" }}
            >
              {m === "pitch" ? "Project Pitch" : "Interview Prep"}
            </button>
          ))}
        </div>

        {appMode === "pitch" ? (
          <>
            <div style={{ marginBottom: 48 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="live-dot" /> Pitch Practice · Live
              </div>
              <h1 className="hero-title">
                Get grilled <span style={{ color: "var(--accent-red)" }}>before</span><br />the real thing.
              </h1>
              <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
                Drop a repo. Pick your interrogator. Survive twelve questions designed
                to find every weak spot in your pitch — so the real meeting doesn't.
              </p>
            </div>

            <RepoInput onParsed={handleParseRepo} isLoading={isParsing} />

            {isParsing && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 20, marginTop: 12 }}>
                <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 10, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: "55%" }} />
              </div>
            )}

            {parsedRepo && !isParsing && (
              <div className="fade-in" style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderLeft: "2px solid var(--accent-green)", padding: 20, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--accent-green)", letterSpacing: "0.18em", textTransform: "uppercase" }}>✓ Parsed</span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{parsedRepo.owner}/{parsedRepo.repo_name}</span>
                </div>
                <div className="stat-grid">
                  {parsedRepo.file_count > 0 && <Stat label="Files" value={parsedRepo.file_count} />}
                  <Stat label="Stack" value={parsedRepo.tech_stack.slice(0, 3).join(" · ") || "—"} />
                  <Stat label="Status" value="Ready" tone="amber" />
                </div>
              </div>
            )}

            <PersonaSelector selected={persona} onChange={setPersona} />
            <FocusAreaSelector selected={focusAreas} onChange={setFocusAreas} />
          </>
        ) : (
          <>
            <div style={{ marginBottom: 48 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-red)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="live-dot" /> Interview Practice · Live
              </div>
              <h1 className="hero-title">
                Get grilled <span style={{ color: "var(--accent-red)" }}>before</span><br />the real interview.
              </h1>
              <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
                Upload your resume. Drop your GitHub. Pick an interviewer. Walk out knowing exactly where you'll get destroyed.
              </p>
            </div>

            <ResumeInput onReady={setInterviewData} />

            <div>
              <div className="section-divider"><span>02 · Choose Your Interviewer</span></div>
              <div className="interview-persona-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
                {[
                  { id: "behavioral", title: "BEHAVIORAL", quote: "Tell me about yourself. No buzzwords.", cares: ["STAR answers", "Gaps", "Culture fit", "Pressure"], sub: "HR Interviewer · 12 yrs · Heard every rehearsed answer" },
                  { id: "resume_deepdive", title: "RESUME DEEP-DIVE", quote: "I've read your resume twice. I have questions.", cares: ["Claims", "Gaps", "Skills", "Consistency"], sub: "Senior Recruiter · Goes line by line · No bluffing" },
                ].map((p, i) => (
                  <div
                    key={p.id}
                    className={`persona-card ${interviewPersona === p.id ? "selected" : ""}`}
                    onClick={() => setInterviewPersona(p.id)}
                  >
                    <div className="selector" />
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.22em", marginBottom: 12 }}>0{i + 1}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.02em", marginBottom: 4, color: interviewPersona === p.id ? "var(--accent-red)" : "var(--text-primary)" }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>{p.sub}</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.5, marginBottom: 18, minHeight: 42 }}>
                      "{p.quote}"
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.cares.map((c) => (
                        <span key={c} className="mono" style={{ fontSize: 10, padding: "4px 8px", border: "1px solid var(--border-default)", color: "var(--text-secondary)", letterSpacing: "0.06em" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div className="cta-row">
          <button
            className="btn btn-primary btn-large"
            disabled={!canEnter || isStarting}
            onClick={appMode === "pitch" ? handleStartSession : handleStartInterview}
            style={{ minWidth: 260 }}
          >
            <FlameIcon size={16} color="#fff" />
            {isStarting ? "Entering the Hot Seat…" : "Enter the Hot Seat"}
          </button>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {appMode === "pitch" && !parsedRepo && !persona && "› Parse repo · Pick persona"}
            {appMode === "pitch" && parsedRepo && !persona && "› Pick a persona to continue"}
            {appMode === "pitch" && !parsedRepo && persona && "› Parse a repo to continue"}
            {appMode === "interview" && !interviewData && !interviewPersona && "› Upload resume · Pick interviewer"}
            {appMode === "interview" && interviewData && !interviewPersona && "› Pick an interviewer to continue"}
            {appMode === "interview" && !interviewData && interviewPersona && "› Upload resume to continue"}
            {canEnter && "› Average session: 8 minutes"}
          </div>
        </div>
      </main>

      <footer className="page-footer">
        <div className="mono" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>No coddling. No participation trophies.</div>
        <button className="btn btn-ghost" onClick={() => navigate("/history")} style={{ padding: "6px 12px", fontSize: 11 }}>
          History
        </button>
      </footer>
    </div>
  );
}
