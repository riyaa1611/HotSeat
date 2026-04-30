const PERSONAS = [
  {
    id: "investor",
    label: "Investor",
    emoji: "💰",
    description: "VC who's funded nothing this month. Cares about money, not code.",
    color: "border-yellow-500",
  },
  {
    id: "tech_lead",
    label: "Tech Lead",
    emoji: "🔧",
    description: "15 years of PRs. Will ask where your tests are.",
    color: "border-blue-500",
  },
  {
    id: "hr_manager",
    label: "HR Manager",
    emoji: "📋",
    description: "12 years of behavioral interviews. Smells rehearsed answers.",
    color: "border-purple-500",
  },
  {
    id: "product_manager",
    label: "Product Manager",
    emoji: "📊",
    description: "Shipped 20 products, killed 15. Cares about users, not architecture.",
    color: "border-green-500",
  },
];

export default function PersonaSelector({ selected, onChange }) {
  return (
    <div className="w-full max-w-2xl">
      <p className="text-sm font-medium text-gray-400 mb-3">Choose Your Interviewer</p>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map((p) => (
          <label
            key={p.id}
            className={`relative flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${selected === p.id
                ? `${p.color} bg-gray-800`
                : "border-gray-700 bg-gray-800/50 hover:border-gray-500"
              }`}
          >
            <input
              type="radio"
              name="persona"
              value={p.id}
              checked={selected === p.id}
              onChange={() => onChange(p.id)}
              className="sr-only"
            />
            <span className="text-2xl">{p.emoji}</span>
            <span className="font-semibold text-white">{p.label}</span>
            <span className="text-xs text-gray-400">{p.description}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
