import FeeSummaryCard from "../../../../components/FeeSummaryCard/FeeSummaryCard";
import RichText from "../../../../components/RichText/RichText";
import VerifiedFieldChip from "../../../../components/VerifiedFieldChip/VerifiedFieldChip";
import BotAvatar from "../BotAvatar/BotAvatar";
import FileMessageCard from "../FileMessageCard/FileMessageCard";
import { extractMessageText } from "../../../../store/slices/conversationSlice";
import styles from "../../Chat.module.css";

const MessageRow = ({ message }) => {
  const isUser = message.sender === "user";
  const bubbleClassName = `${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`;

  if (!isUser && message.kind === "richText" && !extractMessageText(message)) {
    return null;
  }

  const renderContent = () => {
    if (message.kind === "summaryCard") {
      return <FeeSummaryCard {...message.data} />;
    }

    if (message.verified) {
      return (
        <div className={`${styles.verifiedRow} ${isUser ? styles.verifiedRowUser : ""}`}>
          <div className={bubbleClassName}>{message.text}</div>
          <VerifiedFieldChip label={message.verifiedLabel} />
        </div>
      );
    }

    if (message.kind === "file") {
      return (
        <FileMessageCard
          fileName={message.fileName}
          fileSize={message.fileSize}
          previewUrl={message.previewUrl}
          mimeType={message.rawFile?.type || message.mimeType}
          rawFile={message.rawFile}
          status={message.status}
        />
      );
    }

    if (message.kind === "richText") {
      return (
        <div className={bubbleClassName}>
          <RichText nodes={message.richText} />
        </div>
      );
    }

    return <div className={bubbleClassName}>{message.text}</div>;
  };

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
      {!isUser && message.kind !== "summaryCard" && <BotAvatar />}
      {renderContent()}
    </div>
  );
};

export default MessageRow;
