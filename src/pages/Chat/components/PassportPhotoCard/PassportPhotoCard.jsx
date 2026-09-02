import { useLayoutEffect, useRef, useState } from "react";
import CameraIcon from "../../../../components/icons/CameraIcon";
import UploadCloudIcon from "../../../../components/icons/UploadCloudIcon";
import FaceVerification from "../../../FaceVerification/FaceVerification";
import styles from "./PassportPhotoCard.module.css";

// Converts captured data URL to a File object.
function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

const PassportPhotoCard = ({ title, caption, onFileSelected, disabled }) => {
  const [mode, setMode] = useState(null); // null (choice) | "camera"
  const faceScanRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scrolls camera into view when activated.
  useLayoutEffect(() => {
    if (mode === "camera") {
      faceScanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mode]);

  function handleContinue(dataUrl) {
    onFileSelected?.(dataUrlToFile(dataUrl, `passport-photo-${Date.now()}.jpg`));
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      onFileSelected?.(file);
    }
  }

  if (mode === "camera") {
    return (
      <div ref={faceScanRef} className={styles.faceScanWrap}>
        <FaceVerification
          embedded
          initialMode="camera"
          onContinue={handleContinue}
          onFileSelected={onFileSelected}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.title}>{title || "Passport Size Photo"}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
      <div className={styles.choiceRow}>
        <button
          type="button"
          className={styles.choiceButton}
          onClick={() => setMode("camera")}
          disabled={disabled}
        >
          <CameraIcon width={20} height={20} />
          Scan Face
        </button>
        <button
          type="button"
          className={`${styles.choiceButton} ${styles.choiceButtonSecondary}`}
          onClick={handleUploadClick}
          disabled={disabled}
        >
          <UploadCloudIcon />
          Upload Photo
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default PassportPhotoCard;
