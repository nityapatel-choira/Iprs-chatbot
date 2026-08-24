import { useEffect, useRef, useState } from "react";

const useCameraCapture = ({ onCapture } = {}) => {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
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
      setStatus("scanning");
    } catch (err) {
      if (!mountedRef.current) return;
      console.error("Document scan failed to start:", err);
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Camera access was denied. Please allow camera permission and try again.");
      } else if (err.name === "NotFoundError" || err.name === "NotSupportedError") {
        setErrorMessage("No camera was found on this device.");
      } else {
        setErrorMessage("Couldn't start the camera. Please try again.");
      }
    } finally {
      startingRef.current = false;
    }
  }

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.92);

    stopEverything();
    setCapturedImage(imageData);
    setStatus("success");
    onCapture?.(imageData);
  }

  function retake() {
    setCapturedImage(null);
    start();
  }

  function cancel() {
    stopEverything();
    setStatus("idle");
  }

  return { status, errorMessage, capturedImage, videoRef, canvasRef, start, capture, retake, cancel };
};

export default useCameraCapture;
