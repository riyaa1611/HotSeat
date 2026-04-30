import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RepoInput from "../components/RepoInput";
import PersonaSelector from "../components/PersonaSelector";
import { parseRepo, startSession } from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const [persona, setPersona] = useState("investor");
  const [parsedRepo, setParsedRepo] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleParseRepo(url) {
    setError("");
    setIsParsing(true);
    setParsedRepo(null);
    setRepoUrl(url);
    try {
      const result = await parseRepo(url);
      setParsedRepo(result);
    } catch (e) {
      const msg = e.response?.data?.detail || "Failed to parse repo. Is it public?";
      setError(msg);
    } finally {
      setIsParsing(false);
    }
  }

  async function handleStartSession() {
    setError("");
    setIsStarting(true);
    try {
      const { session_id, first_message } = await startSession(repoUrl, persona);
      navigate("/session", { state: { session_id, first_message, persona, repoUrl } });
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to start session.");
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tight">
            Hot<span className="text-red-500">Seat</span>
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            Paste your repo. Get grilled. Improve your pitch.
          </p>
        </div>

        <RepoInput onParsed={handleParseRepo} isLoading={isParsing} />

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {parsedRepo && (
          <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Repo analyzed:</p>
            <p className="font-bold text-white text-lg">{parsedRepo.owner}/{parsedRepo.repo_name}</p>
            <p className="text-sm text-gray-400 mt-1">
              {parsedRepo.file_count} files detected
              {parsedRepo.tech_stack.length > 0 && ` · ${parsedRepo.tech_stack.slice(0, 5).join(", ")}`}
            </p>
          </div>
        )}

        {parsedRepo && (
          <PersonaSelector selected={persona} onChange={setPersona} />
        )}

        {parsedRepo && (
          <button
            onClick={handleStartSession}
            disabled={isStarting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? "Entering the Hot Seat..." : "Enter the Hot Seat →"}
          </button>
        )}
      </div>
    </div>
  );
}
