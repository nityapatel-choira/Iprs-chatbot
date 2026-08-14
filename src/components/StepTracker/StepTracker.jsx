import { useMemo } from "react";
import ProfileIcon from "../icons/ProfileIcon";
import BankIcon from "../icons/BankIcon";
import MusicNoteIcon from "../icons/MusicNoteIcon";
import AgreementIcon from "../icons/AgreementIcon";
import styles from "./StepTracker.module.css";

/* Icon glyphs traced from Figma's icon/essential/profile, icon/payment/netbanking,
   icon/category/music and icon/profile_page_only/agreement components. */
const ICONS = [ProfileIcon, BankIcon, MusicNoteIcon, AgreementIcon];

// currentFill (0-100) is how far progress has advanced through the active
// stage's own range - it drives the active connector's fill width directly,
// so the bar always reflects the real backend percentage rather than a
// fixed "halfway" guess.
function StepTracker({ stages, activeIndex, currentFill = 0 }) {
  const totalPercent = useMemo(() => {
    if (stages.length <= 1) return 0;
    const pct = ((activeIndex + currentFill / 100) / (stages.length - 1)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }, [stages.length, activeIndex, currentFill]);

  return (
    <div className={styles.wrap}>
      <div className={styles.trackContainer}>
        {/* Horizontal progress bar line behind the circles */}
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
}

export default StepTracker;
