import { useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import LanguageCard from "../../components/LanguageCard/LanguageCard";
import { LANGUAGES } from "../../constants/languages";
import styles from "./LanguageSelection.module.css";
import { t } from "../../i18n";

// Every language in LANGUAGES is selectable. The flow is authored in English and
// translated on the way out by the API (see modules/translation there), so adding a
// language needs no new copy here - only that its code is in the API's
// TRANSLATION_SUPPORTED_LANGUAGES.
const DEFAULT_LANGUAGE_CODE = "en";

const LanguageSelection = ({ onContinue }) => {
  const [selected, setSelected] = useState(DEFAULT_LANGUAGE_CODE);

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
            <h1 className={styles.heading}>{t("Choose your language")}</h1>
            <p className={styles.subtitle}>
              {t("Select the language you'd like to use. You can change it later in settings.")}
            </p>
          </div>

          <div className={styles.grid} role="radiogroup" aria-label={t("Select your language")}>
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
            {t("Continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
