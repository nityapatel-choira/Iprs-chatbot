import { useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import styles from "./LanguageSelection.module.css";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
];

function LanguageCard({ name, native, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
      onClick={onSelect}
    >
      <span className={styles.cardName}>{name}</span>
      <span className={styles.cardNative}>{native}</span>
    </button>
  );
}

export default function LanguageSelection({ onContinue }) {
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    onContinue?.(selected);
  };

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.headerBar} aria-hidden="true" />

        <div className={styles.content}>
          <img src={iprsLogo} alt="IPRS" className={styles.logo} />

          <div className={styles.textGroup}>
            <h1 className={styles.heading}>Welcome · स्वागत · સ્વાગત</h1>
            <p className={styles.subtitle}>
              Become an IPRS member from your phone, in your language, at your pace.
            </p>
          </div>

          <div className={styles.grid} role="radiogroup" aria-label="Select your language">
            {LANGUAGES.map((lang) => (
              <LanguageCard
                key={lang.code}
                name={lang.name}
                native={lang.native}
                selected={selected === lang.code}
                onSelect={() => setSelected(lang.code)}
              />
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.continueButton}
            disabled={!selected}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
