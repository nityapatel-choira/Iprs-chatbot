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
  return (
    <div className={styles.wrap}>
      <div className={styles.track}>
        {stages.map((stage, i) => {
          const status = i < activeIndex ? "completed" : i === activeIndex ? "active" : "pending";
          const fillPercent = i < activeIndex ? 100 : i === activeIndex ? currentFill : 0;
          const Icon = ICONS[i] || ProfileIcon;
          return (
            <div key={stage} className={`${styles.node} ${i === stages.length - 1 ? styles.nodeLast : ""}`}>
              <div className={styles.iconRow}>
                <span className={`${styles.circle} ${styles[status]}`} aria-hidden="true">
                  <Icon />
                </span>
                {i < stages.length - 1 && (
                  <div className={styles.connectorWrap}>
                    <span className={styles.connectorLine} style={{ width: `${fillPercent}%` }} />
                  </div>
                )}
              </div>
              <div className={styles.textCol}>
                <span className={styles.stepNum}>{`STEP ${i + 1}`}</span>
                <span className={styles.stageName}>{stage}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepTracker;
