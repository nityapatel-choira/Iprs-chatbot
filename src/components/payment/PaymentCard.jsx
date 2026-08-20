import { useMemo } from "react";
import ShieldIcon from "../icons/ShieldIcon";
import usePayment from "./usePayment";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFailure from "./PaymentFailure";
import styles from "./PaymentCard.module.css";

const DEFAULT_TOTAL_RUPEES = 1200;
const GST_RATE = 0.18;

function formatRupees(value) {
  return `₹${value.toLocaleString("en-IN")}`;
}

// Placeholder fee/GST split derived from the total charge amount, purely for
// display - Fee + GST always sums exactly to Total by construction.
// TODO: Replace with backend-provided fee + GST fields once the payment
// step's input payload defines them, instead of deriving this client-side.
function computeBreakdown(totalRupees) {
  const gst = Math.round(totalRupees - totalRupees / (1 + GST_RATE));
  const fee = totalRupees - gst;
  return { fee, gst, total: totalRupees };
}

function PaymentCard({
  amountInRupees = DEFAULT_TOTAL_RUPEES,
  currency = "INR",
  prefill,
  description,
  metadata,
  onComplete,
}) {
  const amountInPaise = Math.round(amountInRupees * 100);
  const { status, error, result, startPayment, reset } = usePayment({
    amount: amountInPaise,
    currency,
    prefill,
    description,
    notes: metadata,
  });
  const breakdown = useMemo(() => computeBreakdown(amountInRupees), [amountInRupees]);

  if (status === "success") {
    return <PaymentSuccess paymentId={result?.paymentId} onContinue={onComplete ? () => onComplete(result) : undefined} />;
  }

  if (status === "failure" || status === "cancelled") {
    return (
      <PaymentFailure message={status === "cancelled" ? "Payment was cancelled." : error?.message} onRetry={reset} />
    );
  }

  const isBusy = status === "creating_order" || status === "processing" || status === "verifying";
  const busyLabel =
    status === "creating_order" ? "Preparing..." : status === "verifying" ? "Verifying..." : "Processing...";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.heading}>Membership Payment</span>
        <span className={styles.secureBadge}>
          <ShieldIcon width={14} height={14} variant="filled" />
          Secure Payment
        </span>
      </div>

      <div className={styles.lineItems}>
        <div className={styles.lineItem}>
          <span>Membership Fee</span>
          <span>{formatRupees(breakdown.fee)}</span>
        </div>
        <div className={styles.lineItem}>
          <span>GST (18%)</span>
          <span>{formatRupees(breakdown.gst)}</span>
        </div>
        <div className={styles.divider} />
        <div className={`${styles.lineItem} ${styles.totalRow}`}>
          <span>Total Amount</span>
          <span>{formatRupees(breakdown.total)}</span>
        </div>
      </div>

      <button type="button" className={styles.payButton} onClick={startPayment} disabled={isBusy}>
        {isBusy && <span className={styles.spinner} aria-hidden="true" />}
        {isBusy ? busyLabel : `Pay ${formatRupees(breakdown.total)}`}
      </button>

      <p className={styles.brandingRow}>Payments secured by Razorpay</p>
    </div>
  );
}

export default PaymentCard;
