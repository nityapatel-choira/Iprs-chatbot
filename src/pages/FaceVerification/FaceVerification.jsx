import { useEffect, useState } from "react";
import CameraIcon from "../../components/icons/CameraIcon";
import CheckIcon from "../../components/icons/CheckIcon";
import AlertIcon from "../../components/icons/AlertIcon";
import ShieldIcon from "../../components/icons/ShieldIcon";
import FileUploader from "../../components/FileUploader/FileUploader";
import ChatHeader from "../Chat/components/ChatHeader/ChatHeader";
import useFaceDetection from "../../components/FaceScan/useFaceDetection";
import styles from "./FaceVerification.module.css";

// Selfie-capture UI around useFaceDetection. Reuses ChatHeader and
// FileUploader as-is for visual consistency with the rest of the app.
//
// `embedded` drops this into Document Upload's Passport Photo step instead
// of a full-page screen - hides the header/footer, lets the parent own the width.
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

  // initialMode picks the starting mode; both are reachable via the fallback links either way.
  const [mode, setMode] = useState(initialMode);
  // Only the first entry into upload mode (initialMode="upload") should
  // auto-open the file picker. Manual switches (the fallback links) should
  // land on the upload card first, not pop a dialog unannounced.
  const [manualUploadSwitch, setManualUploadSwitch] = useState(false);
  const [upload, setUpload] = useState({ status: "idle", errorMessage: "", image: null });

  const isUploadMode = mode === "upload";
  const showSuccess = isUploadMode ? Boolean(upload.image) : status === "success";
  const displayImage = isUploadMode ? upload.image : capturedImage;
  const showUploadForm = isUploadMode && !showSuccess;

  const isAligned = !isUploadMode && alignment === "aligned";
  const hasAlert = !isUploadMode && alignment === "multiple-faces";

  let ringClass = styles.ringNeutral;
  if (showSuccess || isAligned) {
    ringClass = styles.ringAligned;
  } else if (hasAlert) {
    ringClass = styles.ringAlert;
  }

  // Camera opens immediately (and again on switching back) - no "tap to start" step.
  useEffect(() => {
    if (mode === "camera") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleBack = () => {
    cancel();
    onBack?.();
  };

  const switchToUpload = () => {
    // Release the camera while the upload card is up.
    cancel();
    setManualUploadSwitch(true);
    setMode("upload");
    setUpload({ status: "idle", errorMessage: "", image: null });
  };

  const switchToCamera = () => {
    setMode("camera");
  };

  const handleFileSelected = async (file) => {
    setUpload({ status: "uploading", errorMessage: "", image: null });
    try {
      const { faceCount, dataUrl } = await detectImageFile(file);
      if (faceCount === 0) {
        setUpload({
          status: "error",
          errorMessage: "No face detected. Please upload a clear photo of your face.",
          image: null,
        });
        return;
      }
      if (faceCount > 1) {
        setUpload({
          status: "error",
          errorMessage: "Multiple faces detected. Please upload a photo with only your face.",
          image: null,
        });
        return;
      }
      setUpload({ status: "success", errorMessage: "", image: dataUrl });
      onCapture?.(dataUrl);
    } catch {
      setUpload({ status: "error", errorMessage: "Couldn't read that file. Please try again.", image: null });
    }
  };

  const handleRetake = () => {
    if (isUploadMode) {
      setUpload({ status: "idle", errorMessage: "", image: null });
    } else {
      retake();
    }
  };

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
                status={upload.status}
                errorMessage={upload.errorMessage}
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
