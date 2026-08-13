import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import useBackendConversation from "./useBackendConversation";
import styles from "./Chat.module.css";

const TEXT_INPUT_CONFIG = {
  "text input": { type: "text", inputMode: "text" },
  "email input": { type: "email", inputMode: "email" },
  "url input": { type: "url", inputMode: "url" },
};

function Chat({ language = "English", onBack, onLogout }) {
  const {
    history,
    input,
    isTyping,
    error,
    sessionEnded,
    uploadStatus,
    uploadProgress,
    uploadError,
    messagesRef,
    sendAnswer,
    submitFile,
    retry,
  } = useBackendConversation();

  const textConfig = input?.type ? TEXT_INPUT_CONFIG[input.type] : null;
  const isTextStep = Boolean(textConfig) && !isTyping;

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <ChatHeader title="IPRS Membership Assistant" language={language} onBack={onBack} onLogout={onLogout} />

        <div className={styles.messages} ref={messagesRef}>
          {history.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}

          {!isTyping && input?.type === "choice input" && (
            <QuickReplyCard
              options={(input.items || []).map((item) => ({ label: item.content }))}
              onSelect={(option) => sendAnswer(option.label)}
            />
          )}

          {!isTyping && input?.type === "file input" && (
            <FileUploader
              title="Upload file"
              caption="JPEG, PNG or PDF"
              onFileSelected={submitFile}
              status={uploadStatus}
              progress={uploadProgress}
              errorMessage={uploadError}
            />
          )}

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button type="button" className={styles.retryButton} onClick={retry}>
                Retry
              </button>
            </div>
          )}

          {sessionEnded && !error && <p className={styles.sessionEndedNote}>Conversation complete.</p>}
        </div>

        <ChatComposer
          key={input?.id || "composer"}
          onSend={sendAnswer}
          disabled={isTyping || !isTextStep}
          placeholder="Write your message"
          inputMode={textConfig?.inputMode || "text"}
          type={textConfig?.type || "text"}
        />
      </div>
    </div>
  );
}

export default Chat;
