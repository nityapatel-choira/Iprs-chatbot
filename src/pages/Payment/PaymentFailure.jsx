
import styles from "./PaymentFailure.module.css";
import AlertIcon from "../../components/icons/AlertIcon";

const PaymentFailure = ({ txnid, errorMessage }) => {

  const handleReturn = () => {
    window.location.href = "/";
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <AlertIcon />
        </div>
        <h1 className={styles.title}>Payment Failed</h1>
        <p className={styles.message}>
          Unfortunately, your payment could not be processed at this time. Please try again.
        </p>

        {(txnid || errorMessage) && (
          <div className={styles.detailsBox}>
            {txnid && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Transaction ID:</span>
                <span className={styles.detailValue}>{txnid}</span>
              </div>
            )}
            {errorMessage && (
              <div className={styles.errorText}>
                Reason: {errorMessage}
              </div>
            )}
          </div>
        )}

        <button type="button" className={styles.button} onClick={handleReturn}>
          Return to Chat
        </button>
      </div>
    </div>
  );
};

export default PaymentFailure;
