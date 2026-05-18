import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Grain, Logo, RadarChartSVG } from "../components/shared";
import ScoreCard from "../components/ScoreCard";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const SCORE_KEYS = [
  { key: "clarity", label: "Clarity" },
  { key: "technical_depth", label: "Technical" },
  { key: "business_sense", label: "Business" },
  { key: "pressure_handling", label: "Pressure" },
  { key: "honesty", label: "Honesty" },
];

const INTERVIEW_SCORE_KEYS = [
  { key: "communication", label: "Communication" },
  { key: "confidence", label: "Confidence" },
  { key: "problem_solving", label: "Problem Solving" },
  { key: "culture_fit", label: "Culture Fit" },
  { key: "honesty", label: "Honesty" },
];

export default function SharedReport() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/share-report/${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (
          !data ||
          typeof data.report?.overall !== "number" ||
          !Array.isArray(data.report?.strengths) ||
          !Array.isArray(data.report?.weaknesses)
        ) {
          throw new Error("Invalid shape");
        }
        setState(data);
      })
      .catch(() => setError("Invalid or expired share link."));
  }, [token]);

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

  if (!state) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center" }}>
          <div className="skeleton" style={{ width: 90, height: 22 }} />
        </header>
        <main style={{ flex: 1, maxWidth: 980, margin: "0 auto", width: "100%", padding: "48px 32px" }}>
          <div className="skeleton" style={{ height: 40, width: "50%", margin: "0 auto 16px" }} />
          <div className="skeleton" style={{ height: 14, width: "30%", margin: "0 auto 48px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 1 }}>
            <div className="skeleton" style={{ height: 240 }} />
            <div className="skeleton" style={{ height: 240 }} />
          </div>
        </main>
      </div>
    );
  }

  const { report, persona, repoUrl } = state;
  const isInterview = report.communication != null;
  const keys = isInterview ? INTERVIEW_SCORE_KEYS : SCORE_KEYS;
  const radarData = keys.map(({ key, label }) => ({ metric: label, score: report[key] }));
  const overallColor = report.overall >= 7 ? "var(--accent-green)" : report.overall < 5 ? "var(--accent-red)" : "var(--accent-amber)";
  const personaLabel = persona?.replace(/_/g, " ").toUpperCase() || "INTERVIEWER";
  const repoShort = repoUrl?.split("/").slice(-2).join("/") || "project";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${keys.length}, 1fr)`, gap: 24, marginBottom: 48 }}>
          {keys.map(({ key, label }) => <ScoreCard key={key} label={label} score={report[key]} />)}
        </div>
      </main>
    </div>
  );
}
