import { useState } from "react";
import styles from "./CheckboxGroup.module.css";

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 10" width="12" height="10" fill="none" aria-hidden="true">
      <path d="M1 5 4.5 8.5 11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckboxGroup({ options, caption, onSubmit, disabled }) {
  const [checked, setChecked] = useState({});

  const toggle = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSelection = Object.values(checked).some(Boolean);

  const handleSubmit = () => {
    if (!hasSelection || disabled) return;
    onSubmit(options.filter((opt) => checked[opt.key]));
  };

  return (
    <div className={styles.card}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={styles.row}
          onClick={() => toggle(opt.key)}
          disabled={disabled}
        >
          <span className={`${styles.box} ${checked[opt.key] ? styles.boxChecked : ""}`}>
            {checked[opt.key] && <CheckIcon />}
          </span>
          <span className={styles.label}>{opt.label}</span>
        </button>
      ))}

      {caption && <p className={styles.caption}>{caption}</p>}

      <button
        type="button"
        className={styles.submit}
        onClick={handleSubmit}
        disabled={!hasSelection || disabled}
      >
        Submit
      </button>
    </div>
  );
}
