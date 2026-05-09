import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";
import { Grain, Logo, LogoutButton, ThemeToggle } from "../components/shared";

const PERSONA_LABEL = {
  investor: "Investor", tech_lead: "Tech Lead",
  hr_manager: "HR Manager", product_manager: "Product Manager",
};

const DIMS = [
  { key: "clarity", label: "Clarity" },
  { key: "technical_depth", label: "Technical" },
  { key: "business_sense", label: "Business" },
  { key: "pressure_handling", label: "Pressure" },
  { key: "honesty", label: "Honesty" },
];

function ScoreLine({ scores, color = "var(--accent-red)" }) {
  if (scores.length < 2) return null;
  const W = 280, H = 60, pad = 12;
  const min = Math.max(0, Math.min(...scores) - 1);
  const max = Math.min(10, Math.max(...scores) + 1);
  const xStep = (W - pad * 2) / (scores.length - 1);
  const yScale = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const points = scores.map((s, i) => `${pad + i * xStep},${yScale(s)}`).join(" ");

  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {scores.map((s, i) => (
        <g key={i}>
          <circle cx={pad + i * xStep} cy={yScale(s)} r={3} fill={color} />
          <text x={pad + i * xStep} y={yScale(s) - 6} textAnchor="middle"
            style={{ fill: "var(--text-muted)", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }}>
            {s}
          </text>
        </g>
      ))}
    </svg>
  );
}

function WeakSpotCard({ dims }) {
  if (!dims || dims.length === 0) return null;
  const sorted = [...dims].sort((a, b) => a.avg - b.avg);
  const worst = sorted[0];
  const color = worst.avg >= 7 ? "var(--accent-green)" : worst.avg < 5 ? "var(--accent-red)" : "var(--accent-amber)";

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      borderLeft: `3px solid ${color}`, padding: "20px 24px", marginBottom: 24,
    }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
        Weak Spot Analysis
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {sorted.map((d) => {
          const dc = d.avg >= 7 ? "var(--accent-green)" : d.avg < 5 ? "var(--accent-red)" : "var(--accent-amber)";
          return (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 80 }}>
              <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{d.label}</span>
              <div style={{ height: 3, width: 80, background: "var(--bg-card-2)" }}>
                <div style={{ width: `${d.avg * 10}%`, height: "100%", background: dc, transition: "width 600ms ease" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: dc }}>{d.avg.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        <span style={{ color, fontWeight: 600 }}>{worst.label}</span> is your weakest area — avg {worst.avg.toFixed(1)}/10 across sessions.
        {worst.avg < 5 && " Focus on this before your next pitch."}
        {worst.avg >= 5 && worst.avg < 7 && " Room to sharpen — review your answers in those sessions."}
        {worst.avg >= 7 && " Solid across the board."}
      </div>
    </div>
  );
}

function RepoGroup({ repoUrl, sessions, navigate }) {
  const [open, setOpen] = useState(true);
  const completed = sessions.filter((s) => s.report);
  const overallScores = completed.map((s) => s.report.overall).reverse();
  const repoShort = repoUrl?.split("/").slice(-2).join("/") || repoUrl;

  const dimAvgs = DIMS.map(({ key, label }) => {
    const vals = completed.map((s) => s.report[key]).filter((v) => v != null);
    return { key, label, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
  }).filter((d) => d.avg !== null);

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", background: "var(--bg-card-2)", border: "1px solid var(--border-default)",
          borderBottom: open ? "none" : "1px solid var(--border-default)",
          padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", color: "var(--text-primary)",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{repoShort}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
            {completed.length} session{completed.length !== 1 ? "s" : ""}
          </span>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ border: "1px solid var(--border-default)", borderTop: "none" }}>
          {completed.length >= 2 && (
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-default)", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Overall Trend</div>
                <ScoreLine scores={overallScores} />
              </div>
              <div style={{ flex: 1 }}>
                <WeakSpotCard dims={dimAvgs} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border-default)" }}>
            {sessions.map((s) => {
              const date = new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const score = s.report?.overall;
              const scoreColor = score >= 7 ? "var(--accent-green)" : score < 5 ? "var(--accent-red)" : "var(--accent-amber)";
              return (
                <div
                  key={s.session_id}
                  onClick={() => s.report && navigate("/report", { state: { report: s.report, persona: s.persona, repoUrl: s.repo_url } })}
                  style={{
                    background: "var(--bg-card)", padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                    cursor: s.report ? "pointer" : "default",
                    opacity: s.report ? 1 : 0.5,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>
                      {PERSONA_LABEL[s.persona] || s.persona}
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
                      {s.turn_count} turns · {date}
                    </div>
                  </div>
                  {score != null ? (
                    <div style={{ fontWeight: 800, fontSize: 20, color: scoreColor }}>
                      {score}<span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>/10</span>
                    </div>
                  ) : (
                    <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>IN PROGRESS</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((data) => { setSessions(data); setLoading(false); });
  }, []);

  const completed = sessions.filter((s) => s.report);
  const avg = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.report.overall ?? 0), 0) / completed.length * 10) / 10
    : null;

  // Group by repo
  const byRepo = sessions.reduce((acc, s) => {
    const key = s.repo_url || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      <header className="page-header">
        <Logo size="sm" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>
            ← Home
          </button>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 900, margin: "0 auto", width: "100%", padding: "40px 32px 80px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: 12 }}>
          Session History
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 32px" }}>
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          {avg !== null && <span style={{ color: "var(--text-muted)", fontSize: 20 }}> · avg {avg}/10</span>}
        </h1>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>
            No sessions yet.{" "}
            <span style={{ color: "var(--accent-red)", cursor: "pointer" }} onClick={() => navigate("/")}>Start one.</span>
          </div>
        )}

        {!loading && sessions.length > 0 && Object.entries(byRepo).map(([repoUrl, repoSessions]) => (
          <RepoGroup key={repoUrl} repoUrl={repoUrl} sessions={repoSessions} navigate={navigate} />
        ))}
      </main>
    </div>
  );
}
