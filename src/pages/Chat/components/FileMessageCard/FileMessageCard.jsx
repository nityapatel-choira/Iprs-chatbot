import { useEffect, useState } from "react";
import FileDocIcon from "../../../../components/icons/FileDocIcon";
import getPdfThumbnailUrl, { getPdfFullPreviewUrl } from "../../../../utils/pdfThumbnail";
import styles from "./FileMessageCard.module.css";
import { t } from "../../../../i18n";

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp)$/i;
const PDF_EXTENSION_PATTERN = /\.pdf$/i;

function isImageFile(fileName, mimeType, rawFile) {
  if (mimeType && typeof mimeType === "string" && mimeType.startsWith("image/")) {
    return true;
  }
  if (rawFile && typeof rawFile.type === "string" && rawFile.type.startsWith("image/")) {
    return true;
  }
  if (fileName && IMAGE_EXTENSION_PATTERN.test(fileName)) {
    return true;
  }
  return false;
}

function isPdfFile(fileName, mimeType, rawFile) {
  if (mimeType === "application/pdf") return true;
  if (rawFile && typeof rawFile.type === "string" && rawFile.type === "application/pdf") return true;
  if (fileName && PDF_EXTENSION_PATTERN.test(fileName)) return true;
  return false;
}

function splitFileName(name) {
  if (!name) return { base: "", ext: "" };
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === name.length - 1) return { base: name, ext: "" };
  return { base: name.slice(0, dotIndex), ext: name.slice(dotIndex) };
}

function formatFileSize(size) {
  if (!size) return "1.2 MB";
  if (typeof size === "string") return size;
  if (typeof size === "number") {
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return String(size);
}

const FileMessageCard = ({ fileName, fileSize, previewUrl: initialPreviewUrl, mimeType, rawFile, status }) => {
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const [createdUrl, setCreatedUrl] = useState(null);
  const [pdfImageUrl, setPdfImageUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileObject = rawFile instanceof File || rawFile instanceof Blob ? rawFile : null;
  const isImage = isImageFile(fileName, mimeType, fileObject);
  const isPdf = isPdfFile(fileName, mimeType, fileObject);

  useEffect(() => {
    let url = null;
    if (!initialPreviewUrl && fileObject && (isImage || isPdf)) {
      url = URL.createObjectURL(fileObject);
      const activeUrl = url;
      Promise.resolve().then(() => setCreatedUrl(activeUrl));
    } else {
      Promise.resolve().then(() => setCreatedUrl(null));
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [initialPreviewUrl, fileObject, isImage, isPdf]);

  useEffect(() => {
    let isCancelled = false;
    if (isPdf && fileObject) {
      getPdfFullPreviewUrl(fileObject).then((imgUrl) => {
        if (!isCancelled) setPdfImageUrl(imgUrl);
      }).catch(err => {
        console.error("Failed to load PDF preview:", err);
        if (!isCancelled) setPdfImageUrl('error');
      });
    } else if (isPdf && initialPreviewUrl) {
      getPdfFullPreviewUrl(initialPreviewUrl).then((imgUrl) => {
        if (!isCancelled) setPdfImageUrl(imgUrl);
      }).catch(err => {
        console.error("Failed to load PDF preview:", err);
        if (!isCancelled) setPdfImageUrl('error');
      });
    }
    return () => {
      isCancelled = true;
    };
  }, [fileObject, isPdf, initialPreviewUrl]);

  useEffect(() => {
    let isCancelled = false;

    if (isPdf) {
      const target = fileObject || (initialPreviewUrl && initialPreviewUrl !== "#" ? initialPreviewUrl : null);
      if (target) {
        getPdfThumbnailUrl(target).then((url) => {
          if (!isCancelled && url) {
            setPdfThumbnail(url);
          }
        });
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [isPdf, fileObject, initialPreviewUrl]);



  const isUploading = status === "uploading";
  const isProcessing = status === "processing";
  const isBusy = isUploading || isProcessing;
  const isError = status === "error";
  const activePreviewUrl = initialPreviewUrl || createdUrl;

  let activeThumbnailUrl = null;
  if (isImage) {
    activeThumbnailUrl = activePreviewUrl;
  } else if (isPdf) {
    activeThumbnailUrl = pdfThumbnail;
  }
  const showThumbnail = Boolean(activeThumbnailUrl);

  const formattedSize = formatFileSize(fileSize);
  const { base: fileNameBase, ext: fileNameExt } = splitFileName(fileName);

  let fileDetailContent = <>{formattedSize} · View Document ↗</>;
  if (isBusy) {
    fileDetailContent = (
      <>
        {t("Uploading")}
        <span className={styles.typingDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      </>
    );
  } else if (isError) {
    fileDetailContent = <>{formattedSize} · Upload Failed ⚠️</>;
  }

  const linkHref = isBusy ? undefined : activePreviewUrl || "#";
  const linkTarget = isBusy ? undefined : activePreviewUrl ? "_blank" : undefined;
  const linkTitle = isBusy ? t("Uploading...") : activePreviewUrl ? t("Click to view uploaded document") : undefined;
  const linkStyle = isBusy ? { pointerEvents: "none", cursor: "default" } : undefined;

  const handleCardClick = (e) => {
    if (isBusy) return;
    e.preventDefault();
    setIsPreviewOpen(true);
  };

  const renderPreview = () => {
    if (isBusy) {
      return (
        <div className={styles.spinnerWrap}>
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      );
    }
    if (showThumbnail) {
      return (
        <img
          src={activeThumbnailUrl}
          alt={fileName || t("Document preview")}
          className={styles.thumbnail}
          style={isError ? { borderColor: "#fecaca" } : undefined}
        />
      );
    }
    return (
      <div className={styles.fileIconBox}>
        <FileDocIcon />
      </div>
    );
  };

  return (
    <>
      <a
        href={linkHref}
        target={linkTarget}
        rel="noreferrer"
        className={`${styles.fileBubbleUser} ${isError ? styles.fileBubbleError : ""}`}
        title={linkTitle}
        style={linkStyle}
        onClick={handleCardClick}
      >
        {renderPreview()}
        <div className={styles.fileMetaBox}>
          <span className={styles.fileNameText}>
            <span className={styles.fileNameBase}>{fileNameBase}</span>
            {fileNameExt && <span className={styles.fileNameExt}>{fileNameExt}</span>}
          </span>
          <span className={styles.fileDetailText}>{fileDetailContent}</span>
        </div>
      </a>

      {isPreviewOpen && (
        <div className={styles.previewModalOverlay} onClick={() => setIsPreviewOpen(false)}>
          <div className={styles.previewModalHeader} onClick={(e) => e.stopPropagation()}>
            <span className={styles.previewModalTitle}>{fileName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {!isImage && activePreviewUrl && (
                <a
                  href={activePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}
                >
                  {t("Open ↗")}
                </a>
              )}
              <button
                type="button"
                className={styles.previewModalClose}
                onClick={() => setIsPreviewOpen(false)}
                aria-label={t("Close preview")}
              >
                ✕
              </button>
            </div>
          </div>
          <div className={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
            {isImage ? (
              <img
                src={activePreviewUrl}
                alt={fileName || t("Document Preview")}
                className={styles.previewModalImage}
              />
            ) : (
            <>
              <object
                data={activePreviewUrl}
                type="application/pdf"
                className={styles.pdfObject}
              >
                <iframe
                  src={activePreviewUrl}
                  title={t("PDF preview")}
                  className={styles.pdfObject}
                >
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
                    {t("Preview unavailable")}
                  </div>
                </iframe>
              </object>
              
              <div className={styles.mobilePdfFallback}>
                {pdfImageUrl === 'error' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span className={styles.errorIcon} style={{ fontSize: '2rem' }}>⚠️</span>
                    <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '600' }}>{t("Preview unavailable")}</span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem', textAlign: 'center' }}>{t("The PDF could not be rendered.")}</span>
                  </div>
                ) : pdfImageUrl ? (
                  <img src={pdfImageUrl} alt={t("PDF Preview")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span className={styles.spinner} />
                    <span style={{ color: '#fff', fontSize: '0.875rem' }}>{t("Loading PDF preview...")}</span>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FileMessageCard;

