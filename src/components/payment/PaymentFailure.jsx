import AlertIcon from "../icons/AlertIcon";
import styles from "./PaymentFailure.module.css";

function PaymentFailure({ message, onRetry }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>
        <AlertIcon />
      </span>
      <h3 className={styles.title}>Payment Failed</h3>
      <p className={styles.subtitle}>{message || "Something went wrong while processing your payment."}</p>
      {onRetry && (
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export default PaymentFailure;
