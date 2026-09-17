import { useEffect, useState } from "react";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailure from "./PaymentFailure";
import { checkPaymentStatus } from "../../services/conversationService";
import styles from "./PaymentSuccess.module.css";

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
  const [errorMessage, setErrorMessage] = useState(
    initialTxnId ? null : "Transaction ID not found. Could not verify payment."
  );

  useEffect(() => {
    if (!initialTxnId) return;

    checkPaymentStatus(initialTxnId)
      .then((res) => {
        setStatus(res?.status || "ERROR");
        setAmount(res?.amount);
        if (res?.status === "PENDING") {
          setErrorMessage("Payment is currently pending. Please check back later.");
        }
      })
      .catch(() => {
        setStatus("ERROR");
        setErrorMessage("Failed to connect to the server to verify payment status.");
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

  return <PaymentFailure txnid={txnid} errorMessage={errorMessage} />;
};

export default PaymentCallback;
