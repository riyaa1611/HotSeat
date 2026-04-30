import { useState } from "react";

const GITHUB_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

function GitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v12M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9v3a3 3 0 0 1-3 3H9" />
    </svg>
  );
}

export default function RepoInput({ onParsed, isLoading }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function validate(value) {
    if (!value) return "Paste a GitHub repo URL.";
    if (!GITHUB_PATTERN.test(value.trim())) return "Use the full https://github.com/owner/repo format.";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(url);
    if (err) { setError(err); return; }
    setError("");
    onParsed(url.trim());
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-divider"><span>01 · Your Project</span></div>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-muted)", display: "flex", alignItems: "center",
          }}>
            <GitIcon />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            placeholder="https://github.com/owner/repo"
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
          {isLoading ? "Parsing…" : "Parse Repo"}
        </button>
      </div>
      {error && <div style={{ color: "var(--accent-red)", fontSize: 13, marginTop: 4 }}>{error}</div>}
    </form>
  );
}
