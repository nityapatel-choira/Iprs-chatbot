import { useRef, useState } from "react";
import styles from "./PinInput.module.css";

const PLACEHOLDER_DIGITS = "1234";

const PinInput = ({ length = 4, onComplete, disabled }) => {
  const [digits, setDigits] = useState(() => Array(length).fill(""));
  const inputRefs = useRef([]);

  const code = digits.join("");
  const isComplete = code.length === length;

  const focusIndex = (index) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index, raw) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      const chars = value.split("");
      for (let i = 0; i < chars.length && index + i < length; i += 1) {
        next[index + i] = chars[i];
      }
      return next;
    });

    const nextIndex = Math.min(index + value.length, length - 1);
    focusIndex(nextIndex);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      pasted.split("").forEach((char, i) => {
        next[i] = char;
      });
      return next;
    });
    focusIndex(Math.min(pasted.length, length - 1));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isComplete || disabled) return;
    onComplete?.(code);
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.boxes} onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            className={styles.box}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            placeholder={PLACEHOLDER_DIGITS[index] || ""}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
      <button type="submit" className={styles.verifyButton} disabled={!isComplete || disabled}>
        Verify
      </button>
    </form>
  );
};

export default PinInput;
