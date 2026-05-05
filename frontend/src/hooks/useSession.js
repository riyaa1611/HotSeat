import { useState, useCallback, useEffect } from "react";
import { respond, endSession } from "../services/api";
import { supabase } from "../lib/supabase";

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

  // Realtime subscription — syncs messages from DB as they're saved
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          try {
            const dbMessages = JSON.parse(payload.new.messages);
            setMessages(
              dbMessages
                .filter((m) => m.role !== "system")
                .map((m, i) => ({ role: m.role, content: m.content, id: i }))
            );
            setTurnCount(payload.new.turn_count ?? 0);
          } catch {
            // ignore parse errors
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    addMessage("user", text);
    setIsLoading(true);
    setError("");
    try {
      const result = await respond(sessionId, text);
      // Realtime will sync the full message list; HTTP response gives metadata
      setTurnCount(result.turn_count);
      setIsFinal(result.is_final);
      if (!result.is_final) addMessage("assistant", result.response);
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
