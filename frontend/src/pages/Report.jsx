import { useLocation, useNavigate } from "react-router-dom";
import ScoreCard from "../components/ScoreCard";
import { Grain, Logo, RadarChartSVG, FlameIcon } from "../components/shared";

const SCORE_KEYS = [
  { key: "clarity", label: "Clarity" },
  { key: "technical_depth", label: "Technical" },
  { key: "business_sense", label: "Business" },
  { key: "pressure_handling", label: "Pressure" },
  { key: "honesty", label: "Honesty" },
];

function ArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5M5 12l7-9 7 9-3 2-4-1-4 1-3-2z" />
    </svg>
  );
}

function CheckIcon({ color = "var(--accent-green)" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XMark({ color = "var(--accent-red)" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function FeedbackCard({ title, tone, icon: IconC, items }) {
  const color = tone === "green" ? "var(--accent-green)" : "var(--accent-red)";
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", padding: "24px 26px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ width: 6, height: 6, background: color, display: "inline-block" }} />
        <span className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color }}>{title}</span>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((x, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ paddingTop: 3, flexShrink: 0 }}><IconC color={color} /></span>
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, persona, repoUrl, violations = [] } = location.state || {};

  if (!report) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>
          No report found. <a href="/" style={{ color: "var(--accent-red)" }}>Go back</a>
        </p>
      </div>
    );
  }

  const radarData = SCORE_KEYS.map(({ key, label }) => ({
    metric: label,
    score: report[key],
  }));

  const overallColor =
    report.overall >= 7 ? "var(--accent-green)" :
    report.overall < 5 ? "var(--accent-red)" : "var(--accent-amber)";

  const overallLabel =
    report.overall >= 7 ? "Solid" :
    report.overall < 5 ? "Cooked" : "Mid";

  const personaLabel = persona?.replace("_", " ").toUpperCase() || "INTERVIEWER";
  const repoShort = repoUrl?.split("/").slice(-2).join("/") || "your project";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      <header style={{
        padding: "20px 32px", borderBottom: "1px solid var(--border-default)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Logo size="sm" />
        <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>
          <ArrowLeft /> Home
        </button>
      </header>

      <main style={{ flex: 1, maxWidth: 980, margin: "0 auto", width: "100%", padding: "48px 32px 80px" }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>
            ── Session Complete ──
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
            Your performance report
          </h1>
          <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 10, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <span className="mono">vs. {personaLabel}</span>
            <span style={{ color: "var(--text-muted)" }}>·</span>
            <span className="mono">{repoShort}</span>
          </div>
        </div>

        {/* Score panel: overall + radar side by side */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 1,
          background: "var(--border-default)", border: "1px solid var(--border-default)",
          marginBottom: 36,
        }}>
          <div style={{ background: "var(--bg-card)", padding: "40px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16 }}>
              Overall Score
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: overallColor }}>
                {report.overall}
              </span>
              <span className="mono" style={{ fontSize: 18, color: "var(--text-muted)" }}>/ 10</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 13, color: overallColor, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              · {overallLabel}
            </div>
          </div>
          <div style={{ background: "var(--bg-card)", padding: "24px 16px", position: "relative" }}>
            <div className="mono" style={{
              position: "absolute", top: 24, left: 24, fontSize: 10,
              color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase",
            }}>
              Breakdown
            </div>
            <div style={{ marginTop: 16, display: "grid", placeItems: "center", minHeight: 320 }}>
              <RadarChartSVG data={radarData} size={300} />
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24, marginBottom: 48 }}>
          {SCORE_KEYS.map(({ key, label }) => (
            <ScoreCard key={key} label={label} score={report[key]} />
          ))}
        </div>

        {/* Strengths + Weaknesses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <FeedbackCard title="What you did okay" tone="green" icon={CheckIcon} items={report.strengths} />
          <FeedbackCard title="Where you got cooked" tone="red" icon={XMark} items={report.weaknesses} />
        </div>

        {/* Action item */}
        <div className="section-divider"><span>Your Homework</span></div>
        <div style={{
          background: "var(--bg-card)", borderLeft: "3px solid var(--accent-amber)",
          border: "1px solid var(--border-default)", padding: "24px 28px",
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{ background: "var(--accent-amber-soft)", padding: 10, flexShrink: 0 }}>
            <PinIcon />
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent-amber)", marginBottom: 8 }}>
              Action item · Before next session
            </div>
            <div style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 500 }}>
              {report.action_item}
            </div>
          </div>
        </div>

        {/* Integrity report */}
        <div className="section-divider"><span>Session Integrity</span></div>
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border-default)",
          borderLeft: `3px solid ${violations.length === 0 ? "var(--accent-green)" : "var(--accent-red)"}`,
          padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div className="mono" style={{
              fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10,
              color: violations.length === 0 ? "var(--accent-green)" : "var(--accent-red)",
            }}>
              {violations.length === 0 ? "✓ Clean Session" : `${violations.length} Integrity Flag${violations.length > 1 ? "s" : ""}`}
            </div>
            {violations.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>No violations detected. Full credit.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {violations.map((v, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0, paddingTop: 2 }}>
                      {new Date(v.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ marginTop: 48, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-large" onClick={() => navigate("/")}>
            <FlameIcon size={14} color="#fff" /> Go Again
          </button>
          <button className="btn btn-large" onClick={() => navigate("/")}>
            <RefreshIcon /> Switch Persona
          </button>
          <button className="btn btn-large" onClick={() => {
            const encoded = btoa(JSON.stringify({ report, persona, repoUrl }));
            const url = `${window.location.origin}/report/shared#${encoded}`;
            navigator.clipboard.writeText(url).then(() => alert("Share link copied!"));
          }}>
            Share Report
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/history")} style={{ fontSize: 13 }}>
            History
          </button>
        </div>
      </main>
    </div>
  );
}
