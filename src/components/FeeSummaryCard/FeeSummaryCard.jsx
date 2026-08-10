import styles from "./FeeSummaryCard.module.css";

export default function FeeSummaryCard({ entityLabel, fee, feeCaption, infoText, docsHeading, docsSubtext, docs }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.feeCard}>
        <p className={styles.feeIntro}>You&apos;re applying as an</p>
        <div className={styles.entityChip}>
          <span className={styles.entityLabel}>{entityLabel}</span>
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
              <span className={styles.docLabel}>{doc.label}</span>
              {doc.subtext && <span className={styles.docSub}>{doc.subtext}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
