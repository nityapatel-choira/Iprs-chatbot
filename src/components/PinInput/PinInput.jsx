import { useState } from "react";
import OtpField from "../OtpField/OtpField";
import styles from "./PinInput.module.css";

const PinInput = ({ length = 4, onComplete, disabled }) => {
  const [value, setValue] = useState("");
  const isComplete = value.length === length;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isComplete || disabled) return;
    onComplete?.(value);
  };

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <OtpField 
        label={null} 
        value={value} 
        onChange={setValue} 
        length={length}
        disabled={disabled} 
      />
      <button type="submit" className={styles.verifyButton} disabled={!isComplete || disabled}>
        Verify
      </button>
    </form>
  );
};

export default PinInput;
