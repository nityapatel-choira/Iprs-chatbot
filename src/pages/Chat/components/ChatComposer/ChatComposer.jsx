import { useState } from "react";
import MicIcon from "../../../../components/icons/MicIcon";
import SendIcon from "../../../../components/icons/SendIcon";
import { isValidEmail, isValidGstin, sanitizeGstin } from "../../../../utils/validators";
import styles from "./ChatComposer.module.css";

const ChatComposer = ({ onSend, disabled, placeholder, inputMode, type = "text" }) => {
  const [value, setValue] = useState("");

  const isGstinType = type === "gstin";

  const isValid =
    type === "email"
      ? isValidEmail(value.trim())
      : isGstinType
        ? isValidGstin(value)
        : Boolean(value.trim());

  const handleChange = (e) => {
    setValue(isGstinType ? sanitizeGstin(e.target.value) : e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className={styles.composerWrap}>
      {isGstinType && (
        <p
          className={styles.inputError}
          role="alert"
          style={{ visibility: value && !isValid ? "visible" : "hidden" }}
        >
          Invalid GSTIN format. Example: 22AAAAA0000A1Z5
        </p>
      )}
      <form className={styles.composer} onSubmit={handleSubmit}>
        <button type="button" className={styles.micButton} aria-label="Voice input" disabled={disabled}>
          <MicIcon />
        </button>
        <input
          className={styles.composerInput}
          type={isGstinType ? "text" : type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label="Type your message"
          maxLength={isGstinType ? 15 : undefined}
        />
        <button type="submit" className={styles.sendButton} disabled={disabled || !isValid} aria-label="Send">
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatComposer;
