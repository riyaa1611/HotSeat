import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import VoiceInput from "../components/VoiceInput";
import Timer from "../components/Timer";
import { useSession } from "../hooks/useSession";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

const MAX_TURNS = 12;

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

  // Inject first_message on mount
  useEffect(() => {
    if (first_message) {
      addMessage("assistant", first_message);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to report when report is ready
  useEffect(() => {
    if (report) {
      navigate("/report", { state: { report, persona, repoUrl } });
    }
  }, [report, navigate, persona, repoUrl]);

  // Auto-end when is_final
  useEffect(() => {
    if (isFinal) {
      finish();
    }
  }, [isFinal, finish]);

  if (!session_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">
          No session found.{" "}
          <a href="/" className="text-red-400 underline">Go back</a>
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

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-white">
            Hot<span className="text-red-500">Seat</span>
          </h1>
          <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full capitalize">
            {persona?.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            {turnCount}/{MAX_TURNS} questions
          </span>
          <Timer isRunning={!isFinal} />
          <button
            onClick={finish}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Chat */}
      <ChatWindow messages={messages} persona={persona} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      {!isFinal && (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 disabled:opacity-50"
            />
            <VoiceInput
              isListening={isListening}
              isSupported={isSupported}
              onToggle={toggleListening}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {isFinal && (
        <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-800">
          Session complete. Generating your report...
        </div>
      )}
    </div>
  );
}
