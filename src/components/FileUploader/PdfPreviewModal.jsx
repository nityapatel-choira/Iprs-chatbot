import styles from "./FileUploader.module.css";
import { t } from "../../i18n";
import PreviewModal from "./PreviewModal";

function PdfPreviewModal({ pendingFile, pendingPreviewUrl, pdfImageUrl, onCancel, onConfirm }) {
  return (
    <PreviewModal
      title={t("Preview PDF Document")}
      onCancel={onCancel}
      onConfirm={() => onConfirm(pendingFile)}
      confirmLabel={t("Use Document")}
      openUrl={pendingPreviewUrl}
    >
      <div className={styles.cropImageWrapper} style={{ overflow: 'hidden', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <object
          data={pendingPreviewUrl}
          type="application/pdf"
          className={styles.pdfObject}
        >
          <iframe
            src={pendingPreviewUrl}
            title={t("PDF preview")}
            className={styles.pdfObject}
          >
            <div className={styles.spinnerWrap} role="alert">
              <span className={styles.hint} style={{ color: '#ef4444' }}>{t("Preview unavailable")}</span>
            </div>
          </iframe>
        </object>
        
        <div className={styles.mobilePdfFallback}>
          {pdfImageUrl === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span className={styles.errorIcon} style={{ fontSize: '2rem' }}>⚠️</span>
              <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '600' }}>{t("Preview unavailable")}</span>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem', textAlign: 'center' }}>{t("The PDF could not be rendered.")}</span>
            </div>
          ) : pdfImageUrl ? (
            <img src={pdfImageUrl} alt={t("PDF Preview")} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span className={styles.spinner} />
              <span style={{ color: '#fff', fontSize: '0.875rem' }}>{t("Loading PDF preview...")}</span>
            </div>
          )}
        </div>
      </div>
    </PreviewModal>
  );
}

export default PdfPreviewModal;
