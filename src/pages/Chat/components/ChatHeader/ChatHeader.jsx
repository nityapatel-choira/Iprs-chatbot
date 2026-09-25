import TranslateIcon from "../../../../components/icons/TranslateIcon";
import styles from "./ChatHeader.module.css";
import { t } from "../../../../i18n";

const ChatHeader = ({ title, language, onBack, onLogout }) => {
  return (
    <header className={styles.header}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label={t("Back")}>
          ←
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      <span className={styles.langToggle}>
        <TranslateIcon />
        {language}
      </span>
      {onLogout && (
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          {t("Logout")}
        </button>
      )}
    </header>
  );
};

export default ChatHeader;
