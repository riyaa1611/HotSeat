import { useState, useEffect, useRef } from "react";

export function useSpeechRecognition({ onTranscript, onAutoSend }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const autoSendTimer = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onAutoSendRef = useRef(onAutoSend);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onAutoSendRef.current = onAutoSend; }, [onAutoSend]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscriptRef.current?.(transcript);
      setIsListening(false);

      if (onAutoSendRef.current) {
        clearTimeout(autoSendTimer.current);
        autoSendTimer.current = setTimeout(() => onAutoSendRef.current(transcript), 800);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(autoSendTimer.current);
      recognition.abort();
    };
  }, []); // create once — callbacks accessed via refs

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  return { isListening, isSupported, toggleListening };
}
