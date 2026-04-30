import { useState, useEffect } from "react";

export default function Timer({ isRunning }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
        Elapsed
      </span>
      <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>
        {mm}:{ss}
      </span>
    </div>
  );
}
