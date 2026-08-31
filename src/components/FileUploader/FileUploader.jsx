import { useEffect, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CameraIcon from "../icons/CameraIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import BottomSheet from "../BottomSheet/BottomSheet";
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

function isPdfFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

async function getCroppedImg(imageElement, crop, originalFile) {
  if (!imageElement || !crop || !crop.width || !crop.height) {
    return originalFile;
  }

  const canvas = document.createElement("canvas");
  const scaleX = imageElement.naturalWidth / imageElement.width;
  const scaleY = imageElement.naturalHeight / imageElement.height;

  const pixelCropX = crop.x * scaleX;
  const pixelCropY = crop.y * scaleY;
  const pixelCropWidth = crop.width * scaleX;
  const pixelCropHeight = crop.height * scaleY;

  canvas.width = Math.floor(pixelCropWidth);
  canvas.height = Math.floor(pixelCropHeight);

  const ctx = canvas.getContext("2d");
  if (!ctx) return originalFile;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    imageElement,
    pixelCropX,
    pixelCropY,
    pixelCropWidth,
    pixelCropHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve) => {
    const mimeType = originalFile.type || "image/jpeg";
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(originalFile);
          return;
        }
        const croppedFile = new File([blob], originalFile.name || "document.jpg", {
          type: mimeType,
          lastModified: Date.now(),
        });
        resolve(croppedFile);
      },
      mimeType,
      0.92
    );
  });
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
  const cameraInputRef = useRef(null);
  const imgRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [cropState, setCropState] = useState({ file: null, url: null });
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);

  useEffect(() => {
    if (autoOpen && !disabled) {
      inputRef.current?.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (cropState.url) {
        URL.revokeObjectURL(cropState.url);
      }
    };
  }, [cropState.url]);

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

    if (isPdfFile(file)) {
      if (file.size > MAX_FILE_SIZE) {
        setValidationError("File size exceeds 2MB limit. Please upload a smaller file.");
        return;
      }
      setFileName(file.name);
      onFileSelected?.(file);
      return;
    }

    if (cropState.url) {
      URL.revokeObjectURL(cropState.url);
    }
    const url = URL.createObjectURL(file);
    setCropState({ file, url });
    setCrop(null);
    setCompletedCrop(null);
  };

  const handleImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const fullCrop = {
      unit: "%",
      x: 2,
      y: 2,
      width: 96,
      height: 96,
    };
    setCrop(fullCrop);
    setCompletedCrop({
      unit: "px",
      x: 0,
      y: 0,
      width: e.currentTarget.width,
      height: e.currentTarget.height,
    });
  };

  const handleCancelCrop = () => {
    if (cropState.url) {
      URL.revokeObjectURL(cropState.url);
    }
    setCropState({ file: null, url: null });
    setCrop(null);
    setCompletedCrop(null);
  };

  const handleConfirmCrop = async () => {
    if (!cropState.file || !cropState.url) return;

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, cropState.file);
      if (!croppedFile) {
        setValidationError("Failed to process cropped image. Please try again.");
        handleCancelCrop();
        return;
      }

      if (croppedFile.size > MAX_FILE_SIZE) {
        setValidationError("Cropped file size exceeds 2MB limit. Please adjust crop area.");
        handleCancelCrop();
        return;
      }

      const activeFile = croppedFile;
      setFileName(activeFile.name);
      handleCancelCrop();
      onFileSelected?.(activeFile);
    } catch {
      setValidationError("Failed to crop document. Please try again.");
      handleCancelCrop();
    }
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

  const handleCameraClick = () => {
    if (isDisabled) return;
    setValidationError("");
    cameraInputRef.current?.click();
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
        <div className={styles.actionRow} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.browseButton}
            onClick={handleClick}
            disabled={isDisabled}
          >
            Browse File
          </button>
          <button
            type="button"
            className={`${styles.browseButton} ${styles.cameraButton}`}
            onClick={handleCameraClick}
            disabled={isDisabled}
          >
            <CameraIcon width={16} height={16} />
            Take Photo
          </button>
        </div>
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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className={styles.hiddenInput}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label="Take Photo with camera"
      />

      {cropState.url && (
        <BottomSheet open title="Crop & Adjust Document" onClose={handleCancelCrop}>
          <div className={styles.cropperStage}>
            <ReactCrop
              crop={crop}
              onChange={(crop, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
            >
              <img
                src={cropState.url}
                alt="Document Preview"
                onLoad={handleImageLoad}
                className={styles.cropImage}
              />
            </ReactCrop>
          </div>
          <div className={styles.cropActions}>
            <button
              type="button"
              className={styles.cropCancelBtn}
              onClick={handleCancelCrop}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.cropConfirmBtn}
              onClick={handleConfirmCrop}
            >
              Use Document
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default FileUploader;
