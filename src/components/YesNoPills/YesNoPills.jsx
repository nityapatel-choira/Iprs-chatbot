import styles from "./YesNoPills.module.css";

export default function YesNoPills({ onSelect, disabled }) {
  return (
    <div className={styles.row}>
      {["Yes", "No"].map((label) => (
        <button
          key={label}
          type="button"
          className={styles.pill}
          onClick={() => onSelect(label)}
          disabled={disabled}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
