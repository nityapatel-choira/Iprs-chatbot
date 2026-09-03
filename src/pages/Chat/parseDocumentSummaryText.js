// Parses backend document requirement text into FeeSummaryCard props dynamically.

const HAS_DOC_SIGNATURE = /(?:requirements|identity proof|bank proof|address proof|application fee|registration fee|document)/i;

function extractEntityLabel(text) {
  const match = text.match(/requirements\s+(?:for|of|-|:)?\s*([^\n:]+)/i);
  if (!match) return "";
  const raw = match[1].trim();
  const parenEndMatch = raw.match(/^([^(]+\([^)]+\))/);
  if (parenEndMatch) {
    return parenEndMatch[1].trim();
  }
  return raw.replace(/\.+$/, "");
}

function extractFee(text) {
  const match = text.match(/(?:application|registration)?\s*fee\s*:?\s*(₹\s*[\d,]+|Rs\.?\s*[\d,]+)/i) || text.match(/(₹\s*[\d,]+)/i);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function extractRefundNote(text) {
  const match = text.match(/\b(non-?refundable)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function extractDocs(text) {
  const docs = [];
  const seenKeys = new Set();

  function addDoc(rawText) {
    if (!rawText) return;
    let cleanText = rawText.trim().replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
    cleanText = cleanText.replace(/\.+$/, "").trim();

    if (!cleanText || cleanText.length < 3) return;

    // Exclude entity title headers, fee lines, and refund notes from document list
    if (/^requirements\s+(?:for|of|-|:)/i.test(cleanText) || /^requirements$/i.test(cleanText)) return;
    if (/(?:application|registration)?\s*fee\s*:/i.test(cleanText) || /^₹\s*[\d,]+/i.test(cleanText)) return;
    if (/^non-?refundable$/i.test(cleanText) || (cleanText.length < 25 && /refundable/i.test(cleanText))) return;

    let label = cleanText;
    let subtext;

    // Extract title (group 1), inside-parenthesis (group 2), and remaining after-parenthesis (group 3)
    const parenMatch = cleanText.match(/^([^(]+)\s*\(([^)]+)\)\s*(.*)$/);
    if (parenMatch) {
      label = parenMatch[1].trim();
      const insideParen = parenMatch[2].trim();
      const afterParen = parenMatch[3].trim().replace(/\)+$/, "").trim();
      subtext = afterParen ? `${insideParen} ${afterParen}` : insideParen;
    }

    const key = `${label.toLowerCase()}::${(subtext || "").toLowerCase()}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    docs.push(subtext ? { label, subtext } : { label });
  }

  // Pre-split text by:
  // 1. Newlines \n
  // 2. Position after closing parenthesis followed by Capital letter: (?<=\))\s*\.?\s*(?=[A-Z])
  // 3. Position after period followed by Capital letter: (?<=\.)\s*(?=[A-Z])
  // 4. Word boundary between lowercase letter and a Capitalized Word (2+ chars): (?<=[a-z0-9])(?=[A-Z][a-z]{2,})
  const rawChunks = text.split(/\n|(?<=\))\s*\.?\s*(?=[A-Z])|(?<=\.)\s*(?=[A-Z])|(?<=[a-z0-9])(?=[A-Z][a-z]{2,})/);

  for (const chunk of rawChunks) {
    addDoc(chunk);
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
