import { useEffect, useState } from "react";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailure from "./PaymentFailure";
import { checkPaymentStatus } from "../../services/conversationService";
import styles from "./PaymentSuccess.module.css";

// The backend's terminal "didn't go through" statuses (payment.service.js).
const FAILED_STATUSES = new Set(["FAILED", "CANCELLED"]);

const PaymentCallback = () => {
  const getInitialTxnId = () => {
    if (typeof window === "undefined") return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("txnid") || localStorage.getItem("payu_txnId");
  };

  const initialTxnId = getInitialTxnId();

  const [status, setStatus] = useState(initialTxnId ? "VERIFYING" : "ERROR");
  const [amount, setAmount] = useState(null);
  const [txnid] = useState(initialTxnId);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!initialTxnId) return;

    checkPaymentStatus(initialTxnId)
      .then((res) => {
        setStatus(res?.status || "ERROR");
        setAmount(res?.amount);
        setErrorMessage(res?.errorMessage || null);
      })
      .catch(() => {
        setStatus("ERROR");
      });
  }, [initialTxnId]);

  if (status === "VERIFYING") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Verifying Payment...</h2>
          <p className={styles.message}>Please wait while we securely check your payment status.</p>
        </div>
      </div>
    );
  }

  if (status === "SUCCESS") {
    return <PaymentSuccess amount={amount} txnid={txnid} />;
  }

  if (FAILED_STATUSES.has(status)) {
    return <PaymentFailure txnid={txnid} errorMessage={errorMessage} />;
  }

  // Still PENDING, or the status check itself failed (network, or a token from another/expired
  // login). Neither means the payment failed - money may already have been taken - so don't say so.
  const pending = status === "PENDING";
  let message = "Transaction ID not found, so we couldn't check this payment.";
  if (pending) {
    message = "Your payment hasn't been confirmed yet. Please check back in a few minutes.";
  } else if (txnid) {
    message =
      "We weren't able to check this payment right now. If money was deducted, it will be reflected shortly - please log in again to check, or contact support with your transaction ID.";
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>
          {pending ? "Payment is being processed" : "We couldn't confirm this payment"}
        </h2>
        <p className={styles.message}>{message}</p>
        {txnid && (
          <div className={styles.detailsBox}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Transaction ID:</span>
              <span className={styles.detailValue}>{txnid}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Return to Chat
        </button>
      </div>
    </div>
  );
};

export default PaymentCallback;
