import styles from "./FileUploader.module.css";
import { t } from "../../i18n";

const PreviewModal = ({ title, onCancel, onConfirm, confirmLabel, children, footerExtra, openUrl }) => (
  <div className={styles.cropModalOverlay} onClick={onCancel}>
    <div className={styles.cropModalHeader} onClick={(e) => e.stopPropagation()}>
      <span className={styles.cropModalTitle}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {openUrl && (
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {t("Open ↗")}
          </a>
        )}
        <button
          type="button"
          className={styles.cropModalClose}
          onClick={onCancel}
          aria-label={t("Close")}
        >
          ✕
        </button>
      </div>
    </div>
    <div className={styles.cropStage} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
    <div className={styles.cropFooter} onClick={(e) => e.stopPropagation()}>
      <button type="button" className={styles.cropCancelBtn} onClick={onCancel}>
        {t("Cancel")}
      </button>
      {confirmLabel && onConfirm && (
        <button type="button" className={styles.cropConfirmBtn} onClick={onConfirm}>
          {confirmLabel}
        </button>
      )}
    </div>
    {footerExtra}
  </div>
);

export default PreviewModal;
