import { useEffect, useMemo, useState } from "react";
import FileDocIcon from "../../../../components/icons/FileDocIcon";
import { getPdfThumbnailUrl } from "../../../../utils/pdfThumbnail";
import styles from "./FileMessageCard.module.css";

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

// Keeps the extension past ellipsis-truncation - it's what identifies the file type.
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

function FileMessageCard({ fileName, fileSize, previewUrl: initialPreviewUrl, mimeType, rawFile, status }) {
  const [pdfThumbnail, setPdfThumbnail] = useState(null);

  const fileObject = rawFile instanceof File || rawFile instanceof Blob ? rawFile : null;
  const isImage = isImageFile(fileName, mimeType, fileObject);
  const isPdf = isPdfFile(fileName, mimeType, fileObject);

  const createdUrl = useMemo(() => {
    if (!initialPreviewUrl && fileObject && isImage) {
      return URL.createObjectURL(fileObject);
    }
    return null;
  }, [initialPreviewUrl, fileObject, isImage]);

  useEffect(() => {
    return () => {
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [createdUrl]);

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

  let fileDetailText = `${formattedSize} · View Document ↗`;
  if (isUploading) {
    fileDetailText = "Uploading...";
  } else if (isError) {
    fileDetailText = `${formattedSize} · Verification Failed ⚠️`;
  }

  const linkHref = isUploading ? undefined : activePreviewUrl || "#";
  const linkTarget = isUploading ? undefined : activePreviewUrl ? "_blank" : undefined;
  const linkTitle = isUploading ? "Uploading..." : activePreviewUrl ? "Click to view uploaded document" : undefined;
  const linkStyle = isUploading ? { pointerEvents: "none", cursor: "default" } : undefined;

  const renderPreview = () => {
    if (isUploading) {
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
          alt={fileName || "Document preview"}
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
    <a
      href={linkHref}
      target={linkTarget}
      rel="noreferrer"
      className={`${styles.fileBubbleUser} ${isError ? styles.fileBubbleError : ""}`}
      title={linkTitle}
      style={linkStyle}
    >
      {renderPreview()}
      <div className={styles.fileMetaBox}>
        <span className={styles.fileNameText}>
          <span className={styles.fileNameBase}>{fileNameBase}</span>
          {fileNameExt && <span className={styles.fileNameExt}>{fileNameExt}</span>}
        </span>
        <span className={styles.fileDetailText}>{fileDetailText}</span>
      </div>
    </a>
  );
}

export default FileMessageCard;

