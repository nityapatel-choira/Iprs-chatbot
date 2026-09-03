import { useMemo } from "react";
import styles from "./CompletionCard.module.css";

function getOrdinalSuffix(day) {
  const v = day % 100;
  if (v >= 11 && v <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatDate(dateObj) {
  const dayStr = getOrdinalSuffix(dateObj.getDate());
  const monthStr = dateObj.toLocaleString("en-US", { month: "long" });
  return `${dayStr} ${monthStr}`;
}

function getApprovalSteps() {
  const now = new Date();

  const d1 = new Date(now);
  const d2 = new Date(now);
  d2.setDate(d2.getDate() + 7);
  const d3 = new Date(now);
  d3.setDate(d3.getDate() + 14);

  return [
    { step: 1, label: "Level 1 Approval", date: formatDate(d1) },
    { step: 2, label: "Level 2 Approval", date: formatDate(d2) },
    { step: 3, label: "Level 3 Approval", date: formatDate(d3) },
  ];
}

const CompletionCard = () => {
  const approvalSteps = useMemo(() => getApprovalSteps(), []);

  return (
    <div className={styles.card}>
      <div className={styles.headerPill}>Approval Timeline</div>

      <div className={styles.timelineList}>
        {approvalSteps.map((item, idx) => {
          const isLast = idx === approvalSteps.length - 1;
          return (
            <div key={item.step} className={styles.timelineItem}>
              <div className={styles.leftCol}>
                <div className={styles.circle}>{item.step}</div>
                {!isLast && <div className={styles.verticalLine} />}
              </div>

              <div className={styles.rightCol}>
                <span className={styles.stepTitle}>{item.label}</span>
                <span className={styles.stepDate}>{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompletionCard;
