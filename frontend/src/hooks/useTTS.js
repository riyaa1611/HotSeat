import { useCallback, useRef, useEffect, useState } from "react";

const PERSONA_SETTINGS = {
  investor:        { rate: 0.88, pitch: 0.8 },
  tech_lead:       { rate: 1.0,  pitch: 1.0 },
  hr_manager:      { rate: 0.85, pitch: 1.1 },
  product_manager: { rate: 1.05, pitch: 0.95 },
};

export function useTTS(persona = "investor") {
  const [enabled, setEnabled] = useState(true);
  const synth = useRef(window.speechSynthesis);

  useEffect(() => () => synth.current?.cancel(), []);

  const speak = useCallback((text) => {
    if (!enabled || !synth.current || !text) return;
    synth.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const s = PERSONA_SETTINGS[persona] ?? PERSONA_SETTINGS.investor;
    utt.rate = s.rate;
    utt.pitch = s.pitch;
    utt.lang = "en-US";
    synth.current.speak(utt);
  }, [enabled, persona]);

  const stop = useCallback(() => synth.current?.cancel(), []);

  return { speak, stop, enabled, setEnabled };
}
