import { useState } from "react";

const GITHUB_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;
const URL_PATTERN = /^https?:\/\/.+\..+/;

function GitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v3a3 3 0 0 1-3 3H9" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function RepoInput({ onParsed, isLoading }) {
  const [mode, setMode] = useState("github");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function validate(value) {
    if (!value) return mode === "github" ? "Paste a GitHub repo URL." : "Paste your deployed project URL.";
    if (mode === "github" && !GITHUB_PATTERN.test(value.trim()))
      return "Use the full https://github.com/owner/repo format.";
    if (mode === "url" && !URL_PATTERN.test(value.trim()))
      return "Enter a valid URL starting with https://";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(url);
    if (err) { setError(err); return; }
    setError("");
    onParsed(url.trim(), mode, description.trim());
  }

  function switchMode(next) {
    setMode(next);
    setUrl("");
    setDescription("");
    setError("");
  }

  const tabStyle = (active) => ({
    padding: "7px 16px",
    fontSize: 11,
    fontFamily: "var(--font-mono, monospace)",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    cursor: "pointer",
    border: "none",
    background: active ? "var(--accent-red)" : "transparent",
    color: active ? "#fff" : "var(--text-muted)",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-divider"><span>01 · Your Project</span></div>

      <div style={{ display: "flex", marginBottom: 10, border: "1px solid var(--border-default)", width: "fit-content" }}>
        <button type="button" style={tabStyle(mode === "github")} onClick={() => switchMode("github")}>
          GitHub Repo
        </button>
        <button type="button" style={{ ...tabStyle(mode === "url"), borderLeft: "1px solid var(--border-default)" }} onClick={() => switchMode("url")}>
          Live URL
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "flex", alignItems: "center",
          }}>
            {mode === "github" ? <GitIcon /> : <GlobeIcon />}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder={mode === "github" ? "https://github.com/owner/repo" : "https://yourproject.vercel.app"}
            style={{ paddingLeft: 40 }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="btn btn-ghost"
          disabled={isLoading || !url.trim()}
          style={{ minWidth: 140 }}
        >
          {isLoading ? "Analyzing…" : mode === "github" ? "Parse Repo" : "Analyze URL"}
        </button>
      </div>
      {mode === "url" && (
        <div style={{ marginTop: 10 }}>
          <label className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
            Describe your project <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>(optional — helps if it's a SPA)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. A full-stack SaaS for tracking freelance invoices. Built with Next.js, Supabase, and Stripe. Targets solo freelancers."
            disabled={isLoading}
            rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
          />
        </div>
      )}
      {error && <div style={{ color: "var(--accent-red)", fontSize: 13, marginTop: 4 }}>{error}</div>}
    </form>
  );
}
