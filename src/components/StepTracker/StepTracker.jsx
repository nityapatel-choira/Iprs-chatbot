import styles from "./StepTracker.module.css";

const StepTracker = ({ stages, activeIndex, progress = 0 }) => {
  const lastIndex = stages.length - 1;
  const progressFill = Math.max(0, Math.min(100, Number(progress) || 0));
  // A step turns active only once the line reaches it, and the line always reaches the active step.
  const effectiveActiveIndex = Math.max(activeIndex, Math.floor((progressFill / 100) * lastIndex));
  const visualFill = Math.min(100, Math.max(progressFill, (effectiveActiveIndex / lastIndex) * 100));

  return (
    <div className={styles.wrap}>
      <div className={styles.trackContainer}>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${visualFill}%` }} />
        </div>

        <div className={styles.track}>
          {stages.map((stage, i) => {
            const status = i < effectiveActiveIndex ? "completed" : i === effectiveActiveIndex ? "active" : "pending";
            return (
              <div key={stage} className={styles.node}>
                <span
                  className={`${styles.circle} ${styles[status]}`}
                  aria-label={`${stage}${status === "completed" ? " (completed)" : status === "active" ? " (current)" : ""}`}
                  aria-current={status === "active" ? "step" : undefined}
                >
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepTracker;
