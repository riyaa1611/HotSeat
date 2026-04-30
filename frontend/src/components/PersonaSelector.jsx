import { useCallback } from "react";

const PERSONAS = [
  {
    id: "investor",
    title: "INVESTOR",
    quote: "You've got 5 minutes. Impress me.",
    cares: ["Market", "Revenue", "Traction", "Why you?"],
    sub: "Series A · Two-time founder · Suffers no fools",
  },
  {
    id: "tech_lead",
    title: "TECH LEAD",
    quote: "I already read your repo. Don't repeat the README.",
    cares: ["Architecture", "Tests", "Scale", "Trade-offs"],
    sub: "Staff Eng · 14 yrs distributed systems",
  },
  {
    id: "hr_manager",
    title: "HR MANAGER",
    quote: "Tell me about this project. No jargon.",
    cares: ["Communication", "Pressure", "Honesty", "Culture fit"],
    sub: "Talent Partner · Watches you, not the slides",
  },
  {
    id: "product_manager",
    title: "PRODUCT MANAGER",
    quote: "Who is this for and why should they care?",
    cares: ["Users", "Metrics", "Roadmap", "Prioritization"],
    sub: "Senior PM · Killed 3 products this quarter",
  },
];

export default function PersonaSelector({ selected, onChange }) {
  return (
    <div>
      <div className="section-divider"><span>02 · Choose Your Interrogator</span></div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
      }}>
        {PERSONAS.map((p, i) => (
          <div
            key={p.id}
            className={`persona-card ${selected === p.id ? "selected" : ""}`}
            onClick={() => onChange(p.id)}
          >
            <div className="selector" />
            <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.22em", marginBottom: 12 }}>
              0{i + 1}
            </div>
            <div style={{
              fontSize: 18, fontWeight: 800, letterSpacing: "0.02em", marginBottom: 4,
              color: selected === p.id ? "var(--accent-red)" : "var(--text-primary)",
            }}>
              {p.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
              {p.sub}
            </div>
            <div style={{
              fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic",
              lineHeight: 1.5, marginBottom: 18, minHeight: 42,
            }}>
              "{p.quote}"
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.cares.map((c) => (
                <span key={c} className="mono" style={{
                  fontSize: 10, padding: "4px 8px",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)", letterSpacing: "0.06em",
                }}>{c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
