import axios from "axios";
import { supabase } from "../lib/supabase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export async function parseRepo(repoUrl) {
  const { data } = await api.post("/parse-repo", { repo_url: repoUrl });
  return data;
}

export async function startSession(repoUrl, persona) {
  const { data } = await api.post("/start-session", { repo_url: repoUrl, persona });
  return data;
}

export async function respond(sessionId, message) {
  const { data } = await api.post("/respond", { session_id: sessionId, message });
  return data;
}

export async function endSession(sessionId) {
  const { data } = await api.post("/end-session", { session_id: sessionId });
  return data;
}

export default api;
