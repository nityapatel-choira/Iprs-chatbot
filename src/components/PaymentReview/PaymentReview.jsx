import { useMemo } from "react";
import BotAvatar from "../../pages/Chat/components/BotAvatar/BotAvatar";
import styles from "./PaymentReview.module.css";

function extractRawText(message, data) {
  if (Array.isArray(message?.richText)) {
    return message.richText
      .map((node) => {
        if (typeof node === "string") return node;
        if (node?.children && Array.isArray(node.children)) {
          return node.children.map((c) => c?.text || "").join(" ");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof message?.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  if (typeof data?.text === "string" && data.text.trim()) {
    return data.text.trim();
  }

  return "";
}

function getSectionTitle(rawTitle) {
  const clean = rawTitle.trim();

  // Keep exact section title for uploaded documents, songs, or titles with numbers/counts
  if (/documents\s+you\s+uploaded|uploaded\s+documents|your\s+songs|\(\d+\)/i.test(clean)) {
    return clean;
  }

  // Group personal/membership/identity/address fields under Personal Details
  if (/personal|your details|membership|identity|address/i.test(clean)) {
    return "Personal Details";
  }

  // Group bank fields under Bank Details
  if (/bank/i.test(clean)) {
    return "Bank Details";
  }

  // Group work submission fields under Work Submission
  if (/work\s+submission/i.test(clean)) {
    return "Work Submission";
  }

  return clean;
}

function normalizeReviewPayload(data, input, message) {
  const text = extractRawText(message, data);
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let introTitle = data?.title || input?.title || "";
  const sectionMap = new Map();
  let activeSectionTitle = "Personal Details";

  for (const line of lines) {
    if (!introTitle && /check\s+your\s+details|review\s+your\s+details|review\s+all\s+the\s+details/i.test(line)) {
      introTitle = line;
      continue;
    }

    if (line.includes(":") && !line.startsWith("-") && !line.startsWith("*")) {
      const colonIdx = line.indexOf(":");
      const label = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      if (!value) continue;

      if (!sectionMap.has(activeSectionTitle)) {
        sectionMap.set(activeSectionTitle, []);
      }
      sectionMap.get(activeSectionTitle).push({ label, value });
      continue;
    }

    if (line.startsWith("-") || line.startsWith("*")) {
      const value = line.replace(/^[-*•]\s*/, "").trim();
      if (!value) continue;

      if (!sectionMap.has(activeSectionTitle)) {
        sectionMap.set(activeSectionTitle, []);
      }
      sectionMap.get(activeSectionTitle).push({ label: "", value });
      continue;
    }

    activeSectionTitle = getSectionTitle(line);
  }

  const validParsedSections = Array.from(sectionMap.entries())
    .map(([title, fields]) => ({ title, fields }))
    .filter((s) => Array.isArray(s.fields) && s.fields.length > 0);

  const sections =
    validParsedSections.length > 0
      ? validParsedSections
      : Array.isArray(data?.sections) && data.sections.length > 0
      ? data.sections
      : Array.isArray(input?.sections) && input.sections.length > 0
      ? input.sections
      : [];

  let actions = [];
  if (Array.isArray(input?.items) && input.items.length > 0) {
    actions = input.items.map((item) => {
      const label = item.content || item.label || String(item);
      const isPrimary = /yes|correct|pay|confirm/i.test(label);
      return { label, action: label, primary: isPrimary };
    });
  } else if (Array.isArray(data?.actions) && data.actions.length > 0) {
    actions = data.actions;
  } else if (Array.isArray(input?.actions) && input.actions.length > 0) {
    actions = input.actions;
  }

  return {
    introTitle: introTitle || "Please review all your details before proceeding to payment.",
    sections,
    actions,
  };
}

const PaymentReview = ({ data, input, message, onAction }) => {
  const { introTitle, sections, actions } = useMemo(
    () => normalizeReviewPayload(data, input, message),
    [data, input, message]
  );

  if (sections.length === 0 && !introTitle) {
    return null;
  }

  return (
    <div className={styles.container}>
      {introTitle && (
        <div className={styles.introRow}>
          <BotAvatar />
          <div className={styles.introBubble}>{introTitle}</div>
        </div>
      )}

      {sections.map((section, idx) => (
        <div key={`${section.title}-${idx}`} className={styles.sectionRow}>
          <BotAvatar />
          <div className={styles.sectionCard}>
            <div className={styles.headerPill}>{section.title}</div>
            <div className={styles.fieldsList}>
              {(section.fields || []).map((field, fIdx) => (
                <div key={`${field.label}-${field.value}-${fIdx}`} className={styles.fieldRow}>
                  {field.label ? (
                    <>
                      <span className={styles.fieldLabel}>{field.label}: </span>
                      <span className={styles.fieldValue}>{field.value}</span>
                    </>
                  ) : (
                    <span className={styles.fieldValue}>• {field.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {actions.length > 0 && (
        <div className={styles.actionsCard}>
          {actions.map((act, aIdx) => (
            <button
              key={`${act.label}-${aIdx}`}
              type="button"
              className={`${styles.actionButton} ${act.primary ? styles.actionButtonPrimary : ""}`}
              onClick={() => onAction?.(act.action || act.label)}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentReview;
