import { useState } from "react";
import BottomSheet from "../../../../components/BottomSheet/BottomSheet";
import CheckIcon from "../../../../components/icons/CheckIcon";
import styles from "./DeclarationSheet.module.css";

// Matches Figma's GST/society declaration bottom sheet. Dormant: wired to
// a proposed "declaration input" type the live backend doesn't send yet.
function DeclarationSheet({ open, title = "A couple more things", options, onSubmit, onClose }) {
  const [checked, setChecked] = useState({});

  const toggle = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = () => {
    onSubmit?.(options.filter((opt) => checked[opt.key]));
  };

  return (
    <BottomSheet
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <button type="button" className={styles.continueButton} onClick={handleSubmit}>
          Continue
        </button>
      }
    >
      <div className={styles.list}>
        {options.map((opt) => (
          <button key={opt.key} type="button" className={styles.row} onClick={() => toggle(opt.key)}>
            <span className={`${styles.box} ${checked[opt.key] ? styles.boxChecked : ""}`}>
              {checked[opt.key] && <CheckIcon />}
            </span>
            <span className={styles.label}>{opt.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

export default DeclarationSheet;
