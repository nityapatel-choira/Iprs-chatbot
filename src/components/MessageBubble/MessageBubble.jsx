import ShieldIcon from "../icons/ShieldIcon";
import styles from "./MessageBubble.module.css";
import formatTime from "../../utils/formatTime";

function MessageBubble({ sender, text, timestamp }) {
  const isBot = sender === "bot";

  return (
    <div className={`${styles.row} ${isBot ? styles.rowBot : styles.rowUser}`}>
      <div className={`${styles.bubble} ${isBot ? styles.bot : styles.user}`}>
        {isBot && (
          <span className={styles.verified} title="Verified IPRS response">
            <ShieldIcon width={12} height={12} variant="filled" />
            Verified
          </span>
        )}
        <p className={styles.text}>{text}</p>
        <span className={styles.time}>{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}

export default MessageBubble;
