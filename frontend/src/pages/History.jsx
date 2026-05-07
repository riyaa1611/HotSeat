import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";
import { Grain, Logo } from "../components/shared";

const PERSONA_LABEL = {
  investor: "Investor", tech_lead: "Tech Lead",
  hr_manager: "HR Manager", product_manager: "Product Manager",
};

function ScoreLine({ sessions }) {
  if (sessions.length < 2) return null;
  const scores = sessions.map((s) => s.report?.overall ?? null).filter((s) => s !== null);
  if (scores.length < 2) return null;

  const W = 400, H = 80, pad = 16;
  const min = Math.max(0, Math.min(...scores) - 1);
  const max = Math.min(10, Math.max(...scores) + 1);
  const xStep = (W - pad * 2) / (scores.length - 1);
  const yScale = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const points = scores.map((s, i) => `${pad + i * xStep},${yScale(s)}`).join(" ");

  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "20px 24px", marginBottom: 24 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>
        Score Trend
      </div>
      <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
        <polyline points={points} fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinejoin="round" />
        {scores.map((s, i) => (
          <g key={i}>
            <circle cx={pad + i * xStep} cy={yScale(s)} r={4} fill="var(--accent-red)" />
            <text x={pad + i * xStep} y={yScale(s) - 8} textAnchor="middle"
              style={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}>
              {s}
            </text>
          </g>
        ))}
      </svg>
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

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      <header style={{ padding: "18px 32px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" />
        <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>
          ← Home
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 860, margin: "0 auto", width: "100%", padding: "40px 32px 80px" }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--accent-red)", textTransform: "uppercase", marginBottom: 12 }}>
          Session History
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 32px" }}>
          Your past {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          {avg !== null && <span style={{ color: "var(--text-muted)", fontSize: 22 }}> · avg {avg}/10</span>}
        </h1>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 72 }} />)}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 15 }}>No sessions yet. <span style={{ color: "var(--accent-red)", cursor: "pointer" }} onClick={() => navigate("/")}>Start one.</span></div>
        )}

        {!loading && sessions.length > 0 && (
          <>
            <ScoreLine sessions={[...sessions].reverse()} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border-default)" }}>
              {sessions.map((s) => {
                const date = new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const score = s.report?.overall;
                const scoreColor = score >= 7 ? "var(--accent-green)" : score < 5 ? "var(--accent-red)" : "var(--accent-amber)";
                const repo = s.repo_url?.split("/").slice(-2).join("/") || "—";

                return (
                  <div
                    key={s.session_id}
                    onClick={() => s.report && navigate("/report", { state: { report: s.report, persona: s.persona, repoUrl: s.repo_url } })}
                    style={{
                      background: "var(--bg-card)", padding: "18px 22px",
                      display: "flex", alignItems: "center", gap: 20,
                      cursor: s.report ? "pointer" : "default",
                      opacity: s.report ? 1 : 0.5,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{repo}</div>
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
                        {PERSONA_LABEL[s.persona] || s.persona} · {s.turn_count} turns · {date}
                      </div>
                    </div>
                    {score !== undefined && score !== null ? (
                      <div style={{ fontWeight: 800, fontSize: 22, color: scoreColor, fontVariantNumeric: "tabular-nums" }}>
                        {score}<span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>/10</span>
                      </div>
                    ) : (
                      <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)" }}>IN PROGRESS</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
