import { useEffect, useRef, useState } from "react";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import styles from "./FileUploader.module.css";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function isAllowedFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const validExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const validMime = ALLOWED_MIME_TYPES.includes(type);
  return validExt || validMime;
}

const FileUploader = ({
  title = "Choose a file or drag & drop it here",
  caption = "JPEG and PDF formats, up to 2MB",
  accept = ".jpg,.jpeg,.png,.pdf",
  onFileSelected,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
  // Auto-opens file picker on mount when true.
  autoOpen = false,
}) => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (autoOpen && !disabled) {
      inputRef.current?.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = status === "uploading";
  const isDisabled = disabled || busy;

  const dragCounter = useRef(0);

  const handleFile = (file) => {
    if (!file || busy) return;
    setValidationError("");

    if (!isAllowedFile(file)) {
      setValidationError("Invalid file format. Please upload a JPG, PNG, or PDF file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("File size exceeds 2MB limit. Please upload a smaller file.");
      return;
    }

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
    setValidationError("");
    inputRef.current?.click();
  };

  const effectiveStatus = validationError ? "error" : status;
  const activeErrorMessage = validationError || errorMessage;

  function renderDropzoneContent() {
    if (effectiveStatus === "uploading") {
      return (
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          <span className={styles.spinner} />
          <span className={styles.title}>Uploading {fileName}...</span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.caption}>{progress}%</span>
          <span className={styles.hint}>Please wait while we process your document.</span>
        </div>
      );
    }

    if (effectiveStatus === "success") {
      return (
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          <span className={styles.successIcon}>
            <CheckIcon />
          </span>
          <span className={styles.title}>{fileName} uploaded</span>
        </div>
      );
    }

    if (effectiveStatus === "error") {
      return (
        <div className={styles.spinnerWrap} role="alert">
          <span className={styles.errorIcon}>
            <AlertIcon />
          </span>
          <span className={styles.title}>Upload failed</span>
          <span className={styles.caption}>{activeErrorMessage || "Something went wrong."}</span>
          <span className={styles.retryLabel}>Tap to try again</span>
        </div>
      );
    }

    return (
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
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""} ${
          busy ? styles.dropzoneUploading : ""
        } ${effectiveStatus === "error" ? styles.dropzoneError : ""}`}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        {renderDropzoneContent()}
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
};

export default FileUploader;
