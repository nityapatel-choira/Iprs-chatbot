import CameraIcon from "../../components/icons/CameraIcon";
import CheckIcon from "../../components/icons/CheckIcon";
import AlertIcon from "../../components/icons/AlertIcon";
import useFaceDetection from "../../components/FaceScan/useFaceDetection";
import styles from "./FaceVerification.module.css";

const INSTRUCTIONS = [
  "Position your face inside the circle",
  "Ensure good lighting",
  "Remove sunglasses or face coverings",
];

function FaceVerification() {
  const { status, faceAligned, errorMessage, capturedImage, videoRef, canvasRef, start, retake, cancel } =
    useFaceDetection();

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>Face Verification</h1>
        </header>

        <div className={styles.content}>
          {status === "idle" && (
            <>
              <span className={styles.iconBadge}>
                <CameraIcon width={32} height={32} />
              </span>
              <h2 className={styles.heading}>Let&apos;s verify it&apos;s you</h2>
              <p className={styles.subtitle}>
                We&apos;ll take a quick live photo to confirm your identity. This stays on your device for now.
              </p>

              <ul className={styles.instructionList}>
                {INSTRUCTIONS.map((item, index) => (
                  <li key={item} className={styles.instructionRow}>
                    <span className={styles.instructionIcon} aria-hidden="true">
                      {index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          {status === "loading" && (
            <div className={styles.centerState}>
              <span className={styles.spinner} />
              <p className={styles.statusText} role="status" aria-live="polite">
                Starting camera...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className={styles.centerState}>
              <span className={styles.alertIcon}>
                <AlertIcon />
              </span>
              <h2 className={styles.heading}>Camera unavailable</h2>
              <p className={styles.subtitle} role="alert">
                {errorMessage}
              </p>
            </div>
          )}

          {status === "scanning" && (
            <div className={styles.centerState}>
              <div className={`${styles.ringSpin} ${faceAligned ? styles.ringSpinAligned : ""}`}>
                <div className={styles.videoStage}>
                  <video ref={videoRef} className={styles.video} muted playsInline />
                </div>
              </div>
              <p
                className={`${styles.statusText} ${faceAligned ? styles.statusTextAligned : ""}`}
                role="status"
                aria-live="polite"
              >
                {faceAligned ? "Hold still, scanning..." : "Position your face inside the circle"}
              </p>
              <p className={styles.hintText}>Ensure good lighting · Remove sunglasses or face coverings</p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.centerState}>
              <div className={styles.resultStage}>
                <img src={capturedImage} alt="Captured face scan" className={styles.resultImage} />
                <span className={styles.successBadge}>
                  <CheckIcon />
                </span>
              </div>
              <h2 className={styles.heading} role="status" aria-live="polite">
                Face captured successfully
              </h2>
              <p className={styles.subtitle}>Not happy with it? You can retake the photo.</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {status === "idle" && (
            <button type="button" className={styles.primaryButton} onClick={start}>
              Start Face Scan
            </button>
          )}
          {status === "error" && (
            <button type="button" className={styles.primaryButton} onClick={start}>
              Try Again
            </button>
          )}
          {status === "scanning" && (
            <button type="button" className={styles.secondaryButton} onClick={cancel}>
              Cancel
            </button>
          )}
          {status === "success" && (
            <button type="button" className={styles.secondaryButton} onClick={retake}>
              Retake
            </button>
          )}
        </div>

        <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
      </div>
    </div>
  );
}

export default FaceVerification;
