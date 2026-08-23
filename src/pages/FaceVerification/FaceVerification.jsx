import { useEffect, useState } from "react";
import CameraIcon from "../../components/icons/CameraIcon";
import CheckIcon from "../../components/icons/CheckIcon";
import AlertIcon from "../../components/icons/AlertIcon";
import ShieldIcon from "../../components/icons/ShieldIcon";
import FileUploader from "../../components/FileUploader/FileUploader";
import ChatHeader from "../Chat/components/ChatHeader/ChatHeader";
import useFaceDetection from "../../components/FaceScan/useFaceDetection";
import styles from "./FaceVerification.module.css";

// Full-screen selfie-capture experience. Detection/capture logic lives in
// useFaceDetection - this component is purely the UI layer around it, so
// onCapture already receives the captured data URL the moment a photo is
// taken (live capture or upload), ready to be POSTed once a backend
// integration needs it.
//
// Reuses two existing IPRS pieces as-is: ChatHeader (same header every
// other screen uses - see FaceVerification.module.css's --canvas-bg/
// --card-border for the shared tint/border) and FileUploader (same upload
// card used for PAN/bank documents, sized off the same --card-pct/
// --card-max variables Chat.module.css defines).
//
// `embedded` lets this component drop into the Document Upload flow
// (Chat.jsx's Passport Size Photo step) instead of only being a full-page
// screen: it hides the standalone ChatHeader/back-button/trust footer and
// lets the surrounding card own the width. Standalone use (?test=facescan)
// is unaffected since `embedded` defaults to false.
function FaceVerification({ onBack, onCapture, onContinue, language = "English", embedded = false, initialMode = "camera" }) {
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
    detectImageFile,
  } = useFaceDetection({ onCapture });

  // "camera" or "upload" - both are always reachable via the fallback
  // links below regardless of which one this instance starts in; the
  // Document Upload "Scan Face"/"Upload Photo" choice picks the starting
  // mode via `initialMode`, standalone use always starts on "camera".
  const [mode, setMode] = useState(initialMode);
  // Only the very first entry into upload mode (Document Upload's "Upload
  // from Device" choice, via initialMode="upload") should skip straight to
  // the native picker. The in-scan fallback links ("Upload a photo
  // instead") are a manual switch away from the camera and should land on
  // the upload card first rather than popping a file dialog unannounced.
  // switchToUpload sets this true, permanently turning off auto-opening for
  // the rest of this instance's life.
  const [manualUploadSwitch, setManualUploadSwitch] = useState(false);
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
    // Release the camera while the upload card is up - no reason to keep
    // it running while the user is picking a file.
    cancel();
    setManualUploadSwitch(true);
    setMode("upload");
    setUploadStatus("idle");
    setUploadErrorMessage("");
    setUploadedImage(null);
  }

  function switchToCamera() {
    setMode("camera");
  }

  async function handleFileSelected(file) {
    setUploadStatus("uploading");
    setUploadErrorMessage("");
    try {
      const { faceCount, dataUrl } = await detectImageFile(file);
      if (faceCount === 0) {
        setUploadStatus("error");
        setUploadErrorMessage("No face detected. Please upload a clear photo of your face.");
        return;
      }
      if (faceCount > 1) {
        setUploadStatus("error");
        setUploadErrorMessage("Multiple faces detected. Please upload a photo with only your face.");
        return;
      }
      setUploadStatus("success");
      setUploadedImage(dataUrl);
      onCapture?.(dataUrl);
    } catch {
      setUploadStatus("error");
      setUploadErrorMessage("Couldn't read that file. Please try again.");
    }
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
    <div className={embedded ? styles.embeddedWrap : styles.page}>
      <div className={embedded ? styles.embeddedPanel : styles.panel}>
        {!embedded && <ChatHeader title="Capture Now" language={language} onBack={handleBack} />}

        <div className={embedded ? styles.embeddedContent : styles.content}>
          {showUploadForm ? (
            <div className={styles.uploadArea}>
              <FileUploader
                title="Upload a clear photo of your face"
                caption="JPEG or PNG, up to 5MB"
                accept=".jpg,.jpeg,.png"
                onFileSelected={handleFileSelected}
                status={uploadStatus}
                errorMessage={uploadErrorMessage}
                autoOpen={initialMode === "upload" && !manualUploadSwitch}
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

        {!embedded && (
          <div className={styles.trustBadge}>
            <ShieldIcon width={14} height={14} />
            <span>Secured by IPRS</span>
          </div>
        )}

        <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
      </div>
    </div>
  );
}

export default FaceVerification;
