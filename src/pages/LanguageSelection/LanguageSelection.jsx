import { useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import LanguageCard from "../../components/LanguageCard/LanguageCard";
import { LANGUAGES } from "../../constants/languages";
import styles from "./LanguageSelection.module.css";

const ENABLED_LANGUAGE_CODE = "en";

function LanguageSelection({ onContinue }) {
  const [selected, setSelected] = useState(ENABLED_LANGUAGE_CODE);

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
            <h1 className={styles.heading}>Choose your language</h1>
            <p className={styles.subtitle}>
              Select the language you&apos;d like to use. You can change it later in settings.
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
                disabled={lang.code !== ENABLED_LANGUAGE_CODE}
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

export default LanguageSelection;
