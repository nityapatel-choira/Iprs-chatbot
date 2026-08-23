import CheckIcon from "../icons/CheckIcon";
import styles from "./VerifiedFieldChip.module.css";

// Shown next to PAN/Aadhaar/bank fields once DigiLocker or bank
// verification succeeds. Dormant: the live backend has no per-field
// verified flag yet - only renders where a caller explicitly passes
// verified data.
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
