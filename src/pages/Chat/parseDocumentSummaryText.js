// Normalizes the backend's raw document/fee prose into FeeSummaryCard's
// props - stands in for the structured `summary input` shape until the
// backend sends it directly.
//

// Returns null for anything that doesn't look like this message.

const REQUIREMENTS_MARKER = /requirements for/i;
const FEE_MARKER = /application fee/i;

const DOCUMENT_DEFS = [
  // Group 2 captures the parenthetical after the category name (group 1,
  // unused). foldParenIntoLabel folds it into the label instead of a
  // separate line.
  { label: "Identity Proof", match: /Identity Proof\s*(\(([^)]*)\))?/i, foldParenIntoLabel: true },
  { label: "Bank Proof", match: /Bank Proof\s*(\(([^)]*)\))?/i },
  { label: "Permanent Address Proof", match: /Permanent Address Proof\s*(\(([^)]*)\))?/i },
  { label: "Present Address Proof", match: /Present Address Proof\s*(\(([^)]*)\))?/i },
  { label: "GST Registration Certificate", match: /GST Registration Certificate\s*(\(([^)]*)\))?/i },
  // No parenthetical capture here - the surrounding prose is too irregular to lift cleanly.
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
  // Bounded by newlines too, so it can't swallow the preceding line when
  // the refund note has no punctuation of its own.
  const match = text.match(/([^.\n]*refundable[^.\n]*)\.?/i);
  return match ? match[1].trim() : "";
}

const parseDocumentSummaryText = (text) => {
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
};

export default parseDocumentSummaryText;
