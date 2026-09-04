import { useEffect, useRef, useState } from "react";
import UploadCloudIcon from "../icons/UploadCloudIcon";
import CheckIcon from "../icons/CheckIcon";
import AlertIcon from "../icons/AlertIcon";
import CameraIcon from "../icons/CameraIcon";
import useCameraCapture from "../DocumentScanCard/useCameraCapture";
import { getPdfFullPreviewUrl } from "../../utils/pdfThumbnail";
import styles from "./FileUploader.module.css";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/x-png",
  "application/pdf",
]);

function dataUrlToFile(dataUrl, filename = "captured-photo.jpg") {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

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
  title = "Choose a file or drag & drop it here",
  caption = "PNG, JPG/JPEG, PDF",
  accept = "image/*,application/pdf,.jpg,.jpeg,.png,.pdf",
  onFileSelected,
  onCameraClick,
  status = "idle",
  progress = 0,
  errorMessage,
  disabled,
  autoOpen = false,
}) => {
  const inputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const imgRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 5, y: 5, width: 90, height: 90 });

  const [isPdfPreviewing, setIsPdfPreviewing] = useState(false);
  const [pdfPreviewRenderUrl, setPdfPreviewRenderUrl] = useState(null);

  const [showCameraModal, setShowCameraModal] = useState(false);

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

  const isDraggingHandle = useRef(false);
  const dragHandleType = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0, rect: { x: 5, y: 5, width: 90, height: 90 } });

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
    let isCancelled = false;
    if (isPdfPreviewing && pendingFile) {
      getPdfFullPreviewUrl(pendingFile, 1.8).then((url) => {
        if (!isCancelled && url) {
          setPdfPreviewRenderUrl(url);
        }
      });
    } else {
      Promise.resolve().then(() => setPdfPreviewRenderUrl(null));
    }
    return () => {
      isCancelled = true;
    };
  }, [isPdfPreviewing, pendingFile]);

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
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    if (isImg) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(url);
      setCropRect({ x: 5, y: 5, width: 90, height: 90 });
      setIsCropping(true);
    } else if (isPdf) {
      const url = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingPreviewUrl(url);
      setIsPdfPreviewing(true);
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

  const handleCancelPdfPreview = () => {
    if (pendingPreviewUrl) {
      URL.revokeObjectURL(pendingPreviewUrl);
    }
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setIsPdfPreviewing(false);
  };

  const handleConfirmPdfUpload = () => {
    if (!pendingFile) return;
    const activeFile = pendingFile;
    setSelectedFile(activeFile);
    setFileName(activeFile.name);
    handleCancelPdfPreview();
    onFileSelected?.(activeFile);
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

    const fileMime =
      pendingFile.type && pendingFile.type.startsWith("image/") ? pendingFile.type : "image/jpeg";

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], pendingFile.name, {
            type: fileMime,
            lastModified: Date.now(),
          });
          setSelectedFile(croppedFile);
          setFileName(croppedFile.name);
          onFileSelected?.(croppedFile);
        }
        handleCancelCrop();
      },
      fileMime,
      0.92
    );
  };

  const handlePointerDown = (handleType, e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingHandle.current = true;
    dragHandleType.current = handleType;
    dragStartCoords.current = {
      x: e.clientX,
      y: e.clientY,
      rect: { ...cropRect },
    };

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore fallback
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingHandle.current || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const imgWidth = imgRef.current.clientWidth;
    const imgHeight = imgRef.current.clientHeight;
    if (!imgWidth || !imgHeight) return;

    const deltaX = ((e.clientX - dragStartCoords.current.x) / imgWidth) * 100;
    const deltaY = ((e.clientY - dragStartCoords.current.y) / imgHeight) * 100;
    const initialRect = dragStartCoords.current.rect;
    const handleType = dragHandleType.current;

    let { x, y, width, height } = initialRect;

    if (handleType === "nw") {
      const newX = Math.max(0, Math.min(initialRect.x + initialRect.width - 10, initialRect.x + deltaX));
      const newY = Math.max(0, Math.min(initialRect.y + initialRect.height - 10, initialRect.y + deltaY));
      width = initialRect.width - (newX - initialRect.x);
      height = initialRect.height - (newY - initialRect.y);
      x = newX;
      y = newY;
    } else if (handleType === "ne") {
      const newY = Math.max(0, Math.min(initialRect.y + initialRect.height - 10, initialRect.y + deltaY));
      width = Math.max(10, Math.min(100 - initialRect.x, initialRect.width + deltaX));
      height = initialRect.height - (newY - initialRect.y);
      y = newY;
    } else if (handleType === "sw") {
      const newX = Math.max(0, Math.min(initialRect.x + initialRect.width - 10, initialRect.x + deltaX));
      height = Math.max(10, Math.min(100 - initialRect.y, initialRect.height + deltaY));
      width = initialRect.width - (newX - initialRect.x);
      x = newX;
    } else if (handleType === "se") {
      width = Math.max(10, Math.min(100 - initialRect.x, initialRect.width + deltaX));
      height = Math.max(10, Math.min(100 - initialRect.y, initialRect.height + deltaY));
    }

    setCropRect({
      x: Math.max(0, Math.min(90, x)),
      y: Math.max(0, Math.min(90, y)),
      width: Math.max(10, Math.min(100 - x, width)),
      height: Math.max(10, Math.min(100 - y, height)),
    });
  };

  const handlePointerUp = (e) => {
    if (isDraggingHandle.current) {
      isDraggingHandle.current = false;
      dragHandleType.current = null;
      if (e.currentTarget.releasePointerCapture && e.pointerId !== undefined) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore fallback
        }
      }
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
    if (onCameraClick) {
      onCameraClick();
      return;
    }
    if (navigator.mediaDevices?.getUserMedia) {
      setShowCameraModal(true);
      startCamera();
    } else {
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
        <div className={styles.buttonGroup}>
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
            <span>Take Photo</span>
          </button>
          <button
            type="button"
            className={styles.browseButton}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={isDisabled}
          >
            Choose File
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
        aria-label="Take Photo"
      />

      {showCameraModal && (
        <div className={styles.cropModalOverlay} onClick={handleCloseCameraModal}>
          <div className={styles.cropModalHeader} onClick={(e) => e.stopPropagation()}>
            <span className={styles.cropModalTitle}>Take Photo / Scan Document</span>
            <button
              type="button"
              className={styles.cropModalClose}
              onClick={handleCloseCameraModal}
              aria-label="Close camera"
            >
              ✕
            </button>
          </div>

          <div className={styles.cropStage} onClick={(e) => e.stopPropagation()}>
            {cameraStatus === "loading" && (
              <div className={styles.spinnerWrap} role="status" aria-live="polite">
                <span className={styles.spinner} />
                <span className={styles.hint}>Starting camera...</span>
              </div>
            )}

            {cameraStatus === "error" && (
              <div className={styles.spinnerWrap} role="alert">
                <span className={styles.errorIcon}>
                  <AlertIcon />
                </span>
                <span className={styles.title}>Camera unavailable</span>
                <span className={styles.caption}>{cameraErrorMessage || "Could not access camera."}</span>
                <button type="button" className={styles.cropConfirmBtn} onClick={startCamera}>
                  Try Again
                </button>
              </div>
            )}

            {(cameraStatus === "scanning" || cameraStatus === "idle") && (
              <div className={styles.cropImageWrapper}>
                <video ref={cameraVideoRef} className={styles.cropImage} autoPlay playsInline muted />
              </div>
            )}
          </div>

          <div className={styles.cropFooter} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.cropCancelBtn} onClick={handleCloseCameraModal}>
              Cancel
            </button>
            {cameraStatus === "scanning" && (
              <button type="button" className={styles.cropConfirmBtn} onClick={captureCamera}>
                Capture Photo
              </button>
            )}
          </div>
          <canvas ref={cameraCanvasRef} className={styles.hiddenInput} aria-hidden="true" />
        </div>
      )}

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
                <span
                  className={`${styles.cropHandle} ${styles.handleNw}`}
                  onPointerDown={(e) => handlePointerDown("nw", e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
                <span
                  className={`${styles.cropHandle} ${styles.handleNe}`}
                  onPointerDown={(e) => handlePointerDown("ne", e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
                <span
                  className={`${styles.cropHandle} ${styles.handleSw}`}
                  onPointerDown={(e) => handlePointerDown("sw", e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
                <span
                  className={`${styles.cropHandle} ${styles.handleSe}`}
                  onPointerDown={(e) => handlePointerDown("se", e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                />
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

      {isPdfPreviewing && pendingFile && (
        <div className={styles.cropModalOverlay} onClick={handleCancelPdfPreview}>
          <div className={styles.cropModalHeader} onClick={(e) => e.stopPropagation()}>
            <span className={styles.cropModalTitle}>Preview PDF Document</span>
            <button
              type="button"
              className={styles.cropModalClose}
              onClick={handleCancelPdfPreview}
              aria-label="Cancel preview"
            >
              ✕
            </button>
          </div>

          <div className={styles.cropStage} onClick={(e) => e.stopPropagation()}>
            <div className={styles.cropImageWrapper}>
              {pdfPreviewRenderUrl ? (
                <img
                  src={pdfPreviewRenderUrl}
                  alt={pendingFile.name || "PDF preview"}
                  className={styles.cropImage}
                />
              ) : (
                <div className={styles.spinnerWrap} role="status" aria-live="polite">
                  <span className={styles.spinner} />
                  <span className={styles.hint}>Loading PDF preview...</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.cropFooter} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.cropCancelBtn} onClick={handleCancelPdfPreview}>
              Cancel
            </button>
            <button type="button" className={styles.cropConfirmBtn} onClick={handleConfirmPdfUpload}>
              Use Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
