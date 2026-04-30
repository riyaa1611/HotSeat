export default function ScoreCard({ label, score, max = 10 }) {
  const color = score >= 7 ? "var(--accent-green)" : score < 5 ? "var(--accent-red)" : "var(--accent-amber)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {label}
        </span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
          {score}<span style={{ color: "var(--text-muted)", fontSize: 11 }}>/{max}</span>
        </span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${(score / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}
