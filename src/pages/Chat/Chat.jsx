import { useEffect, useMemo, useRef, useState } from "react";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PinInput from "../../components/PinInput/PinInput";
import CityPicker from "../../components/CityPicker/CityPicker";
import CompletionCard from "./components/CompletionCard/CompletionCard";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FeeSummaryCard from "../../components/FeeSummaryCard/FeeSummaryCard";
import DocumentScanCard from "../../components/DocumentScanCard/DocumentScanCard";
import PassportPhotoCard from "./components/PassportPhotoCard/PassportPhotoCard";
import ConsentDialog from "./components/ConsentDialog/ConsentDialog";
import DeclarationSheet from "./components/DeclarationSheet/DeclarationSheet";
import PaymentReview from "../../components/PaymentReview/PaymentReview";
import StepTracker from "../../components/StepTracker/StepTracker";
import { STAGE_LABELS, getStepProgress } from "../../components/StepTracker/stepProgress";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import useBackendConversation from "./useBackendConversation";
import { extractMessageText } from "../../store/slices/conversationSlice";
import parseDocumentSummaryText from "./parseDocumentSummaryText";
import styles from "./Chat.module.css";

const PASSPORT_PHOTO_STEP_PATTERN = /passport.{0,15}(size|photo)|photo.{0,15}passport/i;
const PROFILE_PHOTO_VARIABLE_ID = "vww01qa7jizgywxikfu1yu48x";

// Only these input types render the free-text composer.
const TEXT_INPUT_CONFIG = {
  "text input": { type: "text", inputMode: "text" },
  "email input": { type: "email", inputMode: "email" },
  "url input": { type: "url", inputMode: "url" },
  "phone input": { type: "tel", inputMode: "tel" },
};

const Chat = ({ language = "English", onBack, onLogout }) => {
  const pageRef = useRef(null);

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

  useEffect(() => {
    const vv = window.visualViewport;
    const el = pageRef.current;
    if (!vv || !el) return undefined;

    let rafId = null;
    let lastHeight = 0;
    let layoutViewportHeight = document.documentElement.clientHeight || window.innerHeight;

    const updateVisualHeight = () => {
      if (vv.height >= layoutViewportHeight - 100) {
        layoutViewportHeight = document.documentElement.clientHeight || window.innerHeight;
      }

      const isKeyboardOpen = vv.height < layoutViewportHeight - 100;
      if (isKeyboardOpen) {
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
        const nextHeight = Math.round(vv.height);
        if (Math.abs(nextHeight - lastHeight) > 2) {
          lastHeight = nextHeight;
          el.style.setProperty("--visual-height", `${nextHeight}px`);
        }
      } else if (lastHeight !== 0) {
        lastHeight = 0;
        el.style.removeProperty("--visual-height");
      }
    };

    const handleViewportChange = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVisualHeight);
    };

    vv.addEventListener("resize", handleViewportChange);
    vv.addEventListener("scroll", handleViewportChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      vv.removeEventListener("resize", handleViewportChange);
      vv.removeEventListener("scroll", handleViewportChange);
      el.style.removeProperty("--visual-height");
    };
  }, []);

  const { activeIndex: trackerActiveIndex, currentFill: trackerFill } = getStepProgress(progress);
  const displayActiveIndex = sessionEnded ? STAGE_LABELS.length : trackerActiveIndex;
  const displayFill = sessionEnded ? 100 : trackerFill;

  // The passport-photo step is identified from the trailing run of bot
  // messages: input.title/caption are empty/generic for it on the real
  // backend.
  let trailingBotText = "";
  for (let i = history.length - 1; i >= 0 && history[i]?.sender === "bot"; i -= 1) {
    trailingBotText = `${extractMessageText(history[i])} ${trailingBotText}`;
  }

  const isConsentAcceptStep =
    input?.type === "choice input" && (input.items || []).length === 1 && input.items[0]?.content === "I Accept";

  const lastMessage = history[history.length - 1];
  const pendingConsentMessages = isConsentAcceptStep && lastMessage?.sender === "bot" ? [lastMessage] : [];

  // Consent turns live entirely in the popup, so both the bot prompt and
  // its "I Accept" reply stay out of the transcript permanently - not just
  // while that step is the pending input.
  const consentMessageIds = useMemo(() => {
    const resolvedConsentMessageIds = new Set();
    for (let i = 1; i < history.length; i += 1) {
      const message = history[i];
      if (message?.sender === "user" && extractMessageText(message) === "I Accept" && history[i - 1]?.sender === "bot") {
        resolvedConsentMessageIds.add(history[i - 1].id);
        resolvedConsentMessageIds.add(message.id);
      }
    }
    const last = history[history.length - 1];
    const pending = isConsentAcceptStep && last?.sender === "bot" ? [last.id] : [];
    return new Set([...resolvedConsentMessageIds, ...pending]);
  }, [history, isConsentAcceptStep]);


  const pendingConsentMessageId = pendingConsentMessages[0]?.id ?? null;
  const consentPrecededByDocSummary =
    pendingConsentMessageId != null &&
    history.length >= 2 &&
    history[history.length - 2]?.sender === "bot" &&
    Boolean(parseDocumentSummaryText(extractMessageText(history[history.length - 2])));

  
  const [visibleConsentMessageId, setVisibleConsentMessageId] = useState(null);

  useEffect(() => {
    if (!pendingConsentMessageId || !consentPrecededByDocSummary) return undefined;

    const CONSENT_POPUP_DELAY_MS = 2500;
    const timer = setTimeout(() => setVisibleConsentMessageId(pendingConsentMessageId), CONSENT_POPUP_DELAY_MS);
  
    return () => clearTimeout(timer);
  }, [pendingConsentMessageId, consentPrecededByDocSummary]);

  const showConsentPopup =
    Boolean(pendingConsentMessageId) &&
    (!consentPrecededByDocSummary || visibleConsentMessageId === pendingConsentMessageId);


  const isNonConsentChoiceStep = input?.type === "choice input" && !isConsentAcceptStep;
  const lastMessageDocSummary =
    lastMessage?.sender === "bot" ? parseDocumentSummaryText(extractMessageText(lastMessage)) : null;
  const pendingDocSummary = isNonConsentChoiceStep ? lastMessageDocSummary : null;

  const isPassportPhotoStep =
    input?.type === "file input" &&
    (PASSPORT_PHOTO_STEP_PATTERN.test(`${input.title || ""} ${input.caption || ""}`) ||
      PASSPORT_PHOTO_STEP_PATTERN.test(trailingBotText));

  const isProfilePhotoStep =
    input?.type === "file input" &&
    (input.options?.variableId === PROFILE_PHOTO_VARIABLE_ID || /profile photo/i.test(trailingBotText));

  const isCityStep =
    input?.type === "city input" ||
    (input?.type === "text input" &&
      /\b(city|place of birth|current city)\b/i.test(`${input.placeholder || ""} ${input.title || ""} ${trailingBotText}`));

  const lastMessageText = extractMessageText(lastMessage);
  const isPaymentReviewStep =
    (input?.id === "payment-review" ||
      input?.type === "payment-review" ||
      input?.type === "review input" ||
      input?.data?.type === "payment-review" ||
      lastMessage?.id === "payment-review" ||
      lastMessage?.type === "payment-review" ||
      /check\s+your\s+details|review\s+your\s+details/i.test(lastMessageText)) &&
    input?.id !== "payment-review-correction" &&
    lastMessage?.id !== "payment-review-correction";

  const textConfig = input?.type ? TEXT_INPUT_CONFIG[input.type] : null;
  const isTextStep = Boolean(textConfig) && !isTyping;
  const showComposer = Boolean(textConfig) && !isCityStep && !isPaymentReviewStep;


  const isUploadForCurrentInput = input?.type === "file input" && uploadForInputId === input.id;
  const effectiveUploadStatus = isUploadForCurrentInput ? uploadStatus : "idle";
  const effectiveUploadProgress = isUploadForCurrentInput ? uploadProgress : 0;
  const effectiveUploadError = isUploadForCurrentInput ? uploadError : "";

  function renderActiveInputWidget() {
    if (isTyping) return null;

    if (isPaymentReviewStep) {
      return null;
    }

    if (isCityStep) {
      return null;
    }

    if (input?.type === "choice input" && !isConsentAcceptStep && !pendingDocSummary) {
      return (
        <QuickReplyCard
          options={(input.items || []).map((item) => ({ label: item.content }))}
          onSelect={(option) => sendAnswer(option.label)}
        />
      );
    }

    if (input?.type === "otp input") {
      return <PinInput key={input.id} onComplete={sendAnswer} />;
    }

    if (input?.type === "checkbox input") {
      return (
        <CheckboxGroup
          options={input.options || []}
          caption={input.caption}
          onSubmit={(selected) => sendAnswer(selected.map((opt) => opt.label).join(", "))}
        />
      );
    }

    if (input?.type === "summary input") {
      return (
        <FeeSummaryCard
          key={input.id}
          {...input.data}
          onOptionSelect={(option) => sendAnswer(option.label)}
          onConfirm={() => sendAnswer(input.data?.confirmLabel || "Confirmed")}
        />
      );
    }

    if (input?.type === "document input") {
      return (
        <DocumentScanCard
          key={input.id}
          title={input.title}
          caption={input.caption}
          onCapture={() => sendAnswer("Document captured")}
        />
      );
    }

    if (input?.type === "file input" && (isPassportPhotoStep || isProfilePhotoStep)) {
      return (
        <PassportPhotoCard
          key={input.id}
          title={input.title || (isProfilePhotoStep ? "Upload your Profile photo" : undefined)}
          caption={input.caption}
          onFileSelected={submitFile}
        />
      );
    }

    if (input?.type === "file input") {
      return (
        <FileUploader
          key={input.id}
          title={input.title || "Choose a file or drag & drop it here"}
          caption={input.caption || "PNG, JPG/JPEG, PDF"}
          onFileSelected={submitFile}
          status={effectiveUploadStatus}
          progress={effectiveUploadProgress}
          errorMessage={effectiveUploadError}
        />
      );
    }

    return null;
  }

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.panel}>
        <ChatHeader title="IPRS Membership Assistant" language={language} onBack={onBack} onLogout={onLogout} />

        <div className={styles.trackerSlot}>
          <StepTracker stages={STAGE_LABELS} activeIndex={displayActiveIndex} currentFill={displayFill} />
        </div>

        <div className={styles.messages} ref={messagesRef}>
          {history
            .filter((message) => !consentMessageIds.has(message.id))
            .map((message) => {
              const isLast = message.id === lastMessage?.id;
              const msgText = extractMessageText(message);
              const isReview =
                message.sender === "bot" &&
                (message.id === "payment-review" ||
                  message.type === "payment-review" ||
                  message.kind === "payment-review" ||
                  /check\s+your\s+details|review\s+your\s+details/i.test(msgText)) &&
                message.id !== "payment-review-correction";

              if (isReview) {
                return (
                  <PaymentReview
                    key={message.id}
                    data={message.data || (isLast ? input?.data : undefined)}
                    input={isLast ? input : undefined}
                    message={message}
                    onAction={isLast ? (actionLabel) => sendAnswer(actionLabel) : undefined}
                  />
                );
              }

              const parsedSummary = isLast
                ? lastMessageDocSummary
                : message.sender === "bot" && parseDocumentSummaryText(msgText);
              if (parsedSummary) {
                return (
                  <FeeSummaryCard
                    key={message.id}
                    {...parsedSummary}
                    options={isLast && pendingDocSummary ? (input.items || []).map((item) => ({ label: item.content })) : undefined}
                    onOptionSelect={(option) => sendAnswer(option.label)}
                  />
                );
              }
              return <MessageRow key={message.id} message={message} />;
            })}

          {isTyping && <TypingIndicator />}

          {renderActiveInputWidget()}

          {sessionEnded && !error && <CompletionCard />}

          {error && (
            <div className={styles.errorBanner} role="alert">
              <span>{error}</span>
              <button type="button" className={styles.retryButton} onClick={retry}>
                Retry
              </button>
            </div>
          )}
        </div>

        {!isTyping && isConsentAcceptStep && showConsentPopup && (
          <ConsentDialog messages={pendingConsentMessages} onAccept={() => sendAnswer("I Accept")} onBack={() => {}} />
        )}

        {!isTyping && input?.type === "declaration input" && (
          <DeclarationSheet
            open
            title={input.title}
            options={input.options || []}
            onSubmit={(selected) => sendAnswer(selected.map((opt) => opt.label).join(", ") || "None")}
          />
        )}

        {!isTyping && isCityStep && (
          <div className={styles.cityComposerWrap}>
            <CityPicker
              key={input.id}
              placeholder={input.placeholder || "Search or select city..."}
              onSubmit={sendAnswer}
              disabled={isTyping}
            />
          </div>
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
};

export default Chat;
