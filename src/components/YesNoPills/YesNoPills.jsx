import styles from "./YesNoPills.module.css";

function YesNoPills({ onSelect, disabled }) {
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

export default YesNoPills;
