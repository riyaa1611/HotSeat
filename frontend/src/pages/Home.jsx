import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import RepoInput from "../components/RepoInput";
import PersonaSelector from "../components/PersonaSelector";
import FocusAreaSelector from "../components/FocusAreaSelector";
import { parseRepo, parseUrl, startSession } from "../services/api";
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
      navigate("/session", { state: { session_id, first_message, persona, repoUrl } });
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to start session.");
      setIsStarting(false);
    }
  }

  const canEnter = !!parsedRepo && !!persona;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      <header className="page-header">
        <Logo size="sm" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<Link to="/leaderboard" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 11 }}>Leaderboard</Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="page-main">
        {/* Hero */}
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

        {error && (
          <div style={{ marginTop: 12, padding: "14px 16px", background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)", color: "var(--accent-red)", fontSize: 14 }}>
            {error}
          </div>
        )}

        <PersonaSelector selected={persona} onChange={setPersona} />
        <FocusAreaSelector selected={focusAreas} onChange={setFocusAreas} />

        <div className="cta-row">
          <button className="btn btn-primary btn-large" disabled={!canEnter || isStarting} onClick={handleStartSession} style={{ minWidth: 260 }}>
            <FlameIcon size={16} color="#fff" />
            {isStarting ? "Entering the Hot Seat…" : "Enter the Hot Seat"}
          </button>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {!parsedRepo && !persona && "› Parse repo · Pick persona"}
            {parsedRepo && !persona && "› Pick a persona to continue"}
            {!parsedRepo && persona && "› Parse a repo to continue"}
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
