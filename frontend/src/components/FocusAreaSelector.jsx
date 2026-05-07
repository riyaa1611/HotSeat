const ALL_AREAS = [
  "Architecture", "Scalability", "Security", "Testing",
  "Business model", "Market size", "Traction", "Unit economics",
  "User research", "Roadmap", "Team", "Trade-offs",
];

export default function FocusAreaSelector({ selected, onChange }) {
  function toggle(area) {
    onChange(
      selected.includes(area)
        ? selected.filter((a) => a !== area)
        : [...selected, area]
    );
  }

  return (
    <div>
      <div className="section-divider"><span>03 · Focus Areas (optional)</span></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ALL_AREAS.map((area) => {
          const active = selected.includes(area);
          return (
            <button
              key={area}
              onClick={() => toggle(area)}
              className="mono"
              style={{
                fontSize: 10, padding: "6px 12px",
                border: `1px solid ${active ? "var(--accent-red)" : "var(--border-default)"}`,
                background: active ? "var(--accent-red-soft)" : "transparent",
                color: active ? "var(--accent-red)" : "var(--text-secondary)",
                cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
                transition: "all 140ms ease",
              }}
            >
              {active ? "✓ " : ""}{area}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 10, letterSpacing: "0.1em" }}>
          {selected.length} area{selected.length > 1 ? "s" : ""} selected — interviewer will prioritize these
        </div>
      )}
    </div>
  );
}
