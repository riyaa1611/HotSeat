export default function VoiceInput({ isListening, isSupported, onToggle }) {
  if (!isSupported) {
    return (
      <span className="text-xs text-gray-600 px-2">Voice not supported</span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isListening ? "Stop recording" : "Start voice input"}
      className={`p-3 rounded-xl transition-all ${
        isListening
          ? "bg-red-600 text-white animate-pulse"
          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      {isListening ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}
