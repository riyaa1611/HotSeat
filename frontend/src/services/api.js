import axios from "axios";
import { supabase } from "../lib/supabase";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

// Retry on network errors (not 4xx/5xx)
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config;
    if (!cfg || cfg._retryCount >= 2 || err.response) return Promise.reject(err);
    cfg._retryCount = (cfg._retryCount || 0) + 1;
    await new Promise((r) => setTimeout(r, 1000 * cfg._retryCount));
    return api(cfg);
  }
);

export async function parseRepo(repoUrl) {
  const { data } = await api.post("/parse-repo", { repo_url: repoUrl });
  return data;
}

export async function parseUrl(projectUrl, description = "") {
  const { data } = await api.post("/parse-url", { project_url: projectUrl, description });
  return data;
}

export async function startSession(repoUrl, persona, focusAreas = [], description = "", displayName = "") {
  const { data } = await api.post("/start-session", {
    repo_url: repoUrl,
    persona,
    focus_areas: focusAreas,
    description,
    display_name: displayName,
  });
  return data;
}

export async function respond(sessionId, message) {
  const { data } = await api.post("/respond", { session_id: sessionId, message });
  return data;
}

export async function respondStream(sessionId, message, { onChunk, onDone, onError } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/respond-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId, message }),
    });
  } catch (e) {
    onError?.(e.message);
    return;
  }

  if (!res.ok) { onError?.("Stream request failed"); return; }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (!block.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(block.slice(6));
        if (data.chunk) onChunk?.(data.chunk);
        if (data.done) onDone?.(data);
        if (data.error) onError?.(data.error);
      } catch { /* ignore malformed */ }
    }
  }
}

export async function submitFeedback(sessionId, rating, comment = "") {
  const { data } = await api.post("/feedback", { session_id: sessionId, rating, comment });
  return data;
}

export async function getLeaderboard() {
  const { data } = await api.get("/leaderboard");
  return data.entries || [];
}

export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}

export async function endSession(sessionId) {
  const { data } = await api.post("/end-session", { session_id: sessionId });
  return data;
}

export async function getHistory() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("session_id, persona, repo_url, turn_count, started_at, ended_at, report")
    .eq("user_id", session.user.id)
    .order("started_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return (data || []).map((s) => ({
    ...s,
    report: s.report ? (typeof s.report === "string" ? JSON.parse(s.report) : s.report) : null,
  }));
}

export default api;
