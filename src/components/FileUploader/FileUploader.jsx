import { useEffect, useRef, useState } from "react";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import styles from "./FileUploader.module.css";

function FileUploader({
  title = "Choose a file or drag & drop it here",
  caption = "JPEG and PDF formats, up to 2MB",
  accept = ".jpg,.jpeg,.png,.pdf",
  onFileSelected,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
  // Opt-in only (defaults false, so every other existing caller - PAN, bank
  // proof, address proof, etc. - is unaffected): opens the native file
  // picker itself the moment this instance mounts, skipping the extra
  // "tap the dropzone/Browse File" step. The dropzone still renders
  // underneath as the fallback if the user cancels that native dialog.
  autoOpen = false,
}) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (autoOpen && !disabled) {
      inputRef.current?.click();
    }
    // Intentionally mount-only: this is "open the picker for me" once when
    // this instance first appears, not "reopen every time props change."
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = status === "uploading";
  const isDisabled = disabled || busy;

  const dragCounter = useRef(0);

  const handleFile = (file) => {
    if (!file || busy) return;
    setFileName(file.name);
    onFileSelected?.(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    handleFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (!isDisabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (isDisabled) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleClick = () => {
    if (isDisabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""} ${
          busy ? styles.dropzoneUploading : ""
        } ${status === "error" ? styles.dropzoneError : ""}`}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        {status === "uploading" ? (
          <div className={styles.spinnerWrap} role="status" aria-live="polite">
            <span className={styles.spinner} />
            <span className={styles.title}>Uploading {fileName}...</span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.caption}>{progress}%</span>
            <span className={styles.hint}>Please wait while we process your document.</span>
          </div>
        ) : status === "success" ? (
          <div className={styles.spinnerWrap} role="status" aria-live="polite">
            <span className={styles.successIcon}>
              <CheckIcon />
            </span>
            <span className={styles.title}>{fileName} uploaded</span>
          </div>
        ) : status === "error" ? (
          <div className={styles.spinnerWrap} role="alert">
            <span className={styles.errorIcon}>
              <AlertIcon />
            </span>
            <span className={styles.title}>Upload failed</span>
            <span className={styles.caption}>{errorMessage || "Something went wrong."}</span>
            <span className={styles.retryLabel}>Tap to try again</span>
          </div>
        ) : (
          <>
            <div className={styles.iconBox}>
              <UploadCloudIcon />
            </div>
            <span className={styles.title}>{title}</span>
            <span className={styles.caption}>{caption}</span>
            <button
              type="button"
              className={styles.browseButton}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={isDisabled}
            >
              Browse File
            </button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label={title}
      />
    </div>
  );
}

export default FileUploader;
