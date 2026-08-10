import styles from "./StepTracker.module.css";

const STATUS_LABEL = {
  completed: "Completed",
  "in-progress": "In Progress",
  pending: "Pending",
};

export default function StepTracker({ stages, activeIndex }) {
  return (
    <div className={styles.card}>
      <div className={styles.track}>
        {stages.map((stage, i) => {
          const status = i < activeIndex ? "completed" : i === activeIndex ? "in-progress" : "pending";
          return (
            <div key={stage} className={styles.stage}>
              <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />
              {i < stages.length - 1 && <span className={styles.line} />}
            </div>
          );
        })}
      </div>
      <div className={styles.labels}>
        {stages.map((stage, i) => {
          const status = i < activeIndex ? "completed" : i === activeIndex ? "in-progress" : "pending";
          return (
            <div key={stage} className={styles.labelGroup}>
              <span className={styles.stepNum}>{`STEP ${i + 1}`}</span>
              <span className={styles.stageName}>{stage}</span>
              <span className={`${styles.badge} ${styles[status]}`}>{STATUS_LABEL[status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
