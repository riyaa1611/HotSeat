import { useEffect, useRef } from "react";

const PERSONA_TITLES = {
  investor: "INVESTOR",
  tech_lead: "TECH LEAD",
  hr_manager: "HR MANAGER",
  product_manager: "PRODUCT MANAGER",
};

export default function ChatWindow({ messages, persona, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const title = PERSONA_TITLES[persona] || "INTERVIEWER";

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: "32px 24px",
      background: "radial-gradient(ellipse at top, rgba(226,75,74,0.04), transparent 60%)",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {messages.map((msg) => (
          <div key={msg.id} className="fade-in" style={{
            maxWidth: "80%",
            marginLeft: msg.role === "user" ? "auto" : undefined,
            textAlign: msg.role === "user" ? "right" : "left",
          }}>
            <div className="mono" style={{
              fontSize: 10, color: "var(--text-muted)", marginBottom: 6,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              {msg.role === "user" ? "You" : title}
            </div>
            <div className={msg.role === "user" ? "msg-user" : "msg-persona"}
              style={{ fontSize: 15, lineHeight: 1.55, textAlign: "left", display: "inline-block", width: "100%" }}>
              {msg.content || (msg.streaming ? null : "—")}
              {msg.streaming && (
                <span style={{
                  display: "inline-block", width: 2, height: "1em",
                  background: "var(--accent-red)", marginLeft: 2,
                  verticalAlign: "text-bottom", animation: "flicker 0.8s ease-in-out infinite",
                }} />
              )}
            </div>
          </div>
        ))}
        {isLoading && !messages.some((m) => m.streaming) && (
          <div className="fade-in" style={{ maxWidth: "80%" }}>
            <div className="mono" style={{
              fontSize: 10, color: "var(--text-muted)", marginBottom: 6,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>
              {title}
            </div>
            <div className="msg-persona" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "20px 22px" }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
