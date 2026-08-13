import FeeSummaryCard from "../../../../components/FeeSummaryCard/FeeSummaryCard";
import RichText from "../../../../components/RichText/RichText";
import BotAvatar from "../BotAvatar/BotAvatar";
import FileMessageCard from "../FileMessageCard/FileMessageCard";
import styles from "../../Chat.module.css";

function MessageRow({ message }) {
  const isUser = message.sender === "user";

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
      {!isUser && message.kind !== "summaryCard" && <BotAvatar />}
      {message.kind === "summaryCard" ? (
        <FeeSummaryCard {...message.data} />
      ) : message.kind === "file" ? (
        <FileMessageCard
          fileName={message.fileName}
          fileSize={message.fileSize}
          previewUrl={message.previewUrl}
          mimeType={message.rawFile?.type || message.mimeType}
          rawFile={message.rawFile}
          status={message.status}
        />
      ) : message.kind === "richText" ? (
        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}>
          <RichText nodes={message.richText} />
        </div>
      ) : (
        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}>{message.text}</div>
      )}
    </div>
  );
}

export default MessageRow;
