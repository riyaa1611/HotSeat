import { useEffect, useRef } from "react";

export default function WebcamPreview({ stream, denied }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const containerStyle = {
    position: "fixed", bottom: 24, right: 24, zIndex: 10,
    width: 160, height: 120,
    border: "1px solid var(--border-strong)",
    background: "#000",
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  };

  if (denied) {
    return (
      <div style={{ ...containerStyle, border: "1px solid var(--accent-red)", flexDirection: "column", gap: 6 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7 16 12 23 17V7zM1 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <span className="mono" style={{ fontSize: 8, color: "var(--accent-red)", letterSpacing: "0.16em", textAlign: "center" }}>
          CAMERA DENIED
        </span>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div style={containerStyle}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
      />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,0,0.55)", padding: "3px 6px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="mono" style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", letterSpacing: "0.14em" }}>
          PROCTORED
        </span>
        <span className="mono" style={{ fontSize: 7, color: "var(--accent-green)", letterSpacing: "0.1em" }}>
          AI ACTIVE
        </span>
      </div>
      <div style={{
        position: "absolute", top: 6, right: 6,
        width: 6, height: 6, borderRadius: "50%",
        background: "var(--accent-red)",
        boxShadow: "0 0 6px var(--accent-red)",
      }} />
    </div>
  );
}
