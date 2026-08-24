// Normalizes the backend's document/fee-requirements bot message into the
// props FeeSummaryCard already expects. The backend currently sends this as
// one long prose paragraph (e.g. "Requirements for Author/Composer
// (Individual) Identity Proof (Pan Card)... APPLICATION FEE: ₹1200...")
// rather than the structured `summary input` shape FeeSummaryCard was
// originally built for (see Chat.jsx's "summary input" TODO) - if the
// backend ever does send that structured shape, use it directly instead of
// this file.
//
// This is necessarily a heuristic tied to the backend's current wording:
// each document is recognized by a fixed category anchor below. Those
// anchors are stable domain knowledge about which document categories this
// specific IPRS form has - not the same thing as hardcoding the displayed
// copy, since every piece of text actually shown is either extracted
// verbatim from the backend string or a short generic label naming the
// category (Identity Proof, Bank Proof, etc.) it's under. If the backend
// renames a category outright, that item simply isn't recognized and drops
// out of the parsed list - it never shows fabricated text.
//
// Returns null for any text that doesn't look like this message at all, so
// callers can safely try this against every bot message without misfiring
// on unrelated content.

const REQUIREMENTS_MARKER = /requirements for/i;
const FEE_MARKER = /application fee/i;

const DOCUMENT_DEFS = [
  // `match`'s optional group 2 captures whatever the backend wrote inside
  // the parens right after the category name, if anything - group 1 is
  // just that same parenthetical with its parens still attached (unused
  // here). `foldParenIntoLabel` folds a short qualifier (e.g. "(PAN
  // Card)") into the bold label itself instead of a separate line, since
  // that's a single document choice rather than a list of alternatives.
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

const ENTITY_LABEL_PATTERN = /requirements for\s+(.+?)\s*(?=identity proof)/is;
const FEE_PATTERN = /application fee\s*:?\s*(₹\s*[\d,]+)/i;
const REFUND_NOTE_PATTERN = /([^.\n]*refundable[^.\n]*)\.?/i;

function extractEntityLabel(text) {
  const match = text.match(ENTITY_LABEL_PATTERN);
  return match ? match[1].trim() : "";
}

function extractFee(text) {
  const match = text.match(FEE_PATTERN);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function extractRefundNote(text) {
  const match = text.match(REFUND_NOTE_PATTERN);
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
