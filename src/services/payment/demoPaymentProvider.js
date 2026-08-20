// Frontend-only demo payment provider for the current client demo, where no
// backend order/verify API exists yet. Deliberately kept completely
// separate from ../paymentService.js (the real Razorpay provider) - this
// file never imports from it, never loads Razorpay's checkout script, and
// never talks to Razorpay's API at all. Selected explicitly (and only when
// VITE_DEMO_PAYMENT_MODE=true) by usePayment.js, which is the sole place
// that decides between this and the real provider - paymentService.js
// itself is untouched.
const DEMO_ORDER_DELAY_MS = 400;
const DEMO_PROCESSING_DELAY_MS = 1200;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lets a specific outcome be forced for manually testing failure/cancel -
// success is the default so the primary demo path needs no query param at
// all. Same convention as the app's existing ?mockInput=/?test= dev-only
// query param hooks (see useBackendConversation.js / App.jsx).
function readForcedOutcome() {
  if (typeof window === "undefined") return "success";
  const value = new URLSearchParams(window.location.search).get("demoPayment");
  return value === "failure" || value === "cancel" ? value : "success";
}

// TODO: Replace with backend API — POST /payment/create-order
// This id is a frontend-only demo order for the current client demo, not a
// real Razorpay order - crypto.randomUUID() keeps every demo id unique, and
// the order_demo_ prefix keeps it unmistakably distinct from a real
// Razorpay order_id (order_XXXXXXXXXXXXXX). This value must NEVER be sent
// to Razorpay - it isn't, because this provider never calls Razorpay at
// all (see openCheckout below). See paymentService.js's real
// createPaymentOrder for the actual Razorpay Orders API contract this must
// eventually be replaced with.
async function createOrder({ amount = 120000, currency = "INR", notes } = {}) {
  await delay(DEMO_ORDER_DELAY_MS);
  return {
    orderId: `order_demo_${crypto.randomUUID()}`,
    amount,
    currency,
    notes,
  };
}

// Simulates the checkout lifecycle entirely locally - never loads
// Razorpay's script, never opens its real modal, never sends the demo
// order id anywhere. usePayment's existing status machine (creating_order
// -> processing -> verifying -> success/failure/cancelled) drives the same
// PaymentCard UI regardless of which provider is behind it, so the
// existing payment UI needs no changes to render this correctly.
function openCheckout({ order, onSuccess, onFailure, onDismiss }) {
  const outcome = readForcedOutcome();

  return delay(DEMO_PROCESSING_DELAY_MS).then(() => {
    if (outcome === "cancel") {
      onDismiss?.();
      return;
    }

    if (outcome === "failure") {
      onFailure?.({
        code: "DEMO_PAYMENT_FAILED",
        description: "Simulated payment failure (demo mode - remove ?demoPayment=failure to retry normally).",
      });
      return;
    }

    onSuccess?.({
      razorpay_payment_id: `pay_demo_${crypto.randomUUID()}`,
      razorpay_order_id: order.orderId,
      razorpay_signature: `sig_demo_${crypto.randomUUID()}`,
    });
  });
}

// TODO: Add server-side payment verification
// Always reports the simulated payment as verified - there's nothing real
// to verify locally (no genuine Razorpay signature was ever produced).
async function verifyPayment(paymentResponse) {
  await delay(DEMO_ORDER_DELAY_MS);
  return {
    verified: true,
    paymentId: paymentResponse.razorpay_payment_id,
    orderId: paymentResponse.razorpay_order_id,
  };
}

// Mirrors paymentService.js's handlePaymentSuccess shape/behavior exactly
// (deliberately duplicated rather than imported, to keep this provider
// completely self-contained) - still defers to verifyPayment's `verified`
// result rather than treating the checkout callback firing as proof of a
// completed payment, even though that stub always reports true here.
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

function handlePaymentFailure(error) {
  const normalized = {
    code: error?.code || "DEMO_PAYMENT_FAILED",
    message: error?.description || error?.message || "Payment failed. Please try again.",
    raw: error,
  };
  console.error("[demoPaymentProvider] payment failed:", normalized);
  return normalized;
}

export { createOrder, openCheckout, verifyPayment, handlePaymentSuccess, handlePaymentFailure };
