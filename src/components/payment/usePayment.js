import { useCallback, useState } from "react";
import {
  createOrder,
  openRazorpayCheckout,
  handlePaymentSuccess,
  handlePaymentFailure,
} from "../../services/paymentService";

// status: "idle" | "creating_order" | "processing" | "verifying" | "success" | "failure" | "cancelled"
function usePayment({ amount, currency = "INR", prefill } = {}) {
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
      const order = await createOrder({ amount, currency });

      setStatus("processing");

      await openRazorpayCheckout({
        order,
        prefill,
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
        onFailure: (razorpayError) => {
          setError(handlePaymentFailure(razorpayError));
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
  }, [amount, currency, prefill]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  return { status, error, result, startPayment, reset };
}

export default usePayment;
