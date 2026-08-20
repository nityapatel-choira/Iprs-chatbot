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

// Splits off the extension so it can be kept visible while only the base
// name gets ellipsis-truncated (see .fileNameBase/.fileNameExt in the CSS
// module) - a plain single-span ellipsis would just as likely clip the
// extension itself on a long filename, which is the one part that tells
// the user what kind of file this is.
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
  const activeThumbnailUrl = isImage ? activePreviewUrl : (isPdf ? pdfThumbnail : null);
  const showThumbnail = Boolean(activeThumbnailUrl);
  const formattedSize = formatFileSize(fileSize);
  const { base: fileNameBase, ext: fileNameExt } = splitFileName(fileName);

  return (
    <a
      href={isUploading ? undefined : (activePreviewUrl || "#")}
      target={isUploading ? undefined : (activePreviewUrl ? "_blank" : undefined)}
      rel="noreferrer"
      className={`${styles.fileBubbleUser} ${isError ? styles.fileBubbleError : ""}`}
      title={isUploading ? "Uploading..." : (activePreviewUrl ? "Click to view uploaded document" : undefined)}
      style={isUploading ? { pointerEvents: "none", cursor: "default" } : undefined}
    >
      {isUploading ? (
        <div className={styles.spinnerWrap}>
          <span className={styles.spinner} aria-hidden="true" />
        </div>
      ) : showThumbnail ? (
        <img
          src={activeThumbnailUrl}
          alt={fileName || "Document preview"}
          className={styles.thumbnail}
          style={isError ? { borderColor: "#fecaca" } : undefined}
        />
      ) : (
        <div className={styles.fileIconBox}>
          <FileDocIcon />
        </div>
      )}
      <div className={styles.fileMetaBox}>
        <span className={styles.fileNameText}>
          <span className={styles.fileNameBase}>{fileNameBase}</span>
          {fileNameExt && <span className={styles.fileNameExt}>{fileNameExt}</span>}
        </span>
        <span className={styles.fileDetailText}>
          {isUploading
            ? "Uploading..."
            : isError
            ? `${formattedSize} · Verification Failed ⚠️`
            : `${formattedSize} · View Document ↗`}
        </span>
      </div>
    </a>
  );
}

export default FileMessageCard;

