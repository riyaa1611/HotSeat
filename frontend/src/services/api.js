import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

export async function parseRepo(repoUrl) {
  const { data } = await api.post("/parse-repo", { repo_url: repoUrl });
  return data;
}

export async function startSession(repoUrl, persona) {
  const { data } = await api.post("/start-session", {
    repo_url: repoUrl,
    persona,
  });
  return data; // { session_id, first_message }
}

export async function respond(sessionId, message) {
  const { data } = await api.post("/respond", {
    session_id: sessionId,
    message,
  });
  return data; // { response, turn_count, is_final }
}

export async function endSession(sessionId) {
  const { data } = await api.post("/end-session", { session_id: sessionId });
  return data; // { report }
}

export default api;
