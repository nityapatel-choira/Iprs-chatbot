import { useState } from "react";
import CheckIcon from "../icons/CheckIcon";
import styles from "./CheckboxGroup.module.css";

const CheckboxGroup = ({ options, caption, onSubmit, disabled }) => {
  const [checked, setChecked] = useState({});

  const toggle = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasSelection = Object.values(checked).some(Boolean);

  const safeOptions = options || [];

  const handleSubmit = () => {
    if (!hasSelection || disabled) return;
    onSubmit?.(safeOptions.filter((opt) => checked[opt.key]));
  };

  return (
    <div className={styles.card} role="group" aria-label="Selection options">
      {safeOptions.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="checkbox"
          aria-checked={Boolean(checked[opt.key])}
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
};

export default CheckboxGroup;
