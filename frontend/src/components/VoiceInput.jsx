function MicIcon({ size = 16, color = "currentColor", filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : "none"} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={filled ? color : "none"} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
    </svg>
  );
}

function MicOffIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
      <line x1="2" y1="2" x2="22" y2="22" />
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
      className={`btn${isListening ? " pulse-red" : ""}`}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 16px", minWidth: 130, justifyContent: "center",
        background: isListening ? "var(--accent-red)" : "var(--bg-input)",
        borderColor: isListening ? "var(--accent-red)" : "var(--border-default)",
        color: isListening ? "#fff" : "var(--text-primary)",
        transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
      }}
      aria-label={isListening ? "Stop microphone" : "Start microphone"}
      title={isListening ? "Click or press M to stop mic" : "Click or press M to start mic"}
    >
      {isListening ? (
        <>
          <MicIcon size={16} filled color="#fff" />
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Stop Mic</span>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#fff", opacity: 0.9,
            animation: "pulseOpacity 1s ease-in-out infinite",
            flexShrink: 0,
          }} />
        </>
      ) : (
        <>
          <MicIcon size={16} />
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Start Mic</span>
        </>
      )}
    </button>
  );
}
