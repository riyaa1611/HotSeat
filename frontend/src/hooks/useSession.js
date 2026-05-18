import { useState, useCallback, useEffect, useRef } from "react";
import { respondStream, endSession } from "../services/api";
import { supabase } from "../lib/supabase";
import { scoreConfidence } from "./useConfidence";

export function useSession(sessionId, initialMessage, finishFn = endSession) {
  const [messages, setMessages] = useState(() =>
    initialMessage ? [{ role: "assistant", content: initialMessage, id: 0 }] : []
  );
  const [turnCount, setTurnCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const lastMessageRef = useRef("");

  function addMessage(role, content) {
    setMessages((prev) => [...prev, { role, content, id: Date.now() + Math.random() }]);
  }

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "sessions",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        try {
          const dbMessages = JSON.parse(payload.new.messages);
          setMessages(
            dbMessages
              .filter((m) => m.role !== "system")
              .map((m, i) => ({ role: m.role, content: m.content, id: i }))
          );
          setTurnCount(payload.new.turn_count ?? 0);
        } catch { /* ignore */ }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    lastMessageRef.current = text;
    const conf = scoreConfidence(text);
    setMessages((prev) => [...prev, { role: "user", content: text, id: Date.now() + Math.random(), confidence: conf }]);
    setIsLoading(true);
    setError("");

    const streamId = Date.now() + Math.random();
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: streamId, streaming: true }]);

    await respondStream(sessionId, text, {
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) => m.id === streamId ? { ...m, content: m.content + chunk } : m)
        );
      },
      onDone: (data) => {
        setMessages((prev) =>
          prev.map((m) => m.id === streamId ? { ...m, streaming: false } : m)
        );
        setTurnCount(data.turn_count);
        setIsFinal(data.is_final);
        setIsLoading(false);
        lastMessageRef.current = "";
      },
      onError: (err) => {
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
        setError(err || "Failed to get response. Check your connection.");
        setIsLoading(false);
      },
    });
  }, [sessionId, isLoading]);

  const retryLastMessage = useCallback(() => {
    const last = lastMessageRef.current;
    if (!last) return;
    // Remove the failed user message from the display before resending
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === "user" && m.content === last);
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== realIdx);
    });
    setError("");
    sendMessage(last);
  }, [sendMessage]);

  const finish = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await finishFn(sessionId);
      setReport(result.report);
    } catch {
      setError("Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, finishFn]);

  return { messages, turnCount, isLoading, isFinal, report, error, sendMessage, retryLastMessage, finish, addMessage };
}
