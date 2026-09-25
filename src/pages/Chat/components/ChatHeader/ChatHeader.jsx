import { useEffect, useRef, useState } from "react";
import TranslateIcon from "../../../../components/icons/TranslateIcon";
import { LANGUAGES } from "../../../../constants/languages";
import styles from "./ChatHeader.module.css";
import { t } from "../../../../i18n";

const ChatHeader = ({ title, language, languageCode, onBack, onLogout, onChangeLanguage }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // The menu floats over the chat with no backdrop behind it, so closing it on a
  // tap elsewhere (or Escape) has to be handled here.
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const closeOnEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const choose = (code) => {
    setOpen(false);
    if (code !== languageCode) onChangeLanguage?.(code);
  };

  return (
    <header className={styles.header}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label={t("Back")}>
          ←
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.langWrap} ref={wrapRef}>
        <button
          type="button"
          className={styles.langToggle}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("Change language")}
        >
          <TranslateIcon />
          {language}
          <span className={styles.caret} aria-hidden="true">▾</span>
        </button>

        {open && (
          <ul className={styles.langMenu} role="menu">
            {LANGUAGES.map((lang) => (
              <li key={lang.code} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={lang.code === languageCode}
                  className={lang.code === languageCode ? `${styles.langOption} ${styles.langOptionActive}` : styles.langOption}
                  onClick={() => choose(lang.code)}
                >
                  {/* The native name stays in its own script on purpose: it is how a
                      member who cannot read the current language finds their own. */}
                  <span className={styles.langNative}>{lang.native}</span>
                  <span className={styles.langName}>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {onLogout && (
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          {t("Logout")}
        </button>
      )}
    </header>
  );
};

export default ChatHeader;
