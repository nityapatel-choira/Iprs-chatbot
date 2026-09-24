import CameraIcon from "../icons/CameraIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import useCameraCapture from "./useCameraCapture";
import styles from "./DocumentScanCard.module.css";
import { t } from "../../i18n";

const DocumentScanCard = ({
  title = t("Position your document within the frame"),
  caption = t("Make sure the card is well-lit and all details are visible"),
  onCapture,
  disabled,
}) => {
  const { status, errorMessage, capturedImage, videoRef, canvasRef, start, capture, retake, cancel } =
    useCameraCapture({ onCapture });

  return (
    <div className={styles.wrap}>
      {status === "idle" && (
        <button type="button" className={styles.dropzone} onClick={start} disabled={disabled}>
          <span className={styles.iconBox}>
            <CameraIcon />
          </span>
          <span className={styles.title}>{title}</span>
          <span className={styles.caption}>{caption}</span>
        </button>
      )}

      {(status === "loading" || status === "scanning") && (
        <div className={styles.panel}>
          {status === "loading" && (
            <>
              <span className={styles.spinner} />
              <span className={styles.title}>{t("Starting camera...")}</span>
            </>
          )}

          <div 
            className={styles.frameStage}
            style={{ display: status === "scanning" ? "" : "none" }}
          >
            <video ref={videoRef} className={styles.video} muted playsInline />
            <span className={styles.frameGuide} aria-hidden="true" />
          </div>
          
          {status === "scanning" && (
            <>
              <span className={styles.caption}>{title}</span>
              <button type="button" className={styles.actionButton} onClick={capture}>
                Capture
              </button>
              <button type="button" className={styles.linkButton} onClick={cancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <div className={styles.panel}>
          <span className={styles.errorIcon}>
            <AlertIcon />
          </span>
          <span className={styles.title}>{t("Camera unavailable")}</span>
          <span className={styles.caption} role="alert">
            {errorMessage}
          </span>
          <button type="button" className={styles.actionButton} onClick={start}>
            Try Again
          </button>
        </div>
      )}

      {status === "success" && (
        <div className={styles.panel}>
          <div className={styles.resultStage}>
            <img src={capturedImage} alt={t("Captured document")} className={styles.resultImage} />
            <span className={styles.successIcon}>
              <CheckIcon />
            </span>
          </div>
          <span className={styles.title}>{t("Document captured")}</span>
          <button type="button" className={styles.linkButton} onClick={retake}>
            Retake
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className={styles.hiddenCanvas} aria-hidden="true" />
    </div>
  );
};

export default DocumentScanCard;
