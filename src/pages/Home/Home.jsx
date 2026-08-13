import ChatWindow from "../../components/ChatWindow/ChatWindow";
import ChatInput from "../../components/ChatInput/ChatInput";
import QuickTopics from "../../components/QuickTopics/QuickTopics";
import useChat from "../../hooks/useChat";
import styles from "./Home.module.css";

function Home() {
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <div className={styles.card}>
      <QuickTopics onSelect={sendMessage} />
      <ChatWindow messages={messages} isTyping={isTyping} />
      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </div>
  );
}

export default Home;
