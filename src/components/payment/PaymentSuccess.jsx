import CheckIcon from "../icons/CheckIcon";
import styles from "./PaymentSuccess.module.css";

function PaymentSuccess({ paymentId, onContinue }) {
  return (
    <div className={styles.card}>
      <span className={styles.icon}>
        <CheckIcon />
      </span>
      <h3 className={styles.title}>Payment Successful</h3>
      <p className={styles.subtitle}>Your membership payment has been received.</p>
      {paymentId && <p className={styles.paymentId}>Payment ID: {paymentId}</p>}
      {onContinue && (
        <button type="button" className={styles.continueButton} onClick={onContinue}>
          Continue
        </button>
      )}
    </div>
  );
}

export default PaymentSuccess;
