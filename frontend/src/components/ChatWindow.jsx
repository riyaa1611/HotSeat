import { useEffect, useRef } from "react";

const PERSONA_LABELS = {
  investor: "Investor",
  tech_lead: "Tech Lead",
  hr_manager: "HR Manager",
  product_manager: "Product Manager",
};

export default function ChatWindow({ messages, persona, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const personaLabel = PERSONA_LABELS[persona] || "Interviewer";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === "user"
                ? "bg-red-600 text-white rounded-br-sm"
                : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700"
              }`}
          >
            {msg.role === "assistant" && (
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                {personaLabel}
              </p>
            )}
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
            <div className="flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
