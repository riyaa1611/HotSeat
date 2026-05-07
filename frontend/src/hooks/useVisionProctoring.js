import { useEffect, useRef } from "react";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

function makeThrottle(cooldownMs = 5000) {
  const lastFired = {};
  return (type, label, cb) => {
    const now = Date.now();
    if (!lastFired[type] || now - lastFired[type] > cooldownMs) {
      lastFired[type] = now;
      cb(type, label);
    }
  };
}

export function useVisionProctoring({ stream, onViolation, enabled = true }) {
  const videoRef = useRef(null);
  const faceRef = useRef(null);
  const handRef = useRef(null);
  const rafRef = useRef(null);
  const throttle = useRef(makeThrottle(5000));
  const noFaceFrames = useRef(0);
  const readyRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // Load MediaPipe models
  useEffect(() => {
    if (!enabled || !stream) return;
    let cancelled = false;

    (async () => {
      try {
        const { FaceLandmarker, HandLandmarker, FilesetResolver } =
          await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        if (cancelled) return;

        const [face, hand] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 2,
          }),
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL },
            runningMode: "VIDEO",
            numHands: 2,
          }),
        ]);

        if (cancelled) { face.close(); hand.close(); return; }
        faceRef.current = face;
        handRef.current = hand;
        readyRef.current = true;
      } catch (e) {
        console.warn("[VisionProctoring] Model load failed:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [enabled, stream]);

  // Hidden video element for inference
  useEffect(() => {
    if (!stream) return;
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;";
    document.body.appendChild(video);
    videoRef.current = video;
    return () => {
      video.srcObject = null;
      document.body.removeChild(video);
      videoRef.current = null;
    };
  }, [stream]);

  // Detection loop at ~1 fps
  useEffect(() => {
    if (!enabled) return;
    let lastRun = 0;

    function loop() {
      rafRef.current = requestAnimationFrame(loop);
      const now = Date.now();
      if (now - lastRun < 1000) return;
      lastRun = now;

      const video = videoRef.current;
      if (!readyRef.current || !video || video.readyState < 2) return;

      const t = throttle.current;
      const cb = onViolationRef.current;

      try {
        // ── Face analysis ──────────────────────────────────
        const faceResult = faceRef.current.detectForVideo(video, now);
        const n = faceResult.faceLandmarks.length;

        if (n === 0) {
          noFaceFrames.current++;
          if (noFaceFrames.current >= 2)
            t("no_face", "Face not visible — are you looking at the screen?", cb);
        } else {
          noFaceFrames.current = 0;

          if (n > 1) t("multi_face", "Multiple faces detected.", cb);

          // Gaze via blendshapes
          const bs = faceResult.faceBlendshapes?.[0]?.categories ?? [];
          const get = (name) => bs.find((b) => b.categoryName === name)?.score ?? 0;

          const left  = Math.max(get("eyeLookOutLeft"),  get("eyeLookInRight"));
          const right = Math.max(get("eyeLookOutRight"), get("eyeLookInLeft"));
          const down  = (get("eyeLookDownLeft") + get("eyeLookDownRight")) / 2;
          const blink = (get("eyeBlinkLeft") + get("eyeBlinkRight")) / 2;

          if (left > 0.55 || right > 0.55)
            t("gaze_side", "Eyes looking away from screen.", cb);
          else if (down > 0.55)
            t("gaze_down", "Looking down — eyes on the screen.", cb);

          if (blink > 0.8)
            t("eyes_closed", "Eyes closed for extended period.", cb);
        }

        // ── Hand analysis ──────────────────────────────────
        const handResult = handRef.current.detectForVideo(video, now);
        for (const landmarks of handResult.landmarks) {
          const wrist = landmarks[0];
          // Wrist in upper 55% of frame = near face
          if (wrist.y < 0.55) {
            t("hand_near_face", "Hand near face detected.", cb);
            break;
          }
        }
      } catch {
        // Ignore per-frame errors
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      faceRef.current?.close();
      handRef.current?.close();
    };
  }, []);
}
