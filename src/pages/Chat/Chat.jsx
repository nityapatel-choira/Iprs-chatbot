import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import YesNoPills from "../../components/YesNoPills/YesNoPills";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FileUploader from "../../components/FileUploader/FileUploader";
import StepTracker from "../../components/StepTracker/StepTracker";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import ConsentDialog from "./components/ConsentDialog/ConsentDialog";
import useConversationFlow from "./useConversationFlow";
import { TRACKER_STAGES /*, FINAL_STEP_ID */ } from "./conversationFlow";
import styles from "./Chat.module.css";

function Chat({ language = "English", onBack /*, onFinished */ }) {
  const {
    history,
    stepId,
    isTyping,
    inputVisible,
    trackerIndex,
    consentSheet,
    messagesRef,
    input,
    isTextStep,
    handleQuickReply,
    handleYesNo,
    handleCheckboxSubmit,
    handleFileUploaded,
    handleTextSubmit,
    handleConsentAccept,
    handleConsentBack,
  } = useConversationFlow();

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <ChatHeader title="IPRS Membership Assistant" language={language} onBack={onBack} />

        {trackerIndex !== null && (
          <div className={styles.trackerSlot}>
            <StepTracker stages={TRACKER_STAGES} activeIndex={trackerIndex} />
          </div>
        )}

        <div className={styles.messages} ref={messagesRef}>
          {history.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}

          {isTyping && <TypingIndicator />}

          {inputVisible && (input?.type === "quickReply" || input?.type === "summary") && (
            <QuickReplyCard options={input.options} onSelect={handleQuickReply} />
          )}
          {inputVisible && input?.type === "yesNo" && <YesNoPills onSelect={handleYesNo} />}
          {inputVisible && input?.type === "checkbox" && (
            <CheckboxGroup options={input.options} caption={input.caption} onSubmit={handleCheckboxSubmit} />
          )}
          {inputVisible && input?.type === "fileUpload" && (
            <FileUploader title={input.title} caption={input.caption} onUploaded={handleFileUploaded} />
          )}

          {/* {stepId === FINAL_STEP_ID && !isTyping && onFinished && (
            <QuickReplyCard
              options={[{ label: "Continue to Face Verification" }]}
              onSelect={() => onFinished()}
            />
          )} */}
        </div>

        <ChatComposer
          key={stepId}
          onSend={handleTextSubmit}
          disabled={isTyping || !isTextStep}
          placeholder={isTextStep ? input.placeholder : "Write your message"}
          inputMode={isTextStep ? input.inputMode : "text"}
        />
      </div>

      <ConsentDialog sheet={consentSheet} onAccept={handleConsentAccept} onBack={handleConsentBack} />
    </div>
  );
}

export default Chat;
