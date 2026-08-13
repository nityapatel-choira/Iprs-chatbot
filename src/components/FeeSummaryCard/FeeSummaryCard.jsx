import CheckIcon from "../icons/CheckIcon";
import styles from "./FeeSummaryCard.module.css";

function FeeSummaryCard({ entityLabel, fee, feeCaption, infoText, docsHeading, docsSubtext, docs }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.feeIntro}>You&apos;re applying as an</p>
      <div className={styles.outerCard}>
        <div className={styles.feeCard}>
          <span className={styles.entityLabel}>{entityLabel}</span>
          <div className={styles.amountGroup}>
            <span className={styles.feeAmount}>{fee}</span>
            <span className={styles.feeCaption}>{feeCaption}</span>
          </div>
          <p className={styles.infoPill}>{infoText}</p>
        </div>

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
      </div>
    </div>
  );
}

export default FeeSummaryCard;
