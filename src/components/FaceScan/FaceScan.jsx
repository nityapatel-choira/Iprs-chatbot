import CameraIcon from "../icons/CameraIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import useFaceDetection from "./useFaceDetection";
import styles from "./FaceScan.module.css";

function FaceScan({ title = "Scan your face", caption = "We'll use this to verify your identity", onCapture, onCancel, disabled }) {
  const { status, faceAligned, errorMessage, capturedImage, videoRef, canvasRef, start, retake, cancel } =
    useFaceDetection({ onCapture });

  function handleCancel() {
    cancel();
    onCancel?.();
  }

  return (
    <div className={styles.wrap}>
      {status === "idle" && (
        <button type="button" className={styles.dropzone} onClick={start} disabled={disabled}>
          <CameraIcon />
          <span className={styles.title}>{title}</span>
          <span className={styles.caption}>{caption}</span>
        </button>
      )}

      {status === "loading" && (
        <div className={styles.panel}>
          <span className={styles.spinner} />
          <span className={styles.title} role="status" aria-live="polite">
            Starting camera...
          </span>
        </div>
      )}

      {status === "error" && (
        <div className={styles.panel}>
          <span className={styles.alertIcon}>
            <AlertIcon />
          </span>
          <span className={styles.title}>Camera unavailable</span>
          <span className={styles.caption} role="alert">
            {errorMessage}
          </span>
          <div className={styles.actionRow}>
            <button type="button" className={styles.primaryButton} onClick={start}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {status === "scanning" && (
        <div className={styles.panel}>
          <div className={styles.videoStage}>
            <video ref={videoRef} className={styles.video} muted playsInline />
            <div className={`${styles.faceGuide} ${faceAligned ? styles.faceGuideAligned : ""}`} />
          </div>
          <span
            className={`${styles.statusText} ${faceAligned ? styles.statusTextAligned : ""}`}
            role="status"
            aria-live="polite"
          >
            {faceAligned ? "Hold still..." : "Position your face inside the oval"}
          </span>
          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className={styles.panel}>
          <div className={styles.resultStage}>
            <img src={capturedImage} alt="Captured face scan" className={styles.resultImage} />
            <span className={styles.successBadge}>
              <CheckIcon />
            </span>
          </div>
          <span className={styles.title} role="status" aria-live="polite">
            Face captured
          </span>
          <div className={styles.actionRow}>
            <button type="button" className={styles.secondaryButton} onClick={retake}>
              Retake
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
    </div>
  );
}

export default FaceScan;
