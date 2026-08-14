import { loadRazorpayScript } from "../utils/loadRazorpayScript";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
const MOCK_NETWORK_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// TODO: Replace with backend API — POST /payment/create-order
// The backend must create the order via Razorpay's Orders API using the
// Razorpay *secret* key (server-side only) and return { orderId, amount,
// currency }. The frontend must never talk to Razorpay's order-create API
// directly - it doesn't have, and must never have, the secret key.
//
// Real implementation (once the endpoint exists):
//   import { request } from "./apiClient";
//   async function createOrder({ amount, currency = "INR" }) {
//     return request("/payment/create-order", { method: "POST", body: { amount, currency } });
//   }
async function createOrder({ amount = 120000, currency = "INR" } = {}) {
  await delay(MOCK_NETWORK_DELAY_MS);
  return {
    orderId: "order_mock_123",
    amount,
    currency,
  };
}

// TODO: Replace with backend API — POST /payment/verify
// razorpay_signature can only be verified server-side (HMAC-SHA256 of
// `${order_id}|${payment_id}` using the Razorpay secret key) - this is not
// something the frontend can or should attempt. This mock always reports
// success; the real backend response's `verified` boolean must be respected
// once this is wired up, including the false/failed case.
//
// Real implementation:
//   async function verifyPayment(paymentResponse) {
//     return request("/payment/verify", { method: "POST", body: paymentResponse });
//   }
async function verifyPayment(paymentResponse) {
  await delay(MOCK_NETWORK_DELAY_MS);
  return {
    verified: true,
    paymentId: paymentResponse.razorpay_payment_id,
    orderId: paymentResponse.razorpay_order_id,
  };
}

// TODO: Replace with backend API — POST /payment/webhook, or remove entirely
// if Razorpay is configured to call the backend's webhook endpoint directly
// instead of going through the client. Kept as a stable function so the UI
// layer never needs to change regardless of how this ends up wired.
async function sendPaymentWebhook(payload) {
  console.log("[paymentService] payment webhook payload:", payload);
  return { received: true };
}

// Opens the actual Razorpay checkout modal. This part talks to Razorpay
// directly (as intended - the checkout UI itself is always client-side) and
// does not change when the backend endpoints above go live.
function openRazorpayCheckout({ order, prefill = {}, onSuccess, onFailure, onDismiss }) {
  // Fail fast on a missing/misconfigured key rather than calling
  // `.open()` anyway: Razorpay's own checkout.js shows its own native
  // alert() for an invalid key and then never opens the modal - meaning
  // none of the modal/handler/payment.failed callbacks below ever fire,
  // and the UI would otherwise be stuck on "processing" forever with no
  // way to recover. This check is what turns that into a normal, visible
  // failure state instead.
  if (!RAZORPAY_KEY_ID) {
    onFailure?.({ description: "Payment gateway is not configured. Please contact support." });
    return Promise.resolve();
  }

  return loadRazorpayScript()
    .then((Razorpay) => {
      // Safety net for failure modes Razorpay doesn't expose a callback for
      // at all - e.g. an order_id it can't validate against its own servers
      // (which is exactly what happens with the mock order_id used in this
      // phase; a real backend-created order won't hit this). Without this,
      // an internal-to-Razorpay rejection leaves the UI on "processing"
      // forever, since none of handler/payment.failed/ondismiss fire for it.
      // Cleared the moment any real callback below fires first.
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
        // The modal may still be open behind our UI if this fired for a
        // reason other than the modal actually closing - best-effort clean
        // up so it doesn't linger on top of our (already-failed) card.
        try {
          razorpay.close();
        } catch {
          // razorpay.close() isn't guaranteed to exist across checkout.js
          // versions - this is a best-effort cleanup, not load-bearing.
        }
      }, 15000);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        order_id: order.orderId,
        name: "IPRS",
        description: "Membership Registration Fee",
        prefill: {
          name: prefill.name || "",
          email: prefill.email || "",
          contact: prefill.contact || "",
        },
        theme: { color: "#0066ff" },
        // Disabled so a failed attempt is actually terminal: Razorpay's
        // default behavior on `payment.failed` is to keep the modal open
        // and let the user retry a different method *inside* it, without
        // closing. Our `payment.failed` handler below immediately swaps
        // our UI to the PaymentFailure card - if the modal stayed open
        // for its own retry, that would leave two conflicting UIs on
        // screen (our failure card behind Razorpay's still-open modal).
        // Disabling retry makes "the modal closes" and "we show failure"
        // the same event, matching what the user actually sees.
        retry: { enabled: false },
        modal: {
          ondismiss: () => settleOnce(onDismiss ?? (() => {}))(),
        },
        handler: settleOnce((response) => onSuccess?.(response)),
      };

      const razorpay = new Razorpay(options);
      razorpay.on("payment.failed", (response) => settleOnce(onFailure ?? (() => {}))(response.error));
      razorpay.open();
    })
    .catch((err) => {
      onFailure?.({ description: err.message || "Couldn't open the payment window. Please try again." });
    });
}

async function handlePaymentSuccess(paymentResponse) {
  const paymentId = paymentResponse.razorpay_payment_id;
  const orderId = paymentResponse.razorpay_order_id;
  const signature = paymentResponse.razorpay_signature;

  const verification = await verifyPayment(paymentResponse);

  await sendPaymentWebhook({
    event: "payment.captured",
    paymentId,
    orderId,
    signature,
    verified: verification.verified,
  });

  return {
    success: Boolean(verification.verified),
    paymentId,
    orderId,
    signature,
  };
}

function handlePaymentFailure(error) {
  const normalized = {
    code: error?.code || "PAYMENT_FAILED",
    message: error?.description || error?.message || "Payment failed. Please try again.",
    raw: error,
  };
  console.error("[paymentService] payment failed:", normalized);
  return normalized;
}

export {
  createOrder,
  openRazorpayCheckout,
  verifyPayment,
  handlePaymentSuccess,
  handlePaymentFailure,
  sendPaymentWebhook,
};
