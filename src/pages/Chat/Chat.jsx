import { useState, useMemo } from "react";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PaymentCard from "../../components/payment/PaymentCard";
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

function Chat({ language = "English", onBack, onLogout, onFinished }) {
  const {
    history,
    input,
    isTyping,
    error,
    sessionEnded,
    uploadStatus,
    uploadProgress,
    uploadError,
    uploadForInputId,
    messagesRef,
    sendAnswer,
    submitFile,
    retry,
  } = useBackendConversation();

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

          {/*
            TODO: confirm with backend - "payment input" isn't in the documented
            conversation contract (only text/email/url/choice/file input are).
            Named to match that contract's "<noun> input" convention so it drops
            in the same way once the real type/payload lands; amount/prefill
            field names below are guesses and should be verified against the
            actual backend response shape.
          */}
          {!isTyping && input?.type === "payment input" && (
            <PaymentCard
              key={input.id}
              amountInRupees={input.amount ? input.amount / 100 : undefined}
              prefill={{ name: input.prefillName, email: input.prefillEmail, contact: input.prefillContact }}
              onComplete={(result) =>
                sendAnswer(result?.paymentId ? `Payment completed (${result.paymentId})` : "Payment completed")
              }
            />
          )}

          {/* Render PaymentCard after the last step (when session has ended) if not paid yet */}
          {!isTyping && sessionEnded && !error && !paymentResult && (
            <PaymentCard
              key="fallback-payment-final"
              amountInRupees={1200}
              prefill={detectedPrefill}
              onComplete={(result) => {
                sessionStorage.setItem("iprs_payment_success", JSON.stringify(result));
                setPaymentResult(result);
                onFinished?.();
              }}
            />
          )}

          {/* If payment completed, show nice message rows and complete state */}
          {sessionEnded && !error && paymentResult && (
            <>
              <MessageRow
                message={{
                  id: "payment-completed-user-msg",
                  sender: "user",
                  kind: "text",
                  text: `Payment completed. Transaction ID: ${paymentResult.paymentId}`,
                }}
              />
              <MessageRow
                message={{
                  id: "payment-completed-bot-msg",
                  sender: "bot",
                  kind: "richText",
                  richText: `Thank you! Your payment of <strong>₹1,200</strong> has been verified. Your application is now complete and under review.`,
                }}
              />
              <p className={styles.sessionEndedNote}>Conversation complete.</p>
            </>
          )}

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button type="button" className={styles.retryButton} onClick={retry}>
                Retry
              </button>
            </div>
          )}
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
