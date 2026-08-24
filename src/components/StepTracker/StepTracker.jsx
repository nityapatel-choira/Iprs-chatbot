import { useMemo } from "react";
import ProfileIcon from "../icons/ProfileIcon";
import BankIcon from "../icons/BankIcon";
import MusicNoteIcon from "../icons/MusicNoteIcon";
import AgreementIcon from "../icons/AgreementIcon";
import styles from "./StepTracker.module.css";

const ICONS = [ProfileIcon, BankIcon, MusicNoteIcon, AgreementIcon];

const StepTracker = ({ stages, activeIndex, currentFill = 0 }) => {
  const totalPercent = useMemo(() => {
    if (stages.length <= 1) return 0;
    const pct = ((activeIndex + currentFill / 100) / (stages.length - 1)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }, [stages.length, activeIndex, currentFill]);

  return (
    <div className={styles.wrap}>
      <div className={styles.trackContainer}>
        <div className={styles.progressBarBg}>
          <div className={styles.progressBarFill} style={{ width: `${totalPercent}%` }} />
        </div>

        <div className={styles.track}>
          {stages.map((stage, i) => {
            const status = i < activeIndex ? "completed" : i === activeIndex ? "active" : "pending";
            const Icon = ICONS[i] || ProfileIcon;
            return (
              <div key={stage} className={styles.node}>
                <span className={`${styles.circle} ${styles[status]}`} aria-hidden="true">
                  <Icon />
                </span>
                <div className={styles.textCol}>
                  <span className={styles.stepNum}>{`STEP ${i + 1}`}</span>
                  <span className={styles.stageName}>{stage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepTracker;
