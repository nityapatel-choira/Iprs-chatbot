import ProfileIcon from "../icons/ProfileIcon";
import BankIcon from "../icons/BankIcon";
import MusicNoteIcon from "../icons/MusicNoteIcon";
import AgreementIcon from "../icons/AgreementIcon";
import styles from "./StepTracker.module.css";

const ICONS = [ProfileIcon, BankIcon, MusicNoteIcon, AgreementIcon];

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
            const Icon = ICONS[i] || ProfileIcon;
            return (
              <div key={stage} className={styles.node}>
                <span className={`${styles.circle} ${styles[status]}`} aria-hidden="true">
                  <Icon />
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
