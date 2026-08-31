import BotAvatar from "../BotAvatar/BotAvatar";
import styles from "../../Chat.module.css";

const TypingIndicator = () => {
  return (
    <div className={`${styles.row} ${styles.rowBot}`}>
      <BotAvatar />
      <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typing}`} aria-live="polite">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
};

export default TypingIndicator;
