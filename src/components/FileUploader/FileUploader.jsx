import { useRef, useState } from "react";
import UploadIcon from "../icons/UploadIcon";
import styles from "./FileUploader.module.css";

function FileUploader({ title, caption, onUploaded, disabled }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsUploading(true);

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const formattedSize = `${parseFloat(sizeMb) > 0 ? sizeMb : "0.8"} MB`;
    const previewUrl = URL.createObjectURL(file);

    setTimeout(() => {
      setIsUploading(false);
      onUploaded?.({
        name: file.name,
        size: formattedSize,
        type: file.type,
        rawFile: file,
        previewUrl,
      });
    }, 600);
  };

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.dropzone} ${isUploading ? styles.dropzoneUploading : ""}`}
        onClick={() => !isUploading && inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <div className={styles.spinnerWrap}>
            <span className={styles.spinner} />
            <span className={styles.title}>Uploading {fileName}...</span>
          </div>
        ) : (
          <>
            <UploadIcon />
            <span className={styles.title}>{fileName || title}</span>
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
