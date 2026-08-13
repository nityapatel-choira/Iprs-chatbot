import { useEffect, useRef, useState } from "react";

const TASKS_VISION_VERSION = "1.0.1";
const WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const MIN_CONFIDENCE = 0.6;
const GOOD_FRAMES_TO_CAPTURE = 24;

function isFaceAligned(detection, videoWidth, videoHeight) {
  const category = detection.categories?.[0];
  if (!category || category.score < MIN_CONFIDENCE) return false;

  const box = detection.boundingBox;
  if (!box) return false;

  const boxCenterX = box.originX + box.width / 2;
  const boxCenterY = box.originY + box.height / 2;
  const frameCenterX = videoWidth / 2;
  const frameCenterY = videoHeight / 2;

  const offsetX = Math.abs(boxCenterX - frameCenterX) / videoWidth;
  const offsetY = Math.abs(boxCenterY - frameCenterY) / videoHeight;
  const widthRatio = box.width / videoWidth;

  return offsetX < 0.18 && offsetY < 0.18 && widthRatio > 0.22 && widthRatio < 0.85;
}

function useFaceDetection({ onCapture } = {}) {
  const [status, setStatus] = useState("idle");
  const [faceAligned, setFaceAligned] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafIdRef = useRef(null);
  const goodFrameCountRef = useRef(0);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopEverything();
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
        try {
          detectorRef.current = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "GPU" },
            runningMode: "VIDEO",
            minDetectionConfidence: MIN_CONFIDENCE,
          });
        } catch (gpuErr) {
          console.warn("Face detector GPU delegate failed, falling back to CPU.", gpuErr);
          detectorRef.current = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "CPU" },
            runningMode: "VIDEO",
            minDetectionConfidence: MIN_CONFIDENCE,
          });
        }
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

  function tick() {
    if (!mountedRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const detector = detectorRef.current;

    if (video && detector && video.readyState >= 2) {
      const result = detector.detectForVideo(video, performance.now());
      const detection = result.detections?.[0];
      const aligned = detection ? isFaceAligned(detection, video.videoWidth, video.videoHeight) : false;

      setFaceAligned(aligned);
      goodFrameCountRef.current = aligned ? goodFrameCountRef.current + 1 : 0;

      if (goodFrameCountRef.current >= GOOD_FRAMES_TO_CAPTURE) {
        capture();
        return;
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
    setFaceAligned(false);
    start();
  }

  function cancel() {
    stopEverything();
    setStatus("idle");
    setFaceAligned(false);
  }

  return {
    status,
    faceAligned,
    errorMessage,
    capturedImage,
    videoRef,
    canvasRef,
    start,
    retake,
    cancel,
  };
}

export default useFaceDetection;
