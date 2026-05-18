import { useState, useEffect, useRef } from "react";

export function useSpeechRecognition({ onTranscript, onAutoSend, onSilenceTimeout }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const autoSendTimer = useRef(null);
  const silenceTimer = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onAutoSendRef = useRef(onAutoSend);
  const onSilenceTimeoutRef = useRef(onSilenceTimeout);
  const shouldListenRef = useRef(false);

  const SILENCE_TIMEOUT = 60_000;

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onAutoSendRef.current = onAutoSend; }, [onAutoSend]);
  useEffect(() => { onSilenceTimeoutRef.current = onSilenceTimeout; }, [onSilenceTimeout]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        shouldListenRef.current = false;
        recognition.stop();
        setIsListening(false);
        onSilenceTimeoutRef.current?.();
      }, SILENCE_TIMEOUT);
    };

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript + " ";
        else interim += result[0].transcript;
      }
      resetSilenceTimer();
      onTranscriptRef.current?.(final || interim);
    };

    const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

    recognition.onerror = (e) => {
      if (e.error === "aborted") return;
      if (FATAL_ERRORS.has(e.error)) {
        // Permission denied or no mic — stop and don't retry
        shouldListenRef.current = false;
        clearTimeout(silenceTimer.current);
        setIsListening(false);
        return;
      }
      // Transient errors (no-speech, network) — onend will restart if still intending to listen
    };

    // Chrome fires onend after silence even with continuous=true — restart if user hasn't stopped
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // start() failed (e.g. permission revoked mid-session) — stop cleanly
          shouldListenRef.current = false;
          clearTimeout(silenceTimer.current);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(autoSendTimer.current);
      clearTimeout(silenceTimer.current);
      shouldListenRef.current = false;
      recognition.abort();
    };
  }, []); // create once — callbacks accessed via refs

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      shouldListenRef.current = false;
      clearTimeout(silenceTimer.current);
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
      silenceTimer.current = setTimeout(() => {
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
        setIsListening(false);
        onSilenceTimeoutRef.current?.();
      }, SILENCE_TIMEOUT);
    }
  }

  return { isListening, isSupported, toggleListening };
}
