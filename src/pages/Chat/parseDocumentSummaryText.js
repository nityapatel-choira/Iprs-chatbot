// Normalizes the backend's document/fee-requirements bot message into the
// props FeeSummaryCard expects. The backend sends this as one long prose
// paragraph rather than the structured `summary input` shape FeeSummaryCard
// was originally built for (see Chat.jsx's "summary input" TODO) - if the
// backend ever sends that structured shape, use it directly instead.
//
// This is a heuristic tied to the backend's current wording: each document
// is recognized by a fixed category anchor below - stable domain knowledge
// about this IPRS form, not hardcoded copy, since every piece of text shown
// is either extracted verbatim from the backend string or a short generic
// label naming its category. If the backend renames a category, that item
// just isn't recognized and drops out of the parsed list - never fabricated.
//
// Returns null for text that doesn't look like this message, so callers can
// safely try this against every bot message without misfiring.

const REQUIREMENTS_MARKER = /requirements for/i;
const FEE_MARKER = /application fee/i;

const DOCUMENT_DEFS = [
  // `match`'s optional group 2 captures whatever the backend wrote inside
  // the parens after the category name, if anything - group 1 is the same
  // parenthetical with parens attached (unused). `foldParenIntoLabel` folds
  // a short qualifier (e.g. "(PAN Card)") into the label itself instead of
  // a separate line, since that's a single document choice, not a list.
  { label: "Identity Proof", match: /Identity Proof\s*(\(([^)]*)\))?/i, foldParenIntoLabel: true },
  { label: "Bank Proof", match: /Bank Proof\s*(\(([^)]*)\))?/i },
  { label: "Permanent Address Proof", match: /Permanent Address Proof\s*(\(([^)]*)\))?/i },
  { label: "Present Address Proof", match: /Present Address Proof\s*(\(([^)]*)\))?/i },
  { label: "GST Registration Certificate", match: /GST Registration Certificate\s*(\(([^)]*)\))?/i },
  // No parenthetical capture for these two - the source prose around them
  // is too irregular to reliably lift a clean subtext out of, so they
  // render as a label only, same as Figma shows.
  { label: "Copy of the NOC from another society", match: /\bNOC\b/i },
  { label: "Passport Size Photo", match: /Passport\s*[Ss]ize\s*Photo/i },
];

function extractEntityLabel(text) {
  const match = text.match(/requirements for\s+(.+?)\s*(?=identity proof)/is);
  return match ? match[1].trim() : "";
}

function extractFee(text) {
  const match = text.match(/application fee\s*:?\s*(₹\s*[\d,]+)/i);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function extractRefundNote(text) {
  // Bounded by newlines as well as periods so this can't run past a blank
  // line and swallow unrelated preceding text when the refund note is its
  // own short line with no punctuation, as in "APPLICATION FEE:
  // ₹1200\n\nNon Refundable". Uses whatever fragment the backend wrote
  // verbatim, rather than inventing new copy.
  const match = text.match(/([^.\n]*refundable[^.\n]*)\.?/i);
  return match ? match[1].trim() : "";
}

export function parseDocumentSummaryText(text) {
  if (!text || !REQUIREMENTS_MARKER.test(text) || !FEE_MARKER.test(text)) return null;

  const docs = [];
  for (const def of DOCUMENT_DEFS) {
    const match = text.match(def.match);
    if (!match) continue;
    const parenContent = match[2]?.trim();
    if (parenContent && def.foldParenIntoLabel) {
      docs.push({ label: `${def.label} (${parenContent})` });
    } else if (parenContent) {
      docs.push({ label: def.label, subtext: parenContent });
    } else {
      docs.push({ label: def.label });
    }
  }
  if (docs.length === 0) return null;

  return {
    entityLabel: extractEntityLabel(text),
    fee: extractFee(text),
    feeCaption: "Total application fee",
    infoText: extractRefundNote(text),
    docsHeading: `You'll need these ${docs.length} document${docs.length === 1 ? "" : "s"}`,
    docsSubtext: "Make sure before you start you have gathered the below mentioned documents.",
    docs,
  };
}
