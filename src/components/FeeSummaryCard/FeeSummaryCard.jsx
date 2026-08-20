import { useState } from "react";
import CheckIcon from "../icons/CheckIcon";
import styles from "./FeeSummaryCard.module.css";

// Two optional footer variants, matching the two Figma frame families:
// - `options`: entity_selected/document_list ("Start Application" /
//   "Change my previous answers" stacked buttons).
// - `confirmLabel`+`onConfirm`: fee_2/fee_4 (checkbox confirmation + single
//   CTA, gated on the box being ticked).
// Neither is required - existing callers with none of these props keep
// rendering exactly as before.
function FeeSummaryCard({
  entityLabel,
  fee,
  feeCaption,
  infoText,
  docsHeading,
  docsSubtext,
  docs,
  options,
  onOptionSelect,
  confirmLabel,
  onConfirm,
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className={styles.wrap}>
      <div className={styles.outerCard}>
        <p className={styles.feeIntro}>You&apos;re applying as an</p>
        <div className={styles.feeCard}>
          <span className={styles.entityLabel}>{entityLabel}</span>
          <div className={styles.amountGroup}>
            <span className={styles.feeAmount}>{fee}</span>
            <span className={styles.feeCaption}>{feeCaption}</span>
          </div>
          <p className={styles.infoPill}>{infoText}</p>
        </div>

        {docsHeading && (
          <div className={styles.docCard}>
            <h3 className={styles.docHeading}>{docsHeading}</h3>
            <p className={styles.docSubtext}>{docsSubtext}</p>
            <ul className={styles.docList}>
              {docs.map((doc) => (
                <li key={doc.label} className={styles.docRow}>
                  <span className={styles.docCheck} aria-hidden="true">
                    <CheckIcon />
                  </span>
                  <span className={styles.docTextCol}>
                    <span className={styles.docLabel}>{doc.label}</span>
                    {doc.subtext && <span className={styles.docSub}>{doc.subtext}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {options && options.length > 0 && (
        <div className={styles.optionList}>
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              className={option.primary === false ? styles.optionButtonSecondary : styles.optionButtonPrimary}
              onClick={() => onOptionSelect?.(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {confirmLabel && (
        <div className={styles.confirmRow}>
          <button
            type="button"
            className={styles.confirmCheckboxRow}
            onClick={() => setConfirmed((prev) => !prev)}
          >
            <span className={`${styles.confirmBox} ${confirmed ? styles.confirmBoxChecked : ""}`}>
              {confirmed && <CheckIcon />}
            </span>
            <span className={styles.confirmLabel}>{confirmLabel}</span>
          </button>
          <button
            type="button"
            className={styles.optionButtonPrimary}
            disabled={!confirmed}
            onClick={() => onConfirm?.()}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

export default FeeSummaryCard;
