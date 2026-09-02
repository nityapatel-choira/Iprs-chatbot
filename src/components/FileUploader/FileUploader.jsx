import { useEffect, useRef, useState } from "react";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import styles from "./FileUploader.module.css";

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
  caption = "PNG, JPG/JPEG, PDF",
  accept = "image/*,application/pdf,.jpg,.jpeg,.png,.pdf",
  onFileSelected,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
  autoOpen = false,
}) => {
  const inputRef = useRef(null);
  const imgRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect] = useState({ x: 5, y: 5, width: 90, height: 90 });

  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);

  useEffect(() => {
    let url = null;
    if (selectedFile && (selectedFile.type?.startsWith("image/") || /\.(jpe?g|png)$/i.test(selectedFile.name))) {
      url = URL.createObjectURL(selectedFile);
      const activeUrl = url;
      Promise.resolve().then(() => setLocalPreviewUrl(activeUrl));
    } else {
      Promise.resolve().then(() => setLocalPreviewUrl(null));
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [selectedFile]);

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

    const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png)$/i.test(file.name);
    if (isImg) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(url);
      setIsCropping(true);
    } else {
      setSelectedFile(file);
      setFileName(file.name);
      onFileSelected?.(file);
    }
  };

  const handleCancelCrop = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setIsCropping(false);
  };

  const handleConfirmCrop = () => {
    if (!pendingFile || !pendingPreviewUrl || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    const cropX = (cropRect.x / 100) * naturalWidth;
    const cropY = (cropRect.y / 100) * naturalHeight;
    const cropW = (cropRect.width / 100) * naturalWidth;
    const cropH = (cropRect.height / 100) * naturalHeight;

    canvas.width = Math.max(1, Math.round(cropW));
    canvas.height = Math.max(1, Math.round(cropH));

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], pendingFile.name, {
            type: pendingFile.type || "image/jpeg",
            lastModified: Date.now(),
          });
          setSelectedFile(croppedFile);
          setFileName(croppedFile.name);
          onFileSelected?.(croppedFile);
        }
        handleCancelCrop();
      },
      pendingFile.type || "image/jpeg",
      0.92
    );
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
          {localPreviewUrl ? (
            <img src={localPreviewUrl} alt={fileName || "Uploading"} className={styles.thumbnail} />
          ) : (
            <span className={styles.spinner} />
          )}
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

      {isCropping && pendingPreviewUrl && (
        <div className={styles.cropModalOverlay} onClick={handleCancelCrop}>
          <div className={styles.cropModalHeader} onClick={(e) => e.stopPropagation()}>
            <span className={styles.cropModalTitle}>Crop & Adjust Document</span>
            <button
              type="button"
              className={styles.cropModalClose}
              onClick={handleCancelCrop}
              aria-label="Cancel crop"
            >
              ✕
            </button>
          </div>

          <div className={styles.cropStage} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cropImageWrapper}>
              <img
                ref={imgRef}
                src={pendingPreviewUrl}
                alt="Document preview"
                className={styles.cropImage}
              />
              <div
                className={styles.cropSelectionBox}
                style={{
                  left: `${cropRect.x}%`,
                  top: `${cropRect.y}%`,
                  width: `${cropRect.width}%`,
                  height: `${cropRect.height}%`,
                }}
              >
                <span className={`${styles.cropHandle} ${styles.handleNw}`} />
                <span className={`${styles.cropHandle} ${styles.handleNe}`} />
                <span className={`${styles.cropHandle} ${styles.handleSw}`} />
                <span className={`${styles.cropHandle} ${styles.handleSe}`} />
              </div>
            </div>
          </div>

          <div className={styles.cropFooter} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.cropCancelBtn} onClick={handleCancelCrop}>
              Cancel
            </button>
            <button type="button" className={styles.cropConfirmBtn} onClick={handleConfirmCrop}>
              Use Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
