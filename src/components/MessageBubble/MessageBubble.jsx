import styles from "./MessageBubble.module.css";
import { formatTime } from "../../utils/formatTime";

export default function MessageBubble({ sender, text, timestamp }) {
  const isBot = sender === "bot";

  return (
    <div className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser}`}>
      <div className={`${styles.bubble} ${isBot ? styles.bot : styles.user}`}>
        {isBot && (
          <span className={styles.verified} title="Verified IPRS response">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
              <path
                d="M12 2 3 6v6c0 5 4 8.5 9 10 5-1.5 9-5 9-10V6l-9-4Z"
                fill="currentColor"
              />
            </svg>
            Verified
          </span>
        )}
        <p className={styles.text}>{text}</p>
        <span className={styles.time}>{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
