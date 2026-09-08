import { useEffect, useRef, useState } from "react";
import { sanitizeDigits } from "../../utils/validators";
import styles from "./OtpField.module.css";

const OtpField = ({ label = "One-time code", value = "", onChange, onBlur, error, disabled, length = 4 }) => {
  const [isMobile, setIsMobile] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleChange = (e, index = 0) => {
    const raw = e.target.value;
    const sanitized = sanitizeDigits(raw);

    if (!isMobile) {
      onChange?.(sanitized.slice(0, length));
      return;
    }

    if (!sanitized && raw === "") {
      const next = value.split("");
      next[index] = "";
      onChange?.(next.join(""));
      return;
    }

    const chars = sanitized.split("");
    const nextValue = value.split("").map((c, i) => (i < length ? c : ""));
    
    chars.forEach((char, i) => {
      if (index + i < length) nextValue[index + i] = char;
    });
    
    const finalValue = nextValue.join("").slice(0, length);
    onChange?.(finalValue);

    const nextIndex = Math.min(index + chars.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (isMobile && e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={styles.wrap}>
      {label && (
        <label className={styles.label} htmlFor="otp-input">
          {label}
        </label>
      )}
      
      {!isMobile ? (
        <div className={styles.inputContainer}>
          <input
            id="otp-input"
            className={`${styles.singleInput} ${error ? styles.singleInputError : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            value={value}
            onChange={(e) => handleChange(e)}
            onBlur={onBlur}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "otp-error" : undefined}
          />
        </div>
      ) : (
        <div className={`${styles.boxes} ${error ? styles.boxesError : ""}`}>
          {Array.from({ length }).map((_, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className={`${styles.box} ${value[i] ? styles.boxFilled : ""}`}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={length}
              value={value[i] || ""}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onBlur={onBlur}
              disabled={disabled}
              aria-label={`Digit ${i + 1} of ${length}`}
              aria-invalid={Boolean(error)}
            />
          ))}
        </div>
      )}

      {error && (
        <span id="otp-error" className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default OtpField;
