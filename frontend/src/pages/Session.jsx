import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import VoiceInput from "../components/VoiceInput";
import Timer from "../components/Timer";
import { useSession } from "../hooks/useSession";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { Grain, Logo } from "../components/shared";

const MAX_TURNS = 12;

const PERSONA_TITLES = {
  investor: "INVESTOR",
  tech_lead: "TECH LEAD",
  hr_manager: "HR MANAGER",
  product_manager: "PRODUCT MANAGER",
};

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session_id, first_message, persona, repoUrl } = location.state || {};
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const { messages, turnCount, isLoading, isFinal, report, error, sendMessage, finish, addMessage } =
    useSession(session_id);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    onTranscript: (text) => setInput((prev) => prev + text),
  });

  useEffect(() => {
    if (first_message) addMessage("assistant", first_message);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (report) navigate("/report", { state: { report, persona, repoUrl } });
  }, [report, navigate, persona, repoUrl]);

  useEffect(() => {
    if (isFinal) finish();
  }, [isFinal, finish]);

  if (!session_id) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>
          No session found. <a href="/" style={{ color: "var(--accent-red)" }}>Go back</a>
        </p>
      </div>
    );
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
    inputRef.current?.focus();
  }

  const personaTitle = PERSONA_TITLES[persona] || "INTERVIEWER";
  const progress = (Math.min(turnCount, MAX_TURNS) / MAX_TURNS) * 100;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Grain />
      {/* Header */}
      <header style={{
        padding: "14px 24px", borderBottom: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", gap: 24, background: "var(--bg-primary)",
        position: "sticky", top: 0, zIndex: 5,
      }}>
        <Logo size="sm" />
        <div style={{ width: 1, height: 22, background: "var(--border-default)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            Live with
          </span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.04em" }}>{personaTitle}</span>
        </div>
        <div style={{ flex: 1 }} />
        {/* Turn counter */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase" }}>Question</span>
          <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{Math.min(turnCount, MAX_TURNS)} / {MAX_TURNS}</span>
        </div>
        <Timer isRunning={!isFinal} />
        <button className="btn btn-ghost" onClick={finish} disabled={isLoading} style={{ padding: "8px 14px", fontSize: 12 }}>
          End Session
        </button>
      </header>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--bg-card)" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent-red)", transition: "width 400ms ease" }} />
      </div>

      {/* Chat */}
      <ChatWindow messages={messages} persona={persona} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div style={{
          margin: "0 24px 8px", padding: "12px 16px",
          background: "var(--accent-red-soft)", borderLeft: "2px solid var(--accent-red)",
          color: "var(--accent-red)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Input */}
      {!isFinal ? (
        <div style={{ borderTop: "1px solid var(--border-default)", background: "var(--bg-primary)", padding: "18px 24px" }}>
          <form onSubmit={handleSend}>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 10, alignItems: "stretch" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening…" : "Type your answer, or hit the mic."}
                  rows={2}
                  disabled={isLoading}
                  style={{
                    resize: "none", minHeight: 56,
                    borderColor: isListening ? "var(--accent-red)" : "var(--border-default)",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                />
                <div className="mono" style={{
                  position: "absolute", right: 12, bottom: 8, fontSize: 10,
                  color: "var(--text-muted)", letterSpacing: "0.12em",
                }}>
                  ⏎ SEND · ⇧⏎ NEW LINE
                </div>
              </div>
              <VoiceInput isListening={isListening} isSupported={isSupported} onToggle={toggleListening} />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || isLoading} style={{ minWidth: 100 }}>
                <SendIcon /> Send
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{
          borderTop: "1px solid var(--border-default)", padding: "24px",
          textAlign: "center", background: "var(--bg-primary)",
        }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-red)", marginBottom: 8 }}>
            SESSION COMPLETE
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Analyzing your performance…</div>
        </div>
      )}
    </div>
  );
}
