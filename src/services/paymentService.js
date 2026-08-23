import { loadRazorpayScript } from "../utils/loadRazorpayScript";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

// TODO: replace with backend API — POST /payment/create-order.
// Order creation needs Razorpay's *secret* key (server-side only); the
// frontend must never talk to Razorpay's order-create API directly. Until
// that endpoint exists, this deliberately returns no `orderId` rather than
// a fake one - a fake id fails Razorpay's own validation, whereas omitting
// it lets the real checkout flow (modal + payment methods) still run. See
// openRazorpayCheckout (sends order_id only when present) and
// handlePaymentFailure's `hadOrderId` handling, which turns the resulting
// rejection into an explicit "backend not configured" message.
async function createPaymentOrder({ amount = 120000, currency = "INR", notes } = {}) {
  return { orderId: null, amount, currency, notes };
}

// TODO: replace with backend API — POST /payment/verify.
// razorpay_signature can only be verified server-side (HMAC-SHA256 with the
// secret key). This mock always reports success; the real `verified` flag
// must be respected once this is wired up, including the failure case.
async function verifyPayment(paymentResponse) {
  return {
    verified: true,
    paymentId: paymentResponse.razorpay_payment_id,
    orderId: paymentResponse.razorpay_order_id,
  };
}

// Talks to Razorpay directly (intended - checkout UI is always client-side).
// Doesn't change once the backend endpoints above go live.
function openRazorpayCheckout({
  order,
  prefill = {},
  description = "Membership Registration Fee",
  onSuccess,
  onFailure,
  onDismiss,
}) {
  // Fail fast on a missing key instead of calling .open() anyway: Razorpay's
  // checkout.js shows its own alert() for an invalid key and never opens the
  // modal, so none of the success/failure/dismiss callbacks below would fire
  // and the UI would be stuck "processing" forever.
  if (!RAZORPAY_KEY_ID) {
    onFailure?.({ description: "Payment gateway is not configured. Please contact support." });
    return Promise.resolve();
  }

  return loadRazorpayScript()
    .then((Razorpay) => {
      // Safety net for failures Razorpay doesn't expose a callback for (e.g.
      // an order_id it can't validate). Without this the UI would stay
      // "processing" forever since none of handler/payment.failed/ondismiss
      // would fire. Cleared the moment any real callback fires first.
      let settled = false;
      const settleOnce = (fn) => (...args) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        fn(...args);
      };

      const watchdog = setTimeout(() => {
        settleOnce(onFailure)({
          description: "The payment window didn't respond. Please try again.",
        });
        // Modal may still be open if this fired for another reason - best-effort cleanup.
        try {
          razorpay.close();
        } catch {
          // razorpay.close() isn't guaranteed to exist across checkout.js versions.
        }
      }, 15000);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        // Only sent once createPaymentOrder actually returns one (i.e. the
        // backend is live) - Standard Checkout also supports opening with
        // just amount+currency, which is what happens today.
        ...(order.orderId ? { order_id: order.orderId } : {}),
        name: "IPRS",
        description,
        notes: order.notes || {},
        prefill: {
          name: prefill.name || "",
          email: prefill.email || "",
          contact: prefill.contact || "",
        },
        theme: { color: "#0066ff" },
        // Disabled so a failed attempt is terminal: Razorpay's default keeps
        // the modal open for in-modal retry, which would conflict with our
        // payment.failed handler immediately swapping in the PaymentFailure card.
        retry: { enabled: false },
        modal: {
          ondismiss: () => settleOnce(onDismiss ?? (() => {}))(),
        },
        handler: settleOnce((response) => onSuccess?.(response)),
      };

      const razorpay = new Razorpay(options);
      razorpay.on("payment.failed", (response) =>
        settleOnce(onFailure ?? (() => {}))(response.error, { hadOrderId: Boolean(order.orderId) })
      );
      razorpay.open();
    })
    .catch((err) => {
      onFailure?.({ description: err.message || "Couldn't open the payment window. Please try again." });
    });
}

// razorpay_order_id/signature are only present with a real order_id (see
// openRazorpayCheckout). Always defer to verifyPayment's `verified` result
// rather than treating the callback firing as proof of a completed payment -
// that's a backend-only guarantee.
async function handlePaymentSuccess(paymentResponse) {
  const paymentId = paymentResponse.razorpay_payment_id;
  const orderId = paymentResponse.razorpay_order_id;
  const signature = paymentResponse.razorpay_signature;

  const verification = await verifyPayment(paymentResponse);

  return {
    success: Boolean(verification.verified),
    paymentId,
    orderId,
    signature,
  };
}

function handlePaymentFailure(error, { hadOrderId = true } = {}) {
  const normalized = {
    code: error?.code || "PAYMENT_FAILED",
    message: error?.description || error?.message || "Payment failed. Please try again.",
    raw: error,
  };

  // Without a backend order-creation endpoint, every real attempt is
  // expected to be rejected by Razorpay for the same reason (see
  // createPaymentOrder) - surface that plainly instead of Razorpay's
  // generic error, since retrying changes nothing here.
  if (!hadOrderId) {
    normalized.message =
      "Test payment requires an order created by the backend, which isn't wired up yet. " +
      "The checkout itself opened and worked correctly - this step will complete once the " +
      "backend's order-creation endpoint is live.";
  }

  console.error("[paymentService] payment failed:", normalized);
  return normalized;
}

export { createPaymentOrder, openRazorpayCheckout, verifyPayment, handlePaymentSuccess, handlePaymentFailure };
