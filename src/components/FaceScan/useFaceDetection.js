import { useEffect, useRef, useState } from "react";

// Must match the installed @mediapipe/tasks-vision version (see package.json).
const TASKS_VISION_VERSION = "1.0.1";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const MIN_CONFIDENCE = 0.6;
const GOOD_FRAMES_TO_CAPTURE = 18;
// Throttles model inference only, not the video framerate - alignment
// feedback doesn't need 60 checks/sec.
const DETECT_INTERVAL_MS = 90;
// Consecutive per-frame failures tolerated before surfacing a recoverable error.
const MAX_CONSECUTIVE_ERRORS = 5;

const TOO_CLOSE_WIDTH_RATIO = 0.85;
const TOO_FAR_WIDTH_RATIO = 0.22;
const CENTER_TOLERANCE = 0.18;

// A discriminated status (not just aligned/not) so the UI can show a specific reason.
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

const useFaceDetection = ({ onCapture } = {}) => {
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
    // Skipping this leaks the detector's WASM allocation on every retake/remount.
    if (detectorRef.current) {
      try {
        detectorRef.current.close();
      } catch {
        // Already released - nothing to clean up.
      }
      detectorRef.current = null;
    }
  }

  async function ensureDetector() {
    if (!detectorRef.current) {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      // CPU delegate deliberately - GPU/WebGL is unstable in Safari and many
      // Android WebViews. The model's light enough that CPU is still real-time.
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        minDetectionConfidence: MIN_CONFIDENCE,
      });
    }
    return detectorRef.current;
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

      await ensureDetector();

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
        // Transient per-frame error - tolerate a few in a row before giving up.
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

  // Reuses the same VIDEO-mode detector for still images too (detectForVideo
  // accepts any ImageSource) - avoids loading the model twice.
  async function detectImageFile(file) {
    const detector = await ensureDetector();

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Couldn't read that file."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.src = dataUrl;
    });

    const result = detector.detectForVideo(image, performance.now());
    const faceCount = (result.detections || []).filter(
      (detection) => (detection.categories?.[0]?.score ?? 0) >= MIN_CONFIDENCE
    ).length;

    return { faceCount, dataUrl };
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
    detectImageFile,
  };
};

export default useFaceDetection;
