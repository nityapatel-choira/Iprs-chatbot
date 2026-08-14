import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PaymentCard from "../../components/payment/PaymentCard";
import StepTracker from "../../components/StepTracker/StepTracker";
import { STAGE_LABELS, getStepProgress } from "../../components/StepTracker/stepProgress";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import useBackendConversation from "./useBackendConversation";
import styles from "./Chat.module.css";

// Only these input types render the free-text composer. Everything else
// (choice input, file input, or any future non-text type) must hide it
// entirely rather than just disabling it - the composer should never be
// visible when it isn't the way to answer the current step.
const TEXT_INPUT_CONFIG = {
  "text input": { type: "text", inputMode: "text" },
  "email input": { type: "email", inputMode: "email" },
  "url input": { type: "url", inputMode: "url" },
  "phone input": { type: "tel", inputMode: "tel" },
  "otp input": { type: "text", inputMode: "numeric" },
};

function Chat({ language = "English", onBack, onLogout }) {
  const {
    history,
    input,
    isTyping,
    error,
    sessionEnded,
    progress,
    uploadStatus,
    uploadProgress,
    uploadError,
    uploadForInputId,
    messagesRef,
    sendAnswer,
    submitFile,
    retry,
  } = useBackendConversation();

  const { activeIndex: trackerActiveIndex, currentFill: trackerFill } = getStepProgress(progress);

  // Load payment result from sessionStorage if already paid in this session
  const [paymentResult, setPaymentResult] = useState(() => {
    try {
      const stored = sessionStorage.getItem("iprs_payment_success");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Automatically detect email and phone number from chat history for checkout prefill
  const detectedPrefill = useMemo(() => {
    let email = "";
    let contact = "";
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.sender === "user" && msg.text) {
        const val = msg.text.trim();
        if (!email && val.includes("@") && val.includes(".")) {
          email = val;
        }
        if (!contact && /^\+?[0-9]{10,12}$/.test(val.replace(/[\s-]/g, ""))) {
          contact = val;
        }
      }
    }
    return { email, contact };
  }, [history]);

  const textConfig = input?.type ? TEXT_INPUT_CONFIG[input.type] : null;
  const isTextStep = Boolean(textConfig) && !isTyping;
  const showComposer = Boolean(textConfig);

  // input.id is the source of truth for which file-input step the upload
  // state belongs to: once the backend moves on to a new file-input (a new
  // id), any success/error/progress left over from the previous one is
  // stale and must render as a fresh, idle uploader - regardless of exactly
  // when that state was set.
  const isUploadForCurrentInput = input?.type === "file input" && uploadForInputId === input.id;
  const effectiveUploadStatus = isUploadForCurrentInput ? uploadStatus : "idle";
  const effectiveUploadProgress = isUploadForCurrentInput ? uploadProgress : 0;
  const effectiveUploadError = isUploadForCurrentInput ? uploadError : "";

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <ChatHeader title="IPRS Membership Assistant" language={language} onBack={onBack} onLogout={onLogout} />

        {!sessionEnded && (
          <div className={styles.trackerSlot}>
            <StepTracker stages={STAGE_LABELS} activeIndex={trackerActiveIndex} currentFill={trackerFill} />
          </div>
        )}

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
              key={input.id}
              title={input.title || "Choose a file or drag & drop it here"}
              caption={input.caption || "JPEG, PNG, PDF, and MP4 formats, up to 50MB"}
              onFileSelected={submitFile}
              status={effectiveUploadStatus}
              progress={effectiveUploadProgress}
              errorMessage={effectiveUploadError}
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

        {showComposer && (
          <ChatComposer
            key={input.id}
            onSend={sendAnswer}
            disabled={isTyping || !isTextStep}
            placeholder="Write your message"
            inputMode={textConfig.inputMode}
            type={textConfig.type}
          />
        )}
      </div>
    </div>
  );
}

export default Chat;
