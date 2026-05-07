function MicIcon({ size = 20, color = "currentColor", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={filled ? color : "none"} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
    </svg>
  );
}

export default function VoiceInput({ isListening, isSupported, onToggle }) {
  if (!isSupported) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, alignSelf: "center" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Voice requires Chrome</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`btn ${isListening ? "pulse-red" : ""}`}
      style={{
        width: 56, padding: 0,
        background: isListening ? "var(--accent-red)" : "var(--bg-input)",
        borderColor: isListening ? "var(--accent-red)" : "var(--border-default)",
        color: isListening ? "#fff" : "var(--text-primary)",
      }}
      aria-label="Toggle microphone"
    >
      <MicIcon size={20} filled={isListening} />
    </button>
  );
}
