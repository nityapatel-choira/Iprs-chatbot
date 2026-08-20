import { loadRazorpayScript } from "../utils/loadRazorpayScript";

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

// TODO: Replace with backend API — POST /payment/create-order
// The backend must create the order via Razorpay's Orders API using the
// Razorpay *secret* key (server-side only) and return { orderId, amount,
// currency }. The frontend must never talk to Razorpay's order-create API
// directly - it doesn't have, and must never have, the secret key.
//
// Real implementation (once the endpoint exists):
//   import { request } from "./apiClient";
//   async function createPaymentOrder({ amount, currency = "INR", notes }) {
//     return request("/payment/create-order", { method: "POST", body: { amount, currency, notes } });
//   }
//
// Until then, this deliberately returns no `orderId` rather than a fake one.
// A fake id fails Razorpay's own validation and breaks checkout outright -
// omitting it is the honest way to exercise the real checkout flow before
// the backend endpoint exists. The modal still opens and lists real payment
// methods with just a key, but actually completing a payment requires a
// real order - Razorpay rejects the attempt without one. See
// openRazorpayCheckout below (only sends order_id when present) and
// handlePaymentFailure's `hadOrderId` handling, which surfaces that
// rejection as an explicit "backend not configured" message instead of
// Razorpay's generic in-modal error.
async function createPaymentOrder({ amount = 120000, currency = "INR", notes } = {}) {
  return { orderId: null, amount, currency, notes };
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
  return {
    verified: true,
    paymentId: paymentResponse.razorpay_payment_id,
    orderId: paymentResponse.razorpay_order_id,
  };
}

// Opens the actual Razorpay checkout modal. This part talks to Razorpay
// directly (as intended - the checkout UI itself is always client-side) and
// does not change when the backend endpoints above go live.
function openRazorpayCheckout({
  order,
  prefill = {},
  description = "Membership Registration Fee",
  onSuccess,
  onFailure,
  onDismiss,
}) {
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
      // (relevant once a real backend-created order is wired in - the id
      // itself could still be stale/invalid). Without this, an
      // internal-to-Razorpay rejection leaves the UI on "processing" forever,
      // since none of handler/payment.failed/ondismiss fire for it. Cleared
      // the moment any real callback below fires first.
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
        // Only sent when createPaymentOrder actually produced one (i.e. once
        // the backend endpoint is live) - Standard Checkout also supports
        // opening with just amount+currency, which is what happens today
        // with no backend. See createPaymentOrder's comment above.
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
      razorpay.on("payment.failed", (response) =>
        settleOnce(onFailure ?? (() => {}))(response.error, { hadOrderId: Boolean(order.orderId) })
      );
      razorpay.open();
    })
    .catch((err) => {
      onFailure?.({ description: err.message || "Couldn't open the payment window. Please try again." });
    });
}

// razorpay_order_id/razorpay_signature are only present when checkout was
// opened with a real order_id (see openRazorpayCheckout) - both are
// undefined without a backend order today, and populated once a real order
// is wired in. Either way, this always defers to verifyPayment's `verified`
// result rather than treating the Razorpay callback firing as proof of a
// completed payment - that's a backend-only guarantee.
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

  // The checkout modal can open and list real payment methods with just a
  // key, but actually submitting a payment is a separate call that requires
  // a valid order - and creating one needs the Razorpay *secret* key, which
  // must stay server-side (see createPaymentOrder above). Until the
  // backend's order-creation endpoint exists, every real attempt without an
  // order_id is expected to be rejected by Razorpay for exactly this reason
  // - surface that plainly instead of Razorpay's own (often generic) error
  // text, since retrying changes nothing here.
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
