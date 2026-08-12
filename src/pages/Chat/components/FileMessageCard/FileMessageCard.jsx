import FileDocIcon from "../../../../components/icons/FileDocIcon";
import styles from "./FileMessageCard.module.css";

function FileMessageCard({ fileName, fileSize, previewUrl }) {
  return (
    <a
      href={previewUrl || "#"}
      target={previewUrl ? "_blank" : undefined}
      rel="noreferrer"
      className={styles.fileBubbleUser}
      title={previewUrl ? "Click to view uploaded document" : undefined}
    >
      <div className={styles.fileIconBox}>
        <FileDocIcon />
      </div>
      <div className={styles.fileMetaBox}>
        <span className={styles.fileNameText}>{fileName}</span>
        <span className={styles.fileDetailText}>{fileSize || "1.2 MB"} · View Document ↗</span>
      </div>
    </a>
  );
}

export default FileMessageCard;
