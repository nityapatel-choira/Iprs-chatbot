import styles from "./ConsentSheet.module.css";

export default function ConsentSheet({ open, title, children, onAccept, onBack }) {
  if (!open) return null;

  return (
    <div className={styles.scrim} role="presentation" onClick={onBack}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.handle} aria-hidden="true" />
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          <button type="button" className={styles.backButton} onClick={onBack}>
            Go back
          </button>
          <button type="button" className={styles.acceptButton} onClick={onAccept}>
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}
