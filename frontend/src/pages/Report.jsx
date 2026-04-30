import { useLocation, useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import ScoreCard from "../components/ScoreCard";

const SCORE_LABELS = {
  clarity: "Clarity",
  technical_depth: "Technical Depth",
  business_sense: "Business Sense",
  pressure_handling: "Pressure Handling",
  honesty: "Honesty",
};

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, persona, repoUrl } = location.state || {};

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">
          No report found.{" "}
          <a href="/" className="text-red-400 underline">Go back</a>
        </p>
      </div>
    );
  }

  const radarData = Object.entries(SCORE_LABELS).map(([key, label]) => ({
    subject: label,
    score: report[key],
    fullMark: 10,
  }));

  const overallColor =
    report.overall >= 7
      ? "text-green-400"
      : report.overall >= 5
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-white">
          Session <span className="text-red-500">Report</span>
        </h1>
        <p className="text-gray-500 mt-2 capitalize">
          {persona?.replace("_", " ")} · {repoUrl?.split("/").slice(-2).join("/")}
        </p>
      </div>

      {/* Overall Score */}
      <div className="text-center py-8 bg-gray-800 rounded-2xl border border-gray-700">
        <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">Overall Score</p>
        <p className={`text-7xl font-black ${overallColor}`}>{report.overall}</p>
        <p className="text-gray-600 text-sm mt-1">out of 10</p>
      </div>

      {/* Radar Chart */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
        <p className="text-sm text-gray-400 mb-4 font-medium">Performance Breakdown</p>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Cards */}
      <div>
        <p className="text-sm text-gray-400 mb-3 font-medium">Scores</p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(SCORE_LABELS).map(([key, label]) => (
            <ScoreCard key={key} label={label} score={report[key]} />
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div>
        <p className="text-sm text-gray-400 mb-3 font-medium">Strengths</p>
        <div className="space-y-2">
          {report.strengths.map((s, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 bg-green-900/30 border border-green-800 rounded-xl"
            >
              <span className="text-green-400 font-bold">+</span>
              <p className="text-green-200 text-sm">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div>
        <p className="text-sm text-gray-400 mb-3 font-medium">Weaknesses</p>
        <div className="space-y-2">
          {report.weaknesses.map((w, i) => (
            <div
              key={i}
              className="flex gap-3 p-4 bg-red-900/30 border border-red-800 rounded-xl"
            >
              <span className="text-red-400 font-bold">−</span>
              <p className="text-red-200 text-sm">{w}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Item */}
      <div className="p-5 bg-yellow-900/30 border border-yellow-700 rounded-2xl">
        <p className="text-yellow-400 font-semibold text-sm uppercase tracking-wide mb-2">
          Action Item
        </p>
        <p className="text-yellow-100">{report.action_item}</p>
      </div>

      {/* Footer Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={() => navigate("/")}
          className="flex-1 py-3 bg-gray-800 text-gray-300 font-semibold rounded-xl hover:bg-gray-700 border border-gray-700 transition-colors"
        >
          Practice Again
        </button>
        <button
          onClick={() => navigate("/", { state: { repoUrl } })}
          className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
        >
          Try Different Persona
        </button>
      </div>
    </div>
  );
}
