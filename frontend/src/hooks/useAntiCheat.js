import { useState, useEffect, useRef, useCallback } from "react";

export function useAntiCheat(enabled = true) {
  const [violations, setViolations] = useState([]);
  const [lastWarning, setLastWarning] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamDenied, setWebcamDenied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const readyRef = useRef(false);
  const warningTimer = useRef(null);

  const addViolation = useCallback((type, label) => {
    if (!readyRef.current) return;
    setViolations((prev) => [...prev, { type, label, ts: Date.now() }]);
    setLastWarning(label);
    clearTimeout(warningTimer.current);
    warningTimer.current = setTimeout(() => setLastWarning(null), 4000);
  }, []);

  // Grace period — ignore violations during setup/permission dialogs
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => { readyRef.current = true; }, 3000);
    return () => clearTimeout(t);
  }, [enabled]);

  // Fullscreen
  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;
    requestFullscreen();
    const onFSChange = () => {
      const inFS = !!document.fullscreenElement;
      setIsFullscreen(inFS);
      if (!inFS) addViolation("fullscreen_exit", "Exited fullscreen — return to continue.");
    };
    document.addEventListener("fullscreenchange", onFSChange);
    return () => document.removeEventListener("fullscreenchange", onFSChange);
  }, [enabled, addViolation, requestFullscreen]);

  // Tab switch
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.hidden) addViolation("tab_switch", "Tab switch detected.");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled, addViolation]);

  // Window focus loss (alt-tab, other app)
  useEffect(() => {
    if (!enabled) return;
    const onBlur = () => addViolation("focus_loss", "Window lost focus.");
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [enabled, addViolation]);

  // Right-click / context menu
  useEffect(() => {
    if (!enabled) return;
    const onCtxMenu = (e) => {
      e.preventDefault();
      addViolation("right_click", "Right-click is disabled during interview.");
    };
    document.addEventListener("contextmenu", onCtxMenu);
    return () => document.removeEventListener("contextmenu", onCtxMenu);
  }, [enabled, addViolation]);

  // Webcam
  useEffect(() => {
    if (!enabled) return;
    let stream;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => { stream = s; setWebcamStream(s); })
      .catch(() => setWebcamDenied(true));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(warningTimer.current);
    };
  }, []);

  return {
    violations,
    lastWarning,
    webcamStream,
    webcamDenied,
    isFullscreen,
    requestFullscreen,
    addViolation,
  };
}
