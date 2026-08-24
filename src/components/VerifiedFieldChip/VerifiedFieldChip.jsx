import CheckIcon from "../icons/CheckIcon";
import styles from "./VerifiedFieldChip.module.css";

// Matches Figma's icon/essential/success "Verified" state shown next to
// verified fields once verification succeeds.
// Dormant: the live backend has no per-field verified flag yet (see the
// plan) - this only renders where a caller explicitly passes verified data.
function VerifiedFieldChip({ label }) {
  return (
    <span className={styles.chip}>
      <span className={styles.icon}>
        <CheckIcon />
      </span>
      Verified
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}

export default VerifiedFieldChip;
