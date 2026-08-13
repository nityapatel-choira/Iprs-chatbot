import { useRef, useState } from "react";
import UploadIcon from "../icons/UploadIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import styles from "./FileUploader.module.css";

function FileUploader({
  title,
  caption,
  onFileSelected,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
}) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);

  const busy = status === "uploading";

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    onFileSelected?.(file);
  };

  const handleClick = () => {
    if (busy || disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.dropzone} ${busy ? styles.dropzoneUploading : ""} ${
          status === "error" ? styles.dropzoneError : ""
        }`}
        onClick={handleClick}
        disabled={disabled || busy}
      >
        {status === "uploading" ? (
          <div className={styles.spinnerWrap}>
            <span className={styles.spinner} />
            <span className={styles.title}>Uploading {fileName}...</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.caption}>{progress}%</span>
          </div>
        ) : status === "success" ? (
          <div className={styles.spinnerWrap}>
            <span className={styles.successIcon}>
              <CheckIcon />
            </span>
            <span className={styles.title}>{fileName} uploaded</span>
          </div>
        ) : status === "error" ? (
          <div className={styles.spinnerWrap}>
            <span className={styles.errorIcon}>
              <AlertIcon />
            </span>
            <span className={styles.title}>Upload failed</span>
            <span className={styles.caption}>{errorMessage || "Please try again."}</span>
          </div>
        ) : (
          <>
            <UploadIcon />
            <span className={styles.title}>{title}</span>
            <span className={styles.caption}>{caption}</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className={styles.hiddenInput}
        onChange={handleChange}
        aria-label={title}
      />
    </div>
  );
}

export default FileUploader;
