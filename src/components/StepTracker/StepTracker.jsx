import CheckIcon from "../icons/CheckIcon";
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
            // A number says where you are in a way four small icons could not:
            // nothing about a bank or a music note tells you it is step 2 of 4,
            // or how many are left. A finished step keeps a tick instead, because
            // a number on its own cannot show that it is behind you.
            return (
              <div key={stage} className={styles.node}>
                <span
                  className={`${styles.circle} ${styles[status]}`}
                  aria-current={status === "active" ? "step" : undefined}
                  title={stage}
                >
                  {status === "completed" ? (
                    <CheckIcon />
                  ) : (
                    <span className={styles.stepNumber}>{i + 1}</span>
                  )}
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
