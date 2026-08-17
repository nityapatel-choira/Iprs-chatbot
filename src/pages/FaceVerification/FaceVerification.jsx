import { useEffect, useState } from "react";
import CameraIcon from "../../components/icons/CameraIcon";
import CheckIcon from "../../components/icons/CheckIcon";
import AlertIcon from "../../components/icons/AlertIcon";
import ShieldIcon from "../../components/icons/ShieldIcon";
import FileUploader from "../../components/FileUploader/FileUploader";
import ChatHeader from "../Chat/components/ChatHeader/ChatHeader";
import useFaceDetection from "../../components/FaceScan/useFaceDetection";
import styles from "./FaceVerification.module.css";

// Full-screen selfie-capture experience. Detection/capture logic all lives
// in useFaceDetection (untouched here) - this component is purely the UI
// layer around it, so it stays modular and backend-ready: onCapture already
// receives the captured data URL the moment a photo is taken (live capture
// or upload), ready to be POSTed wherever a future integration needs
// without touching this component.
//
// Reuses two existing IPRS pieces as-is rather than approximating their
// look: ChatHeader (same header every other screen already uses - see
// FaceVerification.module.css's --canvas-bg/--card-border for how it picks
// up the exact same tint/border here) and FileUploader (same upload card
// used for PAN/bank documents elsewhere, sized off the same --card-pct/
// --card-max variables Chat.module.css defines, so it's not just visually
// similar but literally the same width logic).
function FaceVerification({ onBack, onCapture, onContinue, language = "English" }) {
  const {
    status,
    alignment,
    alignmentMessage,
    errorMessage,
    capturedImage,
    videoRef,
    canvasRef,
    start,
    capture,
    retake,
    cancel,
  } = useFaceDetection({ onCapture });

  // "camera" (default) or "upload" - an always-available fallback, not a
  // replacement path: the live camera stays primary, upload is one tap
  // away below the shutter button (and again in the error state, where
  // it's the more likely next move).
  const [mode, setMode] = useState("camera");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);

  const isUploadMode = mode === "upload";
  const showSuccess = isUploadMode ? Boolean(uploadedImage) : status === "success";
  const displayImage = isUploadMode ? uploadedImage : capturedImage;
  const showUploadForm = isUploadMode && !showSuccess;

  const isAligned = !isUploadMode && alignment === "aligned";
  const hasAlert = !isUploadMode && alignment === "multiple-faces";
  const ringClass = showSuccess
    ? styles.ringAligned
    : isAligned
      ? styles.ringAligned
      : hasAlert
        ? styles.ringAlert
        : styles.ringNeutral;

  // Camera opens the moment this screen is reached (and again whenever the
  // user switches back from upload mode) - matching a real mobile
  // selfie-capture flow, no separate "tap to start" interstitial.
  useEffect(() => {
    if (mode === "camera") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function handleBack() {
    cancel();
    onBack?.();
  }

  function switchToUpload() {
    // Release the camera while the upload card is up (item 22) - there's
    // no reason to keep it running while the user is picking a file.
    cancel();
    setMode("upload");
    setUploadStatus("idle");
    setUploadErrorMessage("");
    setUploadedImage(null);
  }

  function switchToCamera() {
    setMode("camera");
  }

  function handleFileSelected(file) {
    setUploadStatus("uploading");
    setUploadErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setUploadStatus("success");
      setUploadedImage(dataUrl);
      onCapture?.(dataUrl);
    };
    reader.onerror = () => {
      setUploadStatus("error");
      setUploadErrorMessage("Couldn't read that file. Please try again.");
    };
    reader.readAsDataURL(file);
  }

  function handleRetake() {
    if (isUploadMode) {
      setUploadStatus("idle");
      setUploadedImage(null);
      setUploadErrorMessage("");
    } else {
      retake();
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <ChatHeader title="Capture Now" language={language} onBack={handleBack} />

        <div className={styles.content}>
          {showUploadForm ? (
            <div className={styles.uploadArea}>
              <FileUploader
                title="Upload a clear photo of your face"
                caption="JPEG or PNG, up to 5MB"
                accept=".jpg,.jpeg,.png"
                onFileSelected={handleFileSelected}
                status={uploadStatus}
                errorMessage={uploadErrorMessage}
              />
              <button type="button" className={styles.fallbackLink} onClick={switchToCamera}>
                Use camera instead
              </button>
            </div>
          ) : (
            <div className={styles.frameGroup}>
              <div className={`${styles.ring} ${ringClass}`}>
                <div className={styles.videoStage}>
                  {!isUploadMode && (status === "idle" || status === "loading" || status === "scanning") && (
                    <video ref={videoRef} className={styles.video} muted playsInline />
                  )}

                  {!isUploadMode && (status === "idle" || status === "loading") && (
                    <div className={styles.overlay}>
                      <span className={styles.spinner} />
                    </div>
                  )}

                  {!isUploadMode && status === "error" && (
                    <div className={styles.overlay}>
                      <span className={styles.alertIcon}>
                        <AlertIcon />
                      </span>
                    </div>
                  )}

                  {showSuccess && displayImage && (
                    <img src={displayImage} alt="Captured selfie" className={styles.resultImage} />
                  )}
                </div>

                {showSuccess && (
                  <span className={styles.successBadge}>
                    <CheckIcon />
                  </span>
                )}
              </div>

              <p
                className={`${styles.statusText} ${isAligned ? styles.statusTextAligned : ""} ${
                  hasAlert || status === "error" ? styles.statusTextAlert : ""
                }`}
                role="status"
                aria-live="polite"
              >
                {!isUploadMode && (status === "idle" || status === "loading") && "Starting camera..."}
                {!isUploadMode && status === "error" && errorMessage}
                {!isUploadMode && status === "scanning" && alignmentMessage}
                {showSuccess && (isUploadMode ? "Photo uploaded successfully" : "Face captured successfully")}
              </p>

              {!isUploadMode && status === "scanning" && (
                <>
                  <button type="button" className={styles.shutterButton} onClick={capture} aria-label="Capture photo">
                    <CameraIcon width={30} height={30} />
                  </button>
                  <button type="button" className={styles.fallbackLink} onClick={switchToUpload}>
                    Having trouble? Upload a photo instead
                  </button>
                </>
              )}

              {!isUploadMode && status === "error" && (
                <>
                  <button type="button" className={styles.retryButton} onClick={start}>
                    Try Again
                  </button>
                  <button type="button" className={styles.fallbackLink} onClick={switchToUpload}>
                    Upload a photo instead
                  </button>
                </>
              )}

              {showSuccess && (
                <div className={styles.resultActions}>
                  <button type="button" className={styles.continueButton} onClick={() => onContinue?.(displayImage)}>
                    Continue
                  </button>
                  <button type="button" className={styles.retakeButton} onClick={handleRetake}>
                    Retake
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.trustBadge}>
          <ShieldIcon width={14} height={14} />
          <span>Secured by IPRS</span>
        </div>

        <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
      </div>
    </div>
  );
}

export default FaceVerification;
