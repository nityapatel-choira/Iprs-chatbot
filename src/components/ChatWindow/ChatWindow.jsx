import { useEffect, useRef } from "react";
import MessageBubble from "../MessageBubble/MessageBubble";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ messages, isTyping }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className={styles.window}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} {...msg} />
      ))}
      {isTyping && (
        <div className={styles.typing} aria-live="polite">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
