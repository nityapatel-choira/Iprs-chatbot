import PaymentCard from "../../components/payment/PaymentCard";
import styles from "./PaymentPage.module.css";

// TEMPORARY: stands in for a real backend-driven "payment input" step (see
// the TODO in Chat.jsx). Renders PaymentCard centered at the top of its own
// page rather than inline in the chat - once the backend sends a real
// payment step, this page goes away and PaymentCard renders inline instead.
function PaymentPage({ amountInRupees, prefill, onComplete }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <PaymentCard amountInRupees={amountInRupees} prefill={prefill} onComplete={onComplete} />
      </div>
    </div>
  );
}

export default PaymentPage;
