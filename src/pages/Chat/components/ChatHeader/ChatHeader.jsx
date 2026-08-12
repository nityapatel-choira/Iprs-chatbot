import TranslateIcon from "../../../../components/icons/TranslateIcon";
import styles from "./ChatHeader.module.css";

function ChatHeader({ title, language, onBack }) {
  return (
    <header className={styles.header}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back">
          ←
        </button>
      )}
      <h1 className={styles.title}>{title}</h1>
      <span className={styles.langToggle}>
        <TranslateIcon />
        {language}
      </span>
    </header>
  );
}

export default ChatHeader;
