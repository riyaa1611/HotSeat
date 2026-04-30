export default function ScoreCard({ label, score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = score >= 7 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-lg font-bold text-white">
          {score}<span className="text-gray-500 text-sm">/{max}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
