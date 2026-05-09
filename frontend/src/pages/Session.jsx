import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import VoiceInput from "../components/VoiceInput";
import Timer from "../components/Timer";
import WebcamPreview from "../components/WebcamPreview";
import { useSession } from "../hooks/useSession";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useAntiCheat } from "../hooks/useAntiCheat";
import { useVisionProctoring } from "../hooks/useVisionProctoring";
import { useTTS } from "../hooks/useTTS";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { scoreConfidence } from "../hooks/useConfidence";
import { Grain, Logo, ThemeToggle } from "../components/shared";

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

function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function VolumeMuteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

export default function Session() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session_id, first_message, persona, repoUrl } = location.state || {};
  const [input, setInput] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const inputRef = useRef(null);
  const inputValueRef = useRef(""); // always holds latest input without stale closure
  inputValueRef.current = input;
  const violationsRef = useRef([]);

  const { messages, turnCount, isLoading, isFinal, report, error, sendMessage, finish } =
    useSession(session_id, first_message);

  const { isListening, isSupported, toggleListening } = useSpeechRecognition({
    onTranscript: (text) => setInput((prev) => prev + text),
    onAutoSend: async (transcript) => {
      const full = (inputValueRef.current + transcript).trim();
      if (!full || isLoading) return;
      setInput("");
      await sendMessage(full);
      inputRef.current?.focus();
    },
  });

  const {
    violations, lastWarning, webcamStream, webcamDenied,
    isFullscreen, requestFullscreen, addViolation,
  } = useAntiCheat(!!session_id);

  const { speak, stop: stopTTS, enabled: ttsEnabled, setEnabled: setTTSEnabled } = useTTS(persona);
  const isOnline = useOnlineStatus();

  // Speak new complete assistant messages
  const prevMsgCount = useRef(0);
  useEffect(() => {
    const newMsgs = messages.slice(prevMsgCount.current);
    prevMsgCount.current = messages.length;
    const last = [...newMsgs].reverse().find((m) => m.role === "assistant" && !m.streaming);
    if (last) speak(last.content);
  }, [messages, speak]);

  // Keyboard shortcut: M = toggle mic
  useEffect(() => {
    function onKey(e) {
      if (e.key === "m" || e.key === "M") {
        if (document.activeElement?.tagName === "TEXTAREA") return;
        toggleListening();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleListening]);

  useVisionProctoring({
    stream: webcamStream,
    onViolation: addViolation,
    enabled: !!session_id && !!webcamStream,
  });

  // Keep a ref so the report navigation effect always sees latest violations
  useEffect(() => { violationsRef.current = violations; }, [violations]);

  useEffect(() => {
    if (report) {
      if (document.fullscreenElement) document.exitFullscreen?.();
      const transcript = messages.filter((m) => m.role !== "system" && !m.streaming);
      navigate("/report", { state: { report, persona, repoUrl, violations: violationsRef.current, transcript } });
    }
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

      {/* Paused banner */}
      {isPaused && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--accent-amber)", padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 13, fontWeight: 600, color: "#000",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#000" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
          Session paused — click Resume to continue
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--accent-amber)", padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: "#000",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          No internet connection — your answer may not send
        </div>
      )}

      {/* Violation warning toast */}
      {lastWarning && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          zIndex: 50, background: "var(--bg-card-2)",
          border: "1px solid var(--accent-red)", borderLeft: "3px solid var(--accent-red)",
          padding: "12px 18px", display: "flex", alignItems: "center", gap: 12,
          minWidth: 320, animation: "fadeIn 200ms ease-out",
          boxShadow: "0 4px 24px rgba(226,75,74,0.2)",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontSize: 13, flex: 1 }}>{lastWarning}</span>
          {lastWarning.includes("fullscreen") && (
            <button className="btn" onClick={requestFullscreen}
              style={{ padding: "4px 10px", fontSize: 11, flexShrink: 0 }}>
              Return
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header style={{
        padding: "12px 20px", borderBottom: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", gap: 16, background: "var(--bg-primary)",
        position: "sticky", top: 0, zIndex: 5, flexWrap: "wrap",
      }}>
        <Logo size="sm" />
        <div style={{ width: 1, height: 22, background: "var(--border-default)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span className="mono session-header-meta" style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>Live with</span>
          <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "0.04em" }}>{personaTitle}</span>
        </div>
        <div style={{ flex: 1 }} />

        {/* Violation count */}
        <div className="mono session-header-meta" style={{
          display: "flex", alignItems: "center", gap: 5, fontSize: 10,
          color: violations.length > 0 ? "var(--accent-red)" : "var(--accent-green)",
          letterSpacing: "0.16em", textTransform: "uppercase",
        }}>
          <ShieldIcon />
          {violations.length > 0 ? `${violations.length} FLAG${violations.length > 1 ? "S" : ""}` : "CLEAN"}
        </div>

        <div className="session-header-meta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase" }}>Question</span>
          <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{Math.min(turnCount, MAX_TURNS)} / {MAX_TURNS}</span>
        </div>
        <Timer isRunning={!isFinal} isPaused={isPaused} />
        <button
          className="btn btn-ghost"
          onClick={() => { setTTSEnabled((v) => { if (v) stopTTS(); return !v; }); }}
          style={{ padding: "8px 10px", fontSize: 11 }}
          title="Toggle voice (persona speaks questions)"
        >
          {ttsEnabled ? <VolumeIcon /> : <VolumeMuteIcon />}
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setIsPaused((v) => !v)}
          style={{ padding: "8px 12px", fontSize: 11, color: isPaused ? "var(--accent-amber)" : "var(--text-primary)" }}
          title="Pause / Resume session"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
        <ThemeToggle />
        <button className="btn btn-ghost" onClick={finish} disabled={isLoading || isPaused} style={{ padding: "8px 12px", fontSize: 12 }}>
          End
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
            {(() => {
              const conf = scoreConfidence(input);
              return conf && (
                <div style={{ maxWidth: 760, margin: "0 auto 8px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 2, background: "var(--bg-card)" }}>
                    <div style={{ width: `${conf.score}%`, height: "100%", background: conf.color, transition: "width 200ms ease, background 200ms ease" }} />
                  </div>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: conf.color, flexShrink: 0 }}>
                    {conf.label}
                  </span>
                </div>
              );
            })()}
            <div className="session-input-row" style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 10, alignItems: "stretch" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening… (auto-sends on silence)" : "Type your answer, or hit the mic."}
                  rows={2}
                  disabled={isLoading || isPaused}
                  style={{
                    resize: "none", minHeight: 56,
                    borderColor: isListening ? "var(--accent-red)" : "var(--border-default)",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                  onPaste={() => addViolation("paste", "Paste detected in answer field.")}
                />
                <div className="mono" style={{
                  position: "absolute", right: 12, bottom: 8, fontSize: 10,
                  color: "var(--text-muted)", letterSpacing: "0.12em",
                }}>
                  ⏎ SEND · ⇧⏎ NEW LINE
                </div>
              </div>
              <VoiceInput isListening={isListening} isSupported={isSupported} onToggle={toggleListening} />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || isLoading || isPaused} style={{ minWidth: 100 }}>
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

      {/* Webcam preview */}
      <WebcamPreview stream={webcamStream} denied={webcamDenied} />
    </div>
  );
}
