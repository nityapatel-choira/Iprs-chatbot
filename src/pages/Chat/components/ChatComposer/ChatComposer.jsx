import { useState } from "react";
import MicIcon from "../../../../components/icons/MicIcon";
import SendIcon from "../../../../components/icons/SendIcon";
import { isValidEmail } from "../../../../utils/validators";
import styles from "./ChatComposer.module.css";

const ChatComposer = ({ onSend, disabled, placeholder, inputMode, type = "text" }) => {
  const [value, setValue] = useState("");

  const isValid = type === "email" ? isValidEmail(value.trim()) : Boolean(value.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className={styles.composerWrap}>
      <form className={styles.composer} onSubmit={handleSubmit}>
        <button type="button" className={styles.micButton} aria-label="Voice input" disabled={disabled}>
          <MicIcon />
        </button>
        <input
          className={styles.composerInput}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          aria-label="Type your message"
        />
        <button type="submit" className={styles.sendButton} disabled={disabled || !isValid} aria-label="Send">
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatComposer;
