import { useEffect, useMemo, useRef, useState } from "react";
import { useVisualViewport } from "../../hooks/useVisualViewport";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PinInput from "../../components/PinInput/PinInput";
import CityPicker from "../../components/CityPicker/CityPicker";
import ChatLanguagePicker from "../../components/ChatLanguagePicker/ChatLanguagePicker";
import CompletionCard from "./components/CompletionCard/CompletionCard";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FeeSummaryCard from "../../components/FeeSummaryCard/FeeSummaryCard";
import DocumentScanCard from "../../components/DocumentScanCard/DocumentScanCard";
import PassportPhotoCard from "./components/PassportPhotoCard/PassportPhotoCard";
import ConsentDialog from "./components/ConsentDialog/ConsentDialog";
import DeclarationSheet from "./components/DeclarationSheet/DeclarationSheet";
import PaymentReview from "../../components/PaymentReview/PaymentReview";
import PaymentResultModal from "./components/PaymentResultModal/PaymentResultModal";
import StepTracker from "../../components/StepTracker/StepTracker";
import {
  STAGE_LABELS,
  determineStageIndex,
} from "../../components/StepTracker/stepProgress";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import useBackendConversation from "./useBackendConversation";
import { extractMessageText } from "../../store/slices/conversationSlice";
import parseDocumentSummaryText from "./parseDocumentSummaryText";
import PayURedirect from "../../components/PayURedirect/PayURedirect";
import styles from "./Chat.module.css";

const PASSPORT_PHOTO_STEP_PATTERN =
  /passport.{0,15}(size|photo)|photo.{0,15}passport/i;
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
    payuPayload,
    isPaymentStepFromBackend,
    messagesRef,
    sendAnswer,
    triggerPayment,
    submitFile,
    retry,
    dismissPaymentResult,
  } = useBackendConversation();

  useVisualViewport(pageRef);



  const lastMessage = history[history.length - 1];
  const lastMessageText = extractMessageText(lastMessage);

  const isConsentAcceptStep =
    input?.type === "choice input" &&
    (input.items || []).length === 1 &&
    input.items[0]?.content === "I Accept";

  const pendingConsentMessages =
    isConsentAcceptStep && lastMessage?.sender === "bot" ? [lastMessage] : [];

  const {
    trailingBotText,
    isPassportPhotoStep,
    isProfilePhotoStep,
    isCityStep,
    isMotherTongueStep,
    isPaymentReviewStep,
  } = useMemo(() => {
    let tText = "";
    for (
      let i = history.length - 1;
      i >= 0 && history[i]?.sender === "bot";
      i -= 1
    ) {
      // The resume summary card ("Here's what you told us earlier: ... Place of
      // birth: Mumbai ...") recaps answers from steps the member already passed.
      // It's a bot message with no user reply before the NEXT question, so this
      // backward scan would otherwise fold its old field labels (city, photo,
      // etc.) into the text used to detect the CURRENT step - stop before it.
      if (history[i]?.id === "resume-summary") break;
      tText = `${extractMessageText(history[i])} ${tText}`;
    }

    const _isPassportPhotoStep =
      input?.type === "file input" &&
      (PASSPORT_PHOTO_STEP_PATTERN.test(
        `${input.title || ""} ${input.caption || ""}`,
      ) ||
        PASSPORT_PHOTO_STEP_PATTERN.test(tText));

    const _isProfilePhotoStep =
      input?.type === "file input" &&
      (input.options?.variableId === PROFILE_PHOTO_VARIABLE_ID ||
        /profile photo/i.test(tText));

    let _isCityStep = false;
    let _isMotherTongueStep = false;

    if (input?.type === "city input") {
      _isCityStep = true;
    } else if (input?.type === "text input") {
      const searchStr = `${input.placeholder || ""} ${input.title || ""} ${tText}`;
      if (/\bmother tongue\b/i.test(searchStr)) {
        _isMotherTongueStep = true;
      } else if (/\b(city|place of birth|current city)\b/i.test(searchStr)) {
        _isCityStep = true;
      }
    }

    const _isPaymentReviewStep =
      (input?.id === "payment-review" ||
        input?.type === "payment-review" ||
        input?.type === "review input" ||
        input?.data?.type === "payment-review" ||
        lastMessage?.id === "payment-review" ||
        lastMessage?.type === "payment-review" ||
        /check\s+your\s+details|review\s+your\s+details/i.test(
          lastMessageText,
        )) &&
      input?.id !== "payment-review-correction" &&
      lastMessage?.id !== "payment-review-correction";

    return {
      trailingBotText: tText,
      isPassportPhotoStep: _isPassportPhotoStep,
      isProfilePhotoStep: _isProfilePhotoStep,
      isCityStep: _isCityStep,
      isMotherTongueStep: _isMotherTongueStep,
      isPaymentReviewStep: _isPaymentReviewStep,
    };
  }, [history, input, lastMessage, lastMessageText]);

  // Consent turns live entirely in the popup, so both the bot prompt and
  // its "I Accept" reply stay out of the transcript permanently - not just
  // while that step is the pending input.
  const consentMessageIds = useMemo(() => {
    const resolvedConsentMessageIds = new Set();
    for (let i = 1; i < history.length; i += 1) {
      const message = history[i];
      if (
        message?.sender === "user" &&
        extractMessageText(message) === "I Accept" &&
        history[i - 1]?.sender === "bot"
      ) {
        resolvedConsentMessageIds.add(history[i - 1].id);
        resolvedConsentMessageIds.add(message.id);
      }
    }
    const last = history[history.length - 1];
    const pending =
      isConsentAcceptStep && last?.sender === "bot" ? [last.id] : [];
    return new Set([...resolvedConsentMessageIds, ...pending]);
  }, [history, isConsentAcceptStep]);

  const pendingConsentMessageId = pendingConsentMessages[0]?.id ?? null;
  const consentPrecededByDocSummary =
    pendingConsentMessageId != null &&
    history.length >= 2 &&
    history[history.length - 2]?.sender === "bot" &&
    Boolean(
      parseDocumentSummaryText(extractMessageText(history[history.length - 2])),
    );

  const [visibleConsentMessageId, setVisibleConsentMessageId] = useState(null);

  useEffect(() => {
    if (!pendingConsentMessageId || !consentPrecededByDocSummary)
      return undefined;

    const CONSENT_POPUP_DELAY_MS = 2500;
    const timer = setTimeout(
      () => setVisibleConsentMessageId(pendingConsentMessageId),
      CONSENT_POPUP_DELAY_MS,
    );

    return () => clearTimeout(timer);
  }, [pendingConsentMessageId, consentPrecededByDocSummary]);

  const showConsentPopup =
    Boolean(pendingConsentMessageId) &&
    (!consentPrecededByDocSummary ||
      visibleConsentMessageId === pendingConsentMessageId);

  const isNonConsentChoiceStep =
    input?.type === "choice input" && !isConsentAcceptStep;
  const lastMessageDocSummary =
    lastMessage?.sender === "bot"
      ? parseDocumentSummaryText(extractMessageText(lastMessage))
      : null;
  const pendingDocSummary = isNonConsentChoiceStep
    ? lastMessageDocSummary
    : null;



  const displayActiveIndex = useMemo(
    () =>
      determineStageIndex({
        input,
        trailingBotText,
        sessionEnded,
        isPaymentReviewStep,
        isPaymentStep: isPaymentStepFromBackend,
      }),
    [input, trailingBotText, sessionEnded, isPaymentReviewStep, isPaymentStepFromBackend],
  );
  const displayProgress = sessionEnded ? 100 : progress;

  const textConfig = input?.type ? TEXT_INPUT_CONFIG[input.type] : null;

  // Backend has no GSTIN/Work Link input types, so detect them from the prompt text.
  const isPlainTextInput = input?.type === "text input";
  const promptText = `${input?.placeholder || ""} ${input?.title || ""} ${trailingBotText}`;
  const isGstinStep = isPlainTextInput && /\bgst(?:in)?\b/i.test(promptText);
  const isWorkLinkStep =
    (isPlainTextInput || input?.type === "url input") && /\bwork\s*link\b/i.test(promptText);
  const effectiveTextConfig = isGstinStep
    ? { type: "gstin", inputMode: "text" }
    : isWorkLinkStep
      ? { type: "worklink", inputMode: "url" }
      : textConfig;

  const isTextStep = Boolean(effectiveTextConfig) && !isTyping;
  const showComposer =
    Boolean(effectiveTextConfig) && !isCityStep && !isPaymentReviewStep && !isMotherTongueStep;

  const isUploadForCurrentInput =
    input?.type === "file input" && uploadForInputId === input.id;
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

    if (textConfig && Array.isArray(input.items) && input.items.length > 0) {
      return (
        <QuickReplyCard
          options={input.items.map((item) => ({
            label: item.content || item.label,
            id: item.id,
          }))}
          onSelect={(option) => sendAnswer(option.label)}
        />
      );
    }

    if (
      input?.type === "choice input" &&
      !isConsentAcceptStep &&
      !pendingDocSummary
    ) {
      return (
        <QuickReplyCard
          options={(input.items || []).map((item) => ({ label: item.content || item.label, id: item.id || item.value || item.key }))}
          onSelect={(option) => {
            if (isPaymentStepFromBackend && /pay/i.test(option.label)) {
              triggerPayment();
            } else {
              sendAnswer(option.label);
            }
          }}
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
          onOptionSelect={(option) => {
            if (isPaymentStepFromBackend && /pay/i.test(option.label)) {
              triggerPayment();
            } else {
              sendAnswer(option.label);
            }
          }}
          onConfirm={() => {
            const label = input.data?.confirmLabel || "Confirmed";
            if (isPaymentStepFromBackend && /pay/i.test(label)) {
              triggerPayment();
            } else {
              sendAnswer(label);
            }
          }}
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

    if (
      input?.type === "file input" &&
      (isPassportPhotoStep || isProfilePhotoStep)
    ) {
      return (
        <PassportPhotoCard
          key={input.id}
          title={
            input.title ||
            (isProfilePhotoStep ? "Upload your Profile photo" : undefined)
          }
          caption={input.caption}
          onFileSelected={submitFile}
          status={effectiveUploadStatus}
          progress={effectiveUploadProgress}
          errorMessage={effectiveUploadError}
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

  const paymentResultMsg = history.find(m => m.id === "payment_verify");

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.panel}>
        <ChatHeader
          title="IPRS Membership Assistant"
          language={language}
          onBack={onBack}
          onLogout={onLogout}
        />

        <div className={styles.trackerSlot}>
          <StepTracker
            stages={STAGE_LABELS}
            activeIndex={displayActiveIndex}
            progress={displayProgress}
          />
        </div>

        <div className={styles.messages} ref={messagesRef}>
          {history
            .filter((message) => !consentMessageIds.has(message.id) && message.id !== "payment_verify")
            .map((message) => {
              const isLast = message.id === lastMessage?.id;
              const msgText = extractMessageText(message);

              const isReview =
                message.sender === "bot" &&
                (message.id === "payment-review" ||
                  message.type === "payment-review" ||
                  message.kind === "payment-review" ||
                  /check\s+your\s+details|review\s+your\s+details/i.test(
                    msgText,
                  )) &&
                message.id !== "payment-review-correction";

              if (isReview) {
                return (
                  <PaymentReview
                    key={message.id}
                    data={message.data || (isLast ? input?.data : undefined)}
                    input={isLast ? input : undefined}
                    message={message}
                    onAction={
                      isLast
                        ? (actionLabel) => {
                            if (/pay/i.test(actionLabel)) {
                              triggerPayment();
                            } else {
                              sendAnswer(actionLabel);
                            }
                          }
                        : undefined
                    }
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
                    options={
                      isLast && pendingDocSummary
                        ? (input.items || []).map((item) => ({
                            label: item.content || item.label,
                            id: item.id || item.value || item.key,
                          }))
                        : undefined
                    }
                    onOptionSelect={(option) => {
                      if (isLast && isPaymentStepFromBackend && /pay/i.test(option.label)) {
                        triggerPayment();
                      } else {
                        sendAnswer(option.label);
                      }
                    }}
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
              <button
                type="button"
                className={styles.retryButton}
                onClick={retry}
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {!isTyping && isConsentAcceptStep && showConsentPopup && (
          <ConsentDialog
            messages={pendingConsentMessages}
            onAccept={() => sendAnswer("I Accept")}
            onBack={() => {}}
          />
        )}

        {!isTyping && input?.type === "declaration input" && (
          <DeclarationSheet
            open
            title={input.title}
            options={input.options || []}
            onSubmit={(selected) => {
              sendAnswer(selected.map((opt) => opt.label).join(", ") || "None");
            }}
          />
        )}

        {!isTyping && isCityStep && (
          <div className={styles.cityComposerWrap}>
            <CityPicker
              key={input.id}
              placeholder={input.placeholder || "Write your message"}
              onSubmit={sendAnswer}
              disabled={isTyping}
            />
          </div>
        )}

        {!isTyping && isMotherTongueStep && (
          <div className={styles.cityComposerWrap}>
            <ChatLanguagePicker
              key={`lang-${input.id}`}
              placeholder={input.placeholder || "Write your message"}
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
            inputMode={effectiveTextConfig.inputMode}
            type={effectiveTextConfig.type}
          />
        )}

        {payuPayload && <PayURedirect payuPayload={payuPayload} />}
        
        {paymentResultMsg && paymentResultMsg.data?.status !== "PENDING" && (
          <PaymentResultModal data={paymentResultMsg.data} onClose={dismissPaymentResult} />
        )}
      </div>
    </div>
  );
};

export default Chat;
