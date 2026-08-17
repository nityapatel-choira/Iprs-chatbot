import { useEffect, useRef, useState } from "react";

// Keep in sync with the installed @mediapipe/tasks-vision version (see
// package.json) - the CDN path below is versioned and must match exactly,
// this is Google's own documented way to load the WASM runtime for web.
const TASKS_VISION_VERSION = "1.0.1";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const MIN_CONFIDENCE = 0.6;
const GOOD_FRAMES_TO_CAPTURE = 18;
// Detection cadence, not render cadence: the video keeps playing at full
// framerate, only the (comparatively expensive) model inference is
// throttled - real-time alignment feedback doesn't need 60 checks/sec, and
// running one on every rAF tick was pure wasted CPU/battery.
const DETECT_INTERVAL_MS = 90;
// Consecutive in-loop inference failures (a transient WASM/driver hiccup,
// not a startup failure) before we give up and surface a recoverable error
// instead of retrying forever or letting an exception escape the loop.
const MAX_CONSECUTIVE_ERRORS = 5;

const TOO_CLOSE_WIDTH_RATIO = 0.85;
const TOO_FAR_WIDTH_RATIO = 0.22;
const CENTER_TOLERANCE = 0.18;

// One discriminated status instead of a single aligned/not-aligned boolean,
// so the UI can show a specific, actionable reason instead of a generic
// "not aligned" hint.
export const ALIGNMENT_MESSAGES = {
  "no-face": "Position your face inside the frame",
  "multiple-faces": "Multiple faces detected - make sure it's just you",
  "too-close": "Move back a little",
  "too-far": "Move a little closer",
  "off-center": "Center your face in the frame",
  aligned: "Hold still, scanning...",
};

function classifyAlignment(detections, videoWidth, videoHeight) {
  if (!detections || detections.length === 0) return "no-face";
  if (detections.length > 1) return "multiple-faces";

  const category = detections[0].categories?.[0];
  if (!category || category.score < MIN_CONFIDENCE) return "no-face";

  const box = detections[0].boundingBox;
  if (!box) return "no-face";

  const widthRatio = box.width / videoWidth;
  if (widthRatio > TOO_CLOSE_WIDTH_RATIO) return "too-close";
  if (widthRatio < TOO_FAR_WIDTH_RATIO) return "too-far";

  const offsetX = Math.abs(box.originX + box.width / 2 - videoWidth / 2) / videoWidth;
  const offsetY = Math.abs(box.originY + box.height / 2 - videoHeight / 2) / videoHeight;
  if (offsetX > CENTER_TOLERANCE || offsetY > CENTER_TOLERANCE) return "off-center";

  return "aligned";
}

function useFaceDetection({ onCapture } = {}) {
  const [status, setStatus] = useState("idle"); // idle | loading | scanning | error | success
  const [alignment, setAlignment] = useState("no-face");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafIdRef = useRef(null);
  const goodFrameCountRef = useRef(0);
  const lastDetectAtRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopEverything();
      closeDetector();
    };
  }, []);

  function stopEverything() {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function closeDetector() {
    // Releases the detector's native WASM heap allocation. The previous
    // implementation never did this, leaking a full detector instance on
    // every retake/remount - the most likely reason it eventually started
    // throwing after normal use (WASM allocation failures).
    if (detectorRef.current) {
      try {
        detectorRef.current.close();
      } catch {
        // Already released - nothing to clean up.
      }
      detectorRef.current = null;
    }
  }

  async function start() {
    if (startingRef.current) return;
    startingRef.current = true;

    setErrorMessage("");
    setStatus("loading");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("Camera not supported"), { name: "NotSupportedError" });
      }

      if (!detectorRef.current) {
        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
        // CPU delegate only, deliberately - MediaPipe's GPU/WebGL delegate
        // is a well-documented source of instability in Safari (macOS and
        // iOS) and many Android WebViews, and the old code's fallback only
        // covered *creation* failures, not the far more common case of it
        // failing mid-inference. The blaze_face_short_range model is light
        // enough that CPU WASM inference is comfortably real-time at the
        // resolution used here, so there's no real tradeoff.
        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          minDetectionConfidence: MIN_CONFIDENCE,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 640 } },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      if (!mountedRef.current) return;

      goodFrameCountRef.current = 0;
      consecutiveErrorsRef.current = 0;
      lastDetectAtRef.current = 0;
      setAlignment("no-face");
      setStatus("scanning");
      rafIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Face scan failed to start:", err);
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access was denied. Please allow camera permission and try again.");
      } else if (err.name === "NotFoundError" || err.name === "NotSupportedError") {
        setErrorMessage("No camera was found on this device.");
      } else {
        setErrorMessage("Couldn't start face scan. Please try again.");
      }
    } finally {
      startingRef.current = false;
    }
  }

  function tick(now) {
    if (!mountedRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const detector = detectorRef.current;

    if (video && detector && video.readyState >= 2 && now - lastDetectAtRef.current >= DETECT_INTERVAL_MS) {
      lastDetectAtRef.current = now;
      try {
        const result = detector.detectForVideo(video, now);
        consecutiveErrorsRef.current = 0;

        const nextAlignment = classifyAlignment(result.detections, video.videoWidth, video.videoHeight);
        setAlignment(nextAlignment);
        goodFrameCountRef.current = nextAlignment === "aligned" ? goodFrameCountRef.current + 1 : 0;

        if (goodFrameCountRef.current >= GOOD_FRAMES_TO_CAPTURE) {
          capture();
          return;
        }
      } catch (err) {
        // A transient per-frame inference error (not a startup failure) -
        // the old code had no handling here at all, so this would have
        // been an uncaught exception killing the loop silently. Tolerate a
        // few in a row (camera hiccup, dropped frame) before giving up.
        consecutiveErrorsRef.current += 1;
        console.warn("Face detection frame failed:", err);
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          stopEverything();
          setStatus("error");
          setErrorMessage("Face detection stopped unexpectedly. Please try again.");
          return;
        }
      }
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.92);

    stopEverything();
    setCapturedImage(imageData);
    setStatus("success");
    onCapture?.(imageData);
  }

  function retake() {
    setCapturedImage(null);
    setAlignment("no-face");
    start();
  }

  function cancel() {
    stopEverything();
    setStatus("idle");
    setAlignment("no-face");
  }

  return {
    status,
    alignment,
    alignmentMessage: ALIGNMENT_MESSAGES[alignment],
    errorMessage,
    capturedImage,
    videoRef,
    canvasRef,
    start,
    capture,
    retake,
    cancel,
  };
}

export default useFaceDetection;
