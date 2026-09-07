import styles from "./OtpField.module.css";

const OtpField = ({ label = "One-time code", value = "", onChange, onBlur, error, disabled }) => {
  const currentVal = value || "";
  const activeIndex = Math.min(currentVal.length, 3);

  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="otp-input">
        {label}
      </label>
      <div className={styles.inputContainer}>
        <input
          id="otp-input"
          className={styles.hiddenInput}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "otp-error" : undefined}
        />
        <div className={`${styles.boxes} ${error ? styles.boxesError : ""}`} aria-hidden="true">
          {[0, 1, 2, 3].map((index) => {
            const char = currentVal[index] || "";
            const isActive = index === activeIndex;
            return (
              <div
                key={index}
                className={`${styles.box} ${char ? styles.boxFilled : ""} ${isActive ? styles.boxActive : ""}`}
              >
                {char || <span className={styles.placeholder}>-</span>}
              </div>
            );
          })}
        </div>
      </div>
      {error && (
        <span id="otp-error" className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default OtpField;
