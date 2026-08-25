import { useEffect } from "react";
import CloseIcon from "../icons/CloseIcon";
import styles from "./BottomSheet.module.css";

const BottomSheet = ({ open, title, children, footer, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.scrim} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.handle} aria-hidden="true" />
        {onClose && (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        )}
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.body}>{children}</div>
        {footer && (
          <>
            <div className={styles.divider} aria-hidden="true" />
            <div className={styles.footer}>{footer}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
