import { useState, useCallback } from "react";
import { respond, endSession } from "../services/api";

export function useSession(sessionId) {
  const [messages, setMessages] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  function addMessage(role, content) {
    setMessages((prev) => [...prev, { role, content, id: Date.now() + Math.random() }]);
  }

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    addMessage("user", text);
    setIsLoading(true);
    setError("");
    try {
      const result = await respond(sessionId, text);
      addMessage("assistant", result.response);
      setTurnCount(result.turn_count);
      setIsFinal(result.is_final);
    } catch (e) {
      setError("Failed to get response. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const finish = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await endSession(sessionId);
      setReport(result.report);
    } catch (e) {
      setError("Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { messages, turnCount, isLoading, isFinal, report, error, sendMessage, finish, addMessage };
}
