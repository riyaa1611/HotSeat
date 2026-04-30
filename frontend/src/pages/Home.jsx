import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RepoInput from "../components/RepoInput";
import PersonaSelector from "../components/PersonaSelector";
import { parseRepo, startSession } from "../services/api";
import { Grain, Logo, FlameIcon } from "../components/shared";

function Stat({ label, value, tone }) {
  const color = tone === "amber" ? "var(--accent-amber)" : "var(--text-primary)";
  return (
    <div style={{ background: "var(--bg-card)", padding: "12px 14px" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState(null);
  const [parsedRepo, setParsedRepo] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleParseRepo(url) {
    setError("");
    setIsParsing(true);
    setParsedRepo(null);
    setRepoUrl(url);
    try {
      const result = await parseRepo(url);
      setParsedRepo(result);
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to parse repo. Is it public?");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleStartSession() {
    if (!parsedRepo || !persona) return;
    setError("");
    setIsStarting(true);
    try {
      const { session_id, first_message } = await startSession(repoUrl, persona);
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
      {/* Nav */}
      <header style={{
        padding: "20px 32px", borderBottom: "1px solid var(--border-default)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Logo size="sm" />
        <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          v1.0 · Beta
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 880, margin: "0 auto", width: "100%", padding: "64px 32px 96px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 56 }}>
          <div className="mono" style={{
            fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--accent-red)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span className="live-dot" /> Pitch Practice · Live
          </div>
          <h1 style={{
            fontSize: 64, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0, margin: "0 0 16px",
          }}>
            Get grilled <span style={{ color: "var(--accent-red)" }}>before</span><br />the real thing.
          </h1>
          <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 560, lineHeight: 1.5, margin: 0 }}>
            Drop a repo. Pick your interrogator. Survive twelve questions designed
            to find every weak spot in your pitch — so the real meeting doesn't.
          </p>
        </div>

        {/* Repo input */}
        <RepoInput onParsed={handleParseRepo} isLoading={isParsing} />

        {/* Skeleton */}
        {isParsing && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: 20, marginTop: 12 }}>
            <div className="skeleton" style={{ height: 14, width: "40%", marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 10, width: "70%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 10, width: "55%" }} />
          </div>
        )}

        {/* Repo summary */}
        {parsedRepo && !isParsing && (
          <div className="fade-in" style={{
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            borderLeft: "2px solid var(--accent-green)", padding: 20, marginTop: 12,
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--accent-green)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                ✓ Parsed
              </span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{parsedRepo.owner}/{parsedRepo.repo_name}</span>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
              background: "var(--border-default)", border: "1px solid var(--border-default)",
            }}>
              <Stat label="Files" value={parsedRepo.file_count} />
              <Stat label="Stack" value={parsedRepo.tech_stack.slice(0, 3).join(" · ") || "—"} />
              <Stat label="Status" value="Ready" tone="amber" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12, padding: "14px 16px",
            background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)",
            color: "var(--accent-red)", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Persona selector */}
        <PersonaSelector selected={persona} onChange={setPersona} />

        {/* CTA */}
        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16 }}>
          <button
            className="btn btn-primary btn-large"
            disabled={!canEnter || isStarting}
            onClick={handleStartSession}
            style={{ minWidth: 280 }}
          >
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

      <footer style={{
        borderTop: "1px solid var(--border-default)", padding: "20px 32px",
        display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)",
      }}>
        <div className="mono" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>
          No coddling. No participation trophies.
        </div>
      </footer>
    </div>
  );
}
