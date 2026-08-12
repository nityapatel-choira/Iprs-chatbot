import styles from "./ConsentSheet.module.css";

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4 4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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
        <button type="button" className={styles.closeButton} onClick={onBack} aria-label="Close">
          <CloseIcon />
        </button>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.divider} aria-hidden="true" />
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
