// import { useState } from "react";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PinInput from "../../components/PinInput/PinInput";
import AadhaarField from "../../components/AadhaarField/AadhaarField";
import CompletionCard from "./components/CompletionCard/CompletionCard";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FeeSummaryCard from "../../components/FeeSummaryCard/FeeSummaryCard";
import DocumentScanCard from "../../components/DocumentScanCard/DocumentScanCard";
import PassportPhotoCard from "./components/PassportPhotoCard/PassportPhotoCard";
import ConsentDialog from "./components/ConsentDialog/ConsentDialog";
import DeclarationSheet from "./components/DeclarationSheet/DeclarationSheet";
// import PaymentCard from "../../components/payment/PaymentCard";
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
};

function Chat({ language = "English", onBack, onLogout /*, onFinished */ }) {
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
  // Once the session has ended (registration complete - whether reached
  // live or restored on refresh, both set the same `sessionEnded` flag),
  // the tracker should show every stage as completed rather than disappear.
  // Passing an index one past the last stage marks all of them "completed"
  // via the tracker's own existing `i < activeIndex` logic - no new status
  // type needed.
  const displayActiveIndex = sessionEnded ? STAGE_LABELS.length : trackerActiveIndex;
  const displayFill = sessionEnded ? 100 : trackerFill;

  /*
  // Load payment result from sessionStorage if already paid in this session
  const [paymentResult] = useState(() => {
    try {
      const stored = sessionStorage.getItem("iprs_payment_success");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  */

  /*
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
  */

  // The backend's "text input" type is generic (mobile number, name, email,
  // Aadhaar - anything typed) and carries no sub-type of its own, only a
  // human-readable placeholder/title. Sniffing that label is the only way to
  // opt a specific known field into a nicer widget (Figma's boxed Aadhaar
  // field) without inventing a new input.type the backend doesn't send -
  // the backend still fully owns copy, ordering and progression either way.
  const isAadhaarStep =
    input?.type === "text input" && /aadhaar|aadhar/i.test(`${input.placeholder || ""} ${input.title || ""}`);

  // Same label-sniffing approach as isAadhaarStep above: the backend's
  // "file input" type is otherwise generic (PAN, bank proof, address
  // proof, passport photo - anything file-based), so opting the passport
  // photo step into the face-scan/upload choice (instead of the plain
  // FileUploader every other file-input step uses) means matching its
  // title/caption rather than inventing a new input.type the backend
  // doesn't send.
  const isPassportPhotoStep =
    input?.type === "file input" && /passport.{0,20}photo|photo.{0,20}passport/i.test(`${input.title || ""} ${input.caption || ""}`);

  const textConfig = input?.type ? TEXT_INPUT_CONFIG[input.type] : null;
  const isTextStep = Boolean(textConfig) && !isTyping;
  const showComposer = Boolean(textConfig) && !isAadhaarStep;

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

        <div className={styles.trackerSlot}>
          <StepTracker stages={STAGE_LABELS} activeIndex={displayActiveIndex} currentFill={displayFill} />
        </div>

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

          {!isTyping && input?.type === "otp input" && (
            <PinInput key={input.id} onComplete={sendAnswer} />
          )}

          {!isTyping && isAadhaarStep && <AadhaarField key={input.id} onSubmit={sendAnswer} />}

          {/*
            TODO: none of the four cases below (checkbox/summary/document/
            declaration input) are in the documented conversation contract
            today - only choice/file/text-family/otp are. Named to match
            that contract's "<noun> input" convention (mirroring the
            pre-existing "payment input" TODO below) so each drops in the
            moment the backend actually sends it; type names and payload
            shapes are our best guess from Figma + the old mock's STEPS
            data and should be confirmed with backend before relying on
            them. Until then these branches are unreachable in production -
            see devMocks.js for how to exercise them locally.
          */}
          {!isTyping && input?.type === "checkbox input" && (
            <CheckboxGroup
              options={input.options || []}
              caption={input.caption}
              onSubmit={(selected) => sendAnswer(selected.map((opt) => opt.label).join(", "))}
            />
          )}

          {!isTyping && input?.type === "summary input" && (
            <FeeSummaryCard
              {...input.data}
              onOptionSelect={(option) => sendAnswer(option.label)}
              onConfirm={() => sendAnswer(input.data?.confirmLabel || "Confirmed")}
            />
          )}

          {!isTyping && input?.type === "document input" && (
            <DocumentScanCard
              key={input.id}
              title={input.title}
              caption={input.caption}
              onCapture={() => sendAnswer("Document captured")}
            />
          )}

          {!isTyping && input?.type === "file input" && isPassportPhotoStep && (
            <PassportPhotoCard
              key={input.id}
              title={input.title}
              caption={input.caption}
              onFileSelected={submitFile}
            />
          )}

          {!isTyping && input?.type === "file input" && !isPassportPhotoStep && (
            <FileUploader
              key={input.id}
              title={input.title || "Choose a file or drag & drop it here"}
              caption={input.caption || "JPEG and PDF formats, up to 2MB"}
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
          {/* Payment gateway commented out for now
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
          */}

          {/* Completion summary card when session has ended / registration complete */}
          {sessionEnded && !error && <CompletionCard />}

          {/* sessionEndedNote removed */}

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button type="button" className={styles.retryButton} onClick={retry}>
                Retry
              </button>
            </div>
          )}
        </div>

        {/*
            Neither sheet is given onBack/onClose: this is a backend-driven,
            single-path conversation with no "go back" concept anywhere else
            in the UI (choice/checkbox/file steps offer no skip either), so
            the consent/declaration step must be answered to proceed rather
            than dismissed - matching how a required legal consent should
            behave anyway.
          */}
        {!isTyping && input?.type === "consent input" && (
          <ConsentDialog sheet={input.sheet} onAccept={() => sendAnswer("I Accept")} />
        )}

        {!isTyping && input?.type === "declaration input" && (
          <DeclarationSheet
            open
            title={input.title}
            options={input.options || []}
            onSubmit={(selected) => sendAnswer(selected.map((opt) => opt.label).join(", ") || "None")}
          />
        )}

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
