export const STAGE_LABELS = [
  "Personal Details",
  "Information & Documents",
  "Work & Music Details",
  "Review & Payment",
];

export function determineStageIndex({
  input,
  trailingBotText = "",
  sessionEnded = false,
  isPaymentReviewStep = false,
}) {
  // All steps show completed when session has completed.
  if (sessionEnded) {
    return 4;
  }

  // Step 4: Final Payment Review / Fee Summary / Review input.
  if (
    isPaymentReviewStep ||
    input?.type === "summary input" ||
    input?.type === "payment-review" ||
    input?.type === "review input"
  ) {
    return 3;
  }

  const currentPromptText = `${input?.title || ""} ${input?.caption || ""} ${input?.placeholder || ""}`.toLowerCase();

  // Step 4 Check: Explicit review / declaration / payment terms in current prompt.
  if (/\b(payment|fee summary|declaration|i accept|review your details|check your details)\b/i.test(currentPromptText)) {
    return 3;
  }

  // Step 3 Check: Specific Work / Music / Repertoire prompt questions.
  if (/\b(album|track name|song title|music work|work title|repertoire|creation name|release date|work submission)\b/i.test(currentPromptText)) {
    return 2;
  }

  // Step 2 Check: Information, Bank Details, PAN, GST, ID / Address Proofs, File / Document Uploads.
  if (
    input?.type === "document input" ||
    input?.type === "file input" ||
    /\b(bank|account|ifsc|cheque|passbook|pan|gst|address proof|identity proof|passport photo|profile photo|incorporation|memorandum|board resolution|deed|upload)\b/i.test(currentPromptText)
  ) {
    return 1;
  }

  // Fallback for trailing bot text context if input title is generic.
  const trailingText = (trailingBotText || "").toLowerCase();
  if (/\b(album|track name|song title|music work|work title|repertoire)\b/i.test(trailingText)) {
    return 2;
  }

  // Default: Step 1 (Personal Details) is active.
  return 0;
}


