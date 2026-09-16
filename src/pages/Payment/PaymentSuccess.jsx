import { useMemo } from "react";
import styles from "./PaymentSuccess.module.css";
import CheckIcon from "../../components/icons/CheckIcon";

const PaymentSuccess = () => {
  const { txnid, amount } = useMemo(() => {
    if (typeof window === "undefined") return { txnid: null, amount: null };
    const params = new URLSearchParams(window.location.search);
    return {
      txnid: params.get("txnid"),
      amount: params.get("amount"),
    };
  }, []);

  const handleReturn = () => {
    window.location.href = "/";
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <CheckIcon />
        </div>
        <h1 className={styles.title}>Payment Successful!</h1>
        <p className={styles.message}>
          Thank you! Your payment has been received and processed successfully.
        </p>

        {(txnid || amount) && (
          <div className={styles.detailsBox}>
            {txnid && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Transaction ID:</span>
                <span className={styles.detailValue}>{txnid}</span>
              </div>
            )}
            {amount && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Amount Paid:</span>
                <span className={styles.detailValue}>₹{amount}</span>
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

export default PaymentSuccess;
