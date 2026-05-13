import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Report from "./Report";

export default function SharedReport() {
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      if (!hash) throw new Error("No data");
      const decoded = JSON.parse(atob(hash));
      setState(decoded);
    } catch {
      setError("Invalid or expired share link.");
    }
  }, []);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--accent-red)", marginBottom: 16, fontSize: 16 }}>{error}</div>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!state) return null;

  // Render the Report page with injected location state
  return <ReportWithState state={state} />;
}

function ReportWithState({ state }) {
  const fakeLocation = { state };
  return <ReportInner location={fakeLocation} />;
}

// Inline minimal report render using location prop directly
import { Grain, Logo, RadarChartSVG, FlameIcon } from "../components/shared";
import ScoreCard from "../components/ScoreCard";

const SCORE_KEYS = [
  { key: "clarity", label: "Clarity" },
  { key: "technical_depth", label: "Technical" },
  { key: "business_sense", label: "Business" },
  { key: "pressure_handling", label: "Pressure" },
  { key: "honesty", label: "Honesty" },
];

function ReportInner({ location }) {
  const navigate = useNavigate();
  const { report, persona, repoUrl } = location.state || {};
  if (!report) return null;

  const radarData = SCORE_KEYS.map(({ key, label }) => ({ metric: label, score: report[key] }));
  const overallColor = report.overall >= 7 ? "var(--accent-green)" : report.overall < 5 ? "var(--accent-red)" : "var(--accent-amber)";
  const personaLabel = persona?.replace("_", " ") || "Interviewer";
  const repoShort = repoUrl?.split("/").slice(-1)[0] || "project";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Helmet>
        <title>{`HotSeat Report — ${repoShort} vs ${personaLabel} · ${report.overall}/10`}</title>
        <meta name="description" content={`Performance report for ${repoShort}: overall score ${report.overall}/10 against ${personaLabel} on HotSeat.`} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Grain />
      <header style={{ padding: "20px 32px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size="sm" />
        <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.14em" }}>SHARED REPORT</div>
        <button className="btn btn-ghost" onClick={() => navigate("/")} style={{ padding: "8px 14px", fontSize: 12 }}>Try it</button>
      </header>
      <main style={{ flex: 1, maxWidth: 980, margin: "0 auto", width: "100%", padding: "48px 32px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 8px" }}>Performance Report</h1>
          <div className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            vs. {personaLabel} · {repoShort}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 1, background: "var(--border-default)", border: "1px solid var(--border-default)", marginBottom: 36 }}>
          <div style={{ background: "var(--bg-card)", padding: "40px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16 }}>Overall Score</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em", color: overallColor }}>{report.overall}</span>
              <span className="mono" style={{ fontSize: 18, color: "var(--text-muted)" }}>/10</span>
            </div>
          </div>
          <div style={{ background: "var(--bg-card)", padding: "24px 16px", display: "grid", placeItems: "center" }}>
            <RadarChartSVG data={radarData} size={280} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24, marginBottom: 48 }}>
          {SCORE_KEYS.map(({ key, label }) => <ScoreCard key={key} label={label} score={report[key]} />)}
        </div>
      </main>
    </div>
  );
}
