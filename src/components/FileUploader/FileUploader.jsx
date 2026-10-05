import { useEffect, useRef, useState } from "react";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import CameraIcon from "../icons/CameraIcon";
import useCameraCapture from "../DocumentScanCard/useCameraCapture";
import { getPdfFullPreviewUrl } from "../../utils/pdfThumbnail";
import { dataUrlToFile } from "../../utils/fileUtils";
import styles from "./FileUploader.module.css";
import { t, t1 } from "../../i18n";

import PreviewModal from "./PreviewModal";
import ImageCropModal from "./ImageCropModal";
import PdfPreviewModal from "./PdfPreviewModal";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "application/pdf",
]);

function isAllowedFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  const validExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const validMime =
    ALLOWED_MIME_TYPES.has(type) ||
    (type.startsWith("image/") && (type.includes("png") || type.includes("jpeg") || type.includes("jpg")));
  return validExt || validMime;
}

const FileUploader = ({
  title = t("Choose a file or drag & drop it here"),
  caption = "PNG, JPG/JPEG, PDF",
  accept = "image/*,application/pdf,.jpg,.jpeg,.png,.pdf",
  onFileSelected,
  onCameraClick,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
  autoOpen = false,
  requireRearCamera = true,
  preserveLayout = false,
  disableDropzoneClick = false,
  renderCustomUI,
}) => {
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const [isPdfPreviewing, setIsPdfPreviewing] = useState(false);
  const [pdfImageUrl, setPdfImageUrl] = useState(null);

  const [showCameraModal, setShowCameraModal] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          if (!isMounted) return;
          const videoInputs = devices.filter(d => d.kind === "videoinput");
          
          if (videoInputs.length === 0) {
            setHasCamera(false);
            return;
          }

          if (!requireRearCamera) {
            setHasCamera(true);
            return;
          }

          let hasExplicitRear = false;
          let allLabelsEmpty = true;

          for (const d of videoInputs) {
            const label = (d.label || "").toLowerCase();
            if (label) allLabelsEmpty = false;
            
            if (label.includes("environment") || label.includes("back") || label.includes("rear")) {
              hasExplicitRear = true;
              break;
            }
            if (typeof d.getCapabilities === "function") {
              const caps = d.getCapabilities();
              if (caps && caps.facingMode && caps.facingMode.includes("environment")) {
                hasExplicitRear = true;
                break;
              }
            }
          }

          if (hasExplicitRear) {
            setHasCamera(true);
          } else if (allLabelsEmpty && videoInputs.length > 1) {
            setHasCamera(true);
          } else if (!allLabelsEmpty) {
            setHasCamera(false);
          } else {
            setHasCamera(false);
          }
        })
        .catch(() => {
          if (isMounted) setHasCamera(true);
        });
    }
    return () => { isMounted = false; };
  }, [requireRearCamera]);

  const handleCameraCapturedImage = (dataUrl) => {
    setShowCameraModal(false);
    const file = dataUrlToFile(dataUrl);
    handleFile(file);
  };

  const {
    status: cameraStatus,
    errorMessage: cameraErrorMessage,
    videoRef: cameraVideoRef,
    canvasRef: cameraCanvasRef,
    start: startCamera,
    capture: captureCamera,
    cancel: cancelCamera,
  } = useCameraCapture({ onCapture: handleCameraCapturedImage });

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
    return () => {
      if (pendingPreviewUrl) {
        URL.revokeObjectURL(pendingPreviewUrl);
      }
    };
  }, [pendingPreviewUrl]);

  useEffect(() => {
    if (autoOpen && !disabled) {
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const busy = status === "uploading" || status === "processing";
  const isDisabled = disabled || busy;

  const dragCounter = useRef(0);

  const handleFile = (file) => {
    if (!file || busy) return;
    setValidationError("");

    if (!isAllowedFile(file)) {
      setValidationError(t("Invalid file format. Please upload a JPG, PNG, or PDF file."));
      return;
    }

    const isImg = file.type?.startsWith("image/") || /\.(jpe?g|png)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (isImg) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(url);
      setIsCropping(true);
    } else if (isPdf) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(url);
      setIsPdfPreviewing(true);
      getPdfFullPreviewUrl(file).then((imgUrl) => {
        setPdfImageUrl(imgUrl);
      }).catch(err => {
        console.error("Failed to load PDF preview:", err);
        setPdfImageUrl('error');
      });
    } else {
      setSelectedFile(file);
      setFileName(file.name);
      onFileSelected?.(file);
    }
  };

  const clearPending = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setIsCropping(false);
    setIsPdfPreviewing(false);
  };

  const handleConfirmFile = (file) => {
    setSelectedFile(file);
    setFileName(file.name);
    clearPending();
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
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (isDisabled) return;
    setValidationError("");
    if (onCameraClick) {
      onCameraClick();
      return;
    }
    if (navigator.mediaDevices?.getUserMedia) {
      setShowCameraModal(true);
      startCamera();
    } else {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      cameraInputRef.current?.click();
    }
  };

  const handleCloseCameraModal = () => {
    cancelCamera();
    setShowCameraModal(false);
  };

  const effectiveStatus = validationError ? "error" : status;
  const activeErrorMessage = validationError || errorMessage;

  function renderDropzoneContent() {
    if ((effectiveStatus === "uploading" || effectiveStatus === "processing") && !preserveLayout) {
      const isProcessing = effectiveStatus === "processing";
      return (
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          {localPreviewUrl ? (
            <img src={localPreviewUrl} alt={fileName || (isProcessing ? "Processing" : "Uploading")} className={styles.thumbnail} />
          ) : (
            <span className={styles.spinner} />
          )}
          
          <span className={styles.title}>
            {isProcessing ? t("Processing document") : t1("Uploading {0}...", fileName)}
          </span>
          {isProcessing && (
            <span className={styles.typingDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
          )}
          
          {!isProcessing && (
            <>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.caption}>{progress}%</span>
            </>
          )}
          
          <span className={styles.hint}>
            {isProcessing ? t("Please wait while we extract data.") : t("Please wait while we process your document.")}
          </span>
        </div>
      );
    }

    if (effectiveStatus === "success" && !preserveLayout) {
      return (
        <div className={styles.spinnerWrap} role="status" aria-live="polite">
          <span className={styles.successIcon}>
            <CheckIcon />
          </span>
          <span className={styles.title}>{fileName} uploaded</span>
        </div>
      );
    }

    if (effectiveStatus === "error" && !preserveLayout) {
      return (
        <div className={styles.spinnerWrap} role="alert">
          <span className={styles.errorIcon}>
            <AlertIcon />
          </span>
          <span className={styles.title}>{t("Upload failed")}</span>
          <span className={styles.caption}>{activeErrorMessage || t("Something went wrong.")}</span>
          <span className={styles.retryLabel}>{t("Tap to try again")}</span>
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
        <div className={styles.buttonGroup}>
          {hasCamera && (
            <button
              type="button"
              className={styles.cameraButton}
              onClick={(e) => {
                e.stopPropagation();
                handleCameraClick();
              }}
              disabled={isDisabled}
            >
              <CameraIcon width={18} height={18} />
              <span>{t("Take Photo")}</span>
            </button>
          )}
          <button
            type="button"
            className={styles.browseButton}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={isDisabled}
          >
            {busy ? t("Uploading...") : t("Choose File")}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        className={renderCustomUI ? "" : `${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""} ${
          busy ? styles.dropzoneUploading : ""
        } ${effectiveStatus === "error" ? styles.dropzoneError : ""} ${disableDropzoneClick ? styles.dropzoneNoClick : ""}`}
        onClick={renderCustomUI || disableDropzoneClick ? undefined : handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role={renderCustomUI ? undefined : "region"}
        aria-label={renderCustomUI ? undefined : t("File upload area")}
      >
        {/* eslint-disable-next-line react-hooks/refs */}
        {renderCustomUI ? renderCustomUI({ openFilePicker: handleClick, isUploading: busy, status: effectiveStatus, progress }) : renderDropzoneContent()}
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
        aria-label={t("Take Photo")}
      />

      {showCameraModal && (
        <PreviewModal
          title={t("Take Photo / Scan Document")}
          onCancel={handleCloseCameraModal}
          onConfirm={cameraStatus === "scanning" ? captureCamera : undefined}
          confirmLabel={cameraStatus === "scanning" ? t("Capture Photo") : null}
          footerExtra={<canvas ref={cameraCanvasRef} className={styles.hiddenInput} aria-hidden="true" />}
        >
          {cameraStatus === "loading" && (
            <div className={styles.spinnerWrap} role="status" aria-live="polite">
              <span className={styles.spinner} />
              <span className={styles.hint}>{t("Starting camera...")}</span>
            </div>
          )}

          {cameraStatus === "error" && (
            <div className={styles.spinnerWrap} role="alert">
              <span className={styles.errorIcon}>
                <AlertIcon />
              </span>
              <span className={styles.title}>{t("Camera unavailable")}</span>
              <span className={styles.caption}>{cameraErrorMessage || t("Could not access camera.")}</span>
              <button type="button" className={styles.cropConfirmBtn} onClick={startCamera}>
                {t("Try Again")}
              </button>
            </div>
          )}

          <div 
            className={styles.cropImageWrapper}
            style={{ display: (cameraStatus === "scanning" || cameraStatus === "idle") ? "block" : "none" }}
          >
            <video ref={cameraVideoRef} className={styles.cropImage} autoPlay playsInline muted />
          </div>
        </PreviewModal>
      )}

      {isCropping && pendingPreviewUrl && (
        <ImageCropModal
          pendingFile={pendingFile}
          pendingPreviewUrl={pendingPreviewUrl}
          onCancel={clearPending}
          onConfirm={handleConfirmFile}
        />
      )}

      {isPdfPreviewing && pendingFile && (
        <PdfPreviewModal
          pendingFile={pendingFile}
          pendingPreviewUrl={pendingPreviewUrl}
          pdfImageUrl={pdfImageUrl}
          onCancel={clearPending}
          onConfirm={handleConfirmFile}
        />
      )}
    </div>
  );
};

export default FileUploader;
