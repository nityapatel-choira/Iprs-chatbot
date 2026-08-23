import { useLayoutEffect, useRef, useState } from "react";
import CameraIcon from "../../../../components/icons/CameraIcon";
import UploadCloudIcon from "../../../../components/icons/UploadCloudIcon";
import FaceVerification from "../../../FaceVerification/FaceVerification";
import styles from "./PassportPhotoCard.module.css";

// Turns the data URL FaceVerification hands back (from either its live
// capture or its own upload-fallback path) into a real File, since
// useBackendConversation.submitFile - the same function FileUploader calls
// elsewhere - expects a File (reads .name/.size, then POSTs it as-is).
function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

// Passport Size Photo step of the Document Upload flow. Reuses
// FaceVerification/useFaceDetection as-is (embedded mode) for both paths:
// "Scan Face" opens straight into live capture, "Upload Photo" opens
// straight into its upload fallback (same MediaPipe validation either
// way). The image is handed to the file-upload flow via onFileSelected
// only once the user taps Continue on FaceVerification's result screen.
function PassportPhotoCard({ title, caption, onFileSelected, disabled }) {
  const [mode, setMode] = useState(null); // null (choice) | "camera" | "upload"
  const faceScanRef = useRef(null);

  // Only "Scan Face" gets auto-scrolled - the tall, camera-heavy view can
  // land below the fold; "Upload Photo" opens the native picker itself (see
  // FileUploader's autoOpen) and shouldn't also animate the page.
  // useLayoutEffect (not useEffect) so this runs after the DOM has
  // FaceVerification's real height but before the browser paints, avoiding
  // a visible pre-scroll flash.
  useLayoutEffect(() => {
    if (mode === "camera") {
      faceScanRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mode]);

  function handleContinue(dataUrl) {
    onFileSelected?.(dataUrlToFile(dataUrl, `passport-photo-${Date.now()}.jpg`));
  }

  if (mode) {
    return (
      <div ref={faceScanRef} className={styles.faceScanWrap}>
        <FaceVerification embedded initialMode={mode} onContinue={handleContinue} />
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
          onClick={() => setMode("upload")}
          disabled={disabled}
        >
          <UploadCloudIcon />
          Upload Photo
        </button>
      </div>
    </div>
  );
}

export default PassportPhotoCard;
