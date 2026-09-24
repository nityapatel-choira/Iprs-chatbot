import styles from "./PaymentResultModal.module.css";
import CheckIcon from "../../../../components/icons/CheckIcon";
import BottomSheet from "../../../../components/BottomSheet/BottomSheet";
import { t } from "../../../../i18n";

const ErrorIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PaymentResultModal = ({ data, onClose }) => {
  const { status, amount, txnid, errorMessage } = data || {};

  const renderContent = () => {
    if (status === "VERIFYING") {
      return (
        <div className={styles.container}>
          <h2 className={styles.title}>{t("Verifying Payment...")}</h2>
          <p className={styles.message}>
            Please wait while we securely check your payment status.
          </p>
        </div>
      );
    }

    if (status === "SUCCESS") {
      return (
        <div className={styles.container}>
          <div className={styles.successIconWrap}>
            <CheckIcon />
          </div>
          <h2 className={styles.title}>{t("Payment Successful!")}</h2>
          <p className={styles.message}>
            Thank you! Your payment has been received and processed successfully.
          </p>

          {(txnid || amount) && (
            <div className={styles.detailsBox}>
              {txnid && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{t("Transaction ID:")}</span>
                  <span className={styles.detailValue}>{txnid}</span>
                </div>
              )}
              {amount && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>{t("Amount Paid:")}</span>
                  <span className={styles.detailValue}>₹{amount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // FAILED or ERROR
    return (
      <div className={styles.container}>
        <div className={styles.errorIconWrap}>
          <ErrorIcon />
        </div>
        <h2 className={styles.title}>{t("Payment Failed")}</h2>
        <p className={styles.message}>
          Unfortunately, your payment could not be processed at this time.
        </p>

        {(txnid || errorMessage) && (
          <div className={styles.detailsBox}>
            {txnid && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t("Transaction ID:")}</span>
                <span className={styles.detailValue}>{txnid}</span>
              </div>
            )}
            {errorMessage && (
              <div className={styles.errorReason}>
                Reason: {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isVerifying = status === "VERIFYING";

  return (
    <BottomSheet
      open={true}
      title=""
      onClose={isVerifying ? undefined : onClose}
      footer={
        !isVerifying && (
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        )
      }
    >
      {renderContent()}
    </BottomSheet>
  );
};

export default PaymentResultModal;
