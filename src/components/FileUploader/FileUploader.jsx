import { useRef, useState } from "react";
import styles from "./FileUploader.module.css";

function UploadIcon() {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" aria-hidden="true">
      <path d="M14 18V6M14 6 9 11M14 6l5 5" stroke="#5C90FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 19v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="#5C90FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FileUploader({ title, caption, onUploaded, disabled }) {
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
