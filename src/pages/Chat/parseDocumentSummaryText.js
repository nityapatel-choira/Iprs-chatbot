// Parses unformatted document/fee prose into FeeSummaryCard props.

const REQUIREMENTS_MARKER = /requirements for/i;
const FEE_MARKER = /application fee/i;

const DOCUMENT_DEFS = [
  { label: "Identity Proof", match: /Identity Proof\s*(\(([^)]*)\))?/i, foldParenIntoLabel: true },
  { label: "Bank Proof", match: /Bank Proof\s*(\(([^)]*)\))?/i },
  { label: "Permanent Address Proof", match: /Permanent Address Proof\s*(\(([^)]*)\))?/i },
  { label: "Present Address Proof", match: /Present Address Proof\s*(\(([^)]*)\))?/i },
  { label: "GST Registration Certificate", match: /GST Registration Certificate\s*(\(([^)]*)\))?/i },
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
