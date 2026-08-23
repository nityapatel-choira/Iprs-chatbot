import CheckIcon from "../icons/CheckIcon";
import styles from "./VerifiedFieldChip.module.css";

// Shown once DigiLocker/bank verification succeeds. Dormant - backend has
// no per-field verified flag yet.
const VerifiedFieldChip = ({ label }) => {
  return (
    <span className={styles.chip}>
      <span className={styles.icon}>
        <CheckIcon />
      </span>
      Verified
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
};

export default VerifiedFieldChip;
