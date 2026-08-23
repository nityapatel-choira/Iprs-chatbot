import { useState } from "react";
import styles from "./AadhaarField.module.css";

// Wired into Chat.jsx as a progressive enhancement over the generic text
// composer when the backend's placeholder/label identifies the step as
// Aadhaar - see the "text input" case in Chat.jsx for that heuristic.
function AadhaarField({
  caption = "DigiLocker verifies your identity with Aadhaar to provide secure document access",
  onSubmit,
  disabled,
}) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = /^\d{12}$/.test(value);
  const error = touched && value.length > 0 && !isValid ? "Enter a valid 12-digit Aadhaar number" : "";

  const handleChange = (raw) => setValue(raw.replace(/\D/g, "").slice(0, 12));

  const handleSubmit = () => {
    setTouched(true);
    if (!isValid || disabled) return;
    onSubmit?.(value);
  };

  return (
    <div className={styles.card}>
      <label className={styles.label} htmlFor="aadhaar-input">
        Aadhaar number
      </label>
      <input
        id="aadhaar-input"
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="XXXX XXXX XXXX"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      )}
      <p className={styles.caption}>{caption}</p>
      <button type="button" className={styles.submitButton} onClick={handleSubmit} disabled={!isValid || disabled}>
        Continue
      </button>
    </div>
  );
}

export default AadhaarField;
