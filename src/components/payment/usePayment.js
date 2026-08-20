import { useCallback, useState } from "react";
import {
  createPaymentOrder,
  openRazorpayCheckout,
  handlePaymentSuccess,
  handlePaymentFailure,
} from "../../services/paymentService";

// status: "idle" | "creating_order" | "processing" | "verifying" | "success" | "failure" | "cancelled"
function usePayment({ amount, currency = "INR", prefill, description, notes } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const startPayment = useCallback(async () => {
    setStatus("creating_order");
    setError(null);

    try {
      // TODO: Replace with backend API — once a real "payment input" step
      // exists, the order should come from that backend response instead of
      // being created client-side here.
      const order = await createPaymentOrder({ amount, currency, notes });

      setStatus("processing");

      await openRazorpayCheckout({
        order,
        prefill,
        description,
        onSuccess: async (paymentResponse) => {
          setStatus("verifying");
          const outcome = await handlePaymentSuccess(paymentResponse);
          if (outcome.success) {
            setResult(outcome);
            setStatus("success");
          } else {
            setError({ message: "We couldn't verify your payment. Please contact support." });
            setStatus("failure");
          }
        },
        onFailure: (razorpayError, context) => {
          setError(handlePaymentFailure(razorpayError, context));
          setStatus("failure");
        },
        onDismiss: () => {
          // Only treat this as a cancellation if the modal was actually open
          // (Razorpay also fires ondismiss in some non-cancel edge cases) -
          // guard against clobbering a status that already moved on.
          setStatus((current) => (current === "processing" ? "cancelled" : current));
        },
      });
    } catch (err) {
      setError({ message: err.message || "Something went wrong. Please try again." });
      setStatus("failure");
    }
  }, [amount, currency, prefill, description, notes]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, startPayment, reset };
}

export default usePayment;
