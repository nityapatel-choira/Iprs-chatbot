import { useState } from "react";
import styles from "./AadhaarField.module.css";

const AadhaarField = ({
  caption = "DigiLocker verifies your identity with Aadhaar to provide secure document access",
  onSubmit,
  disabled,
}) => {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = /^\d{12}$/.test(value);
  const error = touched && value.length > 0 && !isValid ? "Enter a valid 12-digit Aadhaar number" : "";

  const handleChange = (raw) => setValue(raw.replace(/\D/g, "").slice(0, 12));

  const handleSubmit = (e) => {
    e?.preventDefault();
    setTouched(true);
    if (!isValid || disabled) return;
    onSubmit?.(value);
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
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
      <button type="submit" className={styles.submitButton} disabled={!isValid || disabled}>
        Continue
      </button>
    </form>
  );
};

export default AadhaarField;
