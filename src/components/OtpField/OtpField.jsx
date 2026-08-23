import styles from "./OtpField.module.css";

const OtpField = ({ label = "One-time code", value, onChange, onBlur, error, disabled }) => {
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="otp-input">
        {label}
      </label>
      <input
        id="otp-input"
        className={`${styles.input} ${error ? styles.inputError : ""}`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="1234"
        maxLength={4}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "otp-error" : undefined}
      />
      {error && (
        <span id="otp-error" className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default OtpField;
