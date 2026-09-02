// Parses unformatted document/fee prose into FeeSummaryCard props.

const HAS_DOC_SIGNATURE = /(?:requirements|identity proof|bank proof|address proof|application fee|registration fee)/i;

const DOCUMENT_DEFS = [
  { label: "Identity Proof", match: /Identity Proof\s*(\(([^)]*)\))?/i, foldParenIntoLabel: true },
  { label: "Bank Proof", match: /Bank Proof\s*(\(([^)]*)\))?/i },
  { label: "Permanent Address Proof", match: /Permanent Address Proof\s*(\(([^)]*)\))?/i },
  { label: "Present Address Proof", match: /Present Address Proof\s*(\(([^)]*)\))?/i },
  { label: "GST Registration Certificate", match: /GST Registration Certificate\s*(\(([^)]*)\))?/i },
  { label: "Copy of the NOC from another society", match: /\bNOC\b/i },
  { label: "Passport Size Photo", match: /Passport\s*[Ss]ize\s*Photo/i },
];

function extractEntityLabel(text) {
  const match = text.match(/requirements\s+(?:for|of)\s+([^:\n\-()]+)/i) || text.match(/requirements\s+([^:\n]+)/i);
  return match ? match[1].trim() : "";
}

function extractFee(text) {
  const match = text.match(/(?:application|registration)?\s*fee\s*:?\s*(₹\s*[\d,]+|Rs\.?\s*[\d,]+)/i) || text.match(/(₹\s*[\d,]+)/i);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function extractRefundNote(text) {
  const match = text.match(/([^.\n]*refundable[^.\n]*)\.?/i);
  return match ? match[1].trim() : "";
}

function extractDocs(text) {
  const docs = [];
  const seenLabels = new Set();

  function addDoc(rawText, explicitSubtext) {
    if (!rawText) return;
    let label = rawText.trim();
    let subtext = explicitSubtext;

    if (!subtext) {
      const parenMatch = label.match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (parenMatch) {
        label = parenMatch[1].trim();
        subtext = parenMatch[2].trim();
      }
    }

    if (!label || label.length < 3 || /application fee|non refundable|requirements for/i.test(label)) {
      return;
    }

    const lower = label.toLowerCase();
    if (seenLabels.has(lower)) return;
    seenLabels.add(lower);

    docs.push(subtext ? { label, subtext } : { label });
  }

  // 1. Dynamic list/item extraction (handles \n list items like "1. item", "- item")
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const itemMatch = trimmed.match(/^(?:[-*•]|\d+[.)])\s*(.+)$/);
    if (!itemMatch) continue;

    const content = itemMatch[1].trim();
    if (/fee|refundable|requirements/i.test(content)) continue;
    addDoc(content);
  }

  // 2. Period-separated sentence extraction (handles single-paragraph backend payloads)
  if (docs.length === 0) {
    const chunks = text.split(/\.(?=\s*[A-Z1-9-]|$)/);
    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (trimmed && trimmed.length < 250) {
        addDoc(trimmed);
      }
    }
  }

  // 3. Known DOCUMENT_DEFS fallback
  if (docs.length === 0) {
    for (const def of DOCUMENT_DEFS) {
      const defMatch = text.match(def.match);
      if (!defMatch) continue;
      const parenContent = defMatch[2]?.trim();
      addDoc(
        def.foldParenIntoLabel && parenContent ? `${def.label} (${parenContent})` : def.label,
        parenContent && !def.foldParenIntoLabel ? parenContent : undefined
      );
    }
  }

  return docs;
}

const parseDocumentSummaryText = (text) => {
  if (!text || !HAS_DOC_SIGNATURE.test(text)) return null;

  const docs = extractDocs(text);
  if (docs.length === 0) return null;

  const fee = extractFee(text);

  return {
    entityLabel: extractEntityLabel(text),
    fee,
    feeCaption: fee ? "Total application fee" : "",
    infoText: extractRefundNote(text),
    docsHeading: `You'll need these ${docs.length} document${docs.length === 1 ? "" : "s"}`,
    docsSubtext: "Make sure before you start you have gathered the below mentioned documents.",
    docs,
  };
};

export default parseDocumentSummaryText;
