import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import FileUploader from "../../components/FileUploader/FileUploader";
import PinInput from "../../components/PinInput/PinInput";
import CompletionCard from "./components/CompletionCard/CompletionCard";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FeeSummaryCard from "../../components/FeeSummaryCard/FeeSummaryCard";
import DocumentScanCard from "../../components/DocumentScanCard/DocumentScanCard";
import PassportPhotoCard from "./components/PassportPhotoCard/PassportPhotoCard";
import ConsentDialog from "./components/ConsentDialog/ConsentDialog";
import DeclarationSheet from "./components/DeclarationSheet/DeclarationSheet";
import StepTracker from "../../components/StepTracker/StepTracker";
import { STAGE_LABELS, getStepProgress } from "../../components/StepTracker/stepProgress";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageRow from "./components/MessageRow/MessageRow";
import TypingIndicator from "./components/TypingIndicator/TypingIndicator";
import ChatComposer from "./components/ChatComposer/ChatComposer";
import useBackendConversation from "./useBackendConversation";
import { extractMessageText } from "../../store/slices/conversationSlice";
import { parseDocumentSummaryText } from "./parseDocumentSummaryText";
import styles from "./Chat.module.css";

// Lazy-loaded rather than a plain top-level import like the other step
// components: this pulls in the Razorpay checkout script loader, the
// payment service/hook, and their own CSS, none of which should ship as
// part of Chat's main chunk for every user who never reaches the payment
// step - only fetched the moment input.type === "payment input" actually
// renders it below.
const PaymentCard = lazy(() => import("../../components/payment/PaymentCard"));

const PASSPORT_PHOTO_STEP_PATTERN = /passport.{0,15}(size|photo)|photo.{0,15}passport/i;
const PROFILE_PHOTO_VARIABLE_ID = "vww01qa7jizgywxikfu1yu48x";

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

  // "file input" type is otherwise generic (PAN, bank proof, address
  // proof, passport photo - anything file-based), so opting the passport
  // input.title/caption turned out NOT to carry this for the real backend
  // (they're empty/generic for this step) - the identifying copy ("Upload
  // your passport size profile") is actually the bot's chat message
  // immediately before the input, not a field on the input object itself.
  // Falls back to that only because there is no better field: walks the
  // trailing run of bot messages at the end of `history` (the message(s)
  // just sent alongside this input, per applyConversationResponse in
  // conversationSlice.js) rather than scanning the whole transcript, so an
  // unrelated older message (e.g. address-proof's own copy) can't leak
  // into a later, different file-input step. Reuses conversationSlice's
  // own extractMessageText instead of duplicating richText-unwrapping
  // logic here.
  let trailingBotText = "";
  for (let i = history.length - 1; i >= 0 && history[i]?.sender === "bot"; i -= 1) {
    trailingBotText = `${extractMessageText(history[i])} ${trailingBotText}`;
  }

  // The consent step ("Accept the Privacy Notice", "Please Note!" fraud
  // warning, etc.) is a plain "choice input" on the wire - there is no
  // dedicated input.type or input.sheet field for it. Its single item's
  // content is exactly the CTA label the backend actually sends, so
  // matching that (rather than sniffing the title/body prose) is the most
  // reliable signal available. See ConsentDialog for how the title/body
  // themselves are read from the trailing bot messages below instead of
  // being hardcoded.
  const isConsentAcceptStep =
    input?.type === "choice input" && (input.items || []).length === 1 && input.items[0]?.content === "I Accept";

  // Confirmed real turn shape: messages[0] is the document/fee recap,
  // messages[1] is the consent title+body - both bot messages, both
  // immediately preceding the same "I Accept" input, with no field
  // distinguishing them. The consent content is always the single last bot
  // message right before the gate, never an unbounded run before it - so
  // only that one message goes to ConsentDialog; anything earlier
  // (messages[0] included) is left alone and falls through to its normal
  // chat-bubble rendering. Kept as the full message object (not flattened
  // text) so ConsentDialog can render the backend's actual richText -
  // including the Privacy Notice link - instead of copy baked into the
  // frontend.
  const lastMessage = history[history.length - 1];
  const pendingConsentMessages = isConsentAcceptStep && lastMessage?.sender === "bot" ? [lastMessage] : [];

  // A message hidden only while its own consent step is still the *current*
  // pending input resurfaces the instant the conversation moves past it
  // (input changes to the next step, so it's no longer "current" - nothing
  // was ever recomputed to keep it hidden). Once a consent message is
  // identified it must stay excluded permanently, for every past consent
  // step, not just whichever one happens to be pending right now. There's
  // no stored record of what `input` was at each past point in history, but
  // there doesn't need to be: the *only* input shape that ever produces a
  // user reply of exactly "I Accept" is this same isConsentAcceptStep
  // (see above) - a plain "choice input" that isn't consent could
  // coincidentally have a single "I Accept"-labeled item too, but that
  // would itself already satisfy isConsentAcceptStep's definition, so the
  // equivalence holds regardless. So both the bot message immediately
  // preceding every past "I Accept" reply AND that reply itself were this
  // turn's consent interaction end-to-end - the whole thing happened inside
  // the popup, so neither belongs in the plain chat transcript, only the
  // popup's own "I Accept" button does.
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

  // Presentation-only delay: when the backend bundles the document/fee
  // recap and the consent message into the same response, the consent
  // popup would otherwise open in the same paint as the doc/fee card and
  // cover it before the user has had a chance to read it. Detected by
  // whether the message immediately before this consent message is itself
  // a parsed document/fee summary - a standalone consent step (e.g.
  // consent 2, which normally arrives on its own after consent 1 is
  // accepted) has no such neighbor and opens immediately, unchanged from
  // before. Nothing here touches the backend, progress, or message
  // suppression above - it only delays which render the popup's JSX
  // appears in.
  const pendingConsentMessageId = pendingConsentMessages[0]?.id ?? null;
  const consentPrecededByDocSummary =
    pendingConsentMessageId != null &&
    history.length >= 2 &&
    history[history.length - 2]?.sender === "bot" &&
    Boolean(parseDocumentSummaryText(extractMessageText(history[history.length - 2])));

  // Only the delayed (bundled) case needs state at all - the standalone
  // case below is a plain derived boolean, no render-triggering setState
  // required for it.
  const [visibleConsentMessageId, setVisibleConsentMessageId] = useState(null);

  useEffect(() => {
    if (!pendingConsentMessageId || !consentPrecededByDocSummary) return undefined;

    const CONSENT_POPUP_DELAY_MS = 2500;
    const timer = setTimeout(() => setVisibleConsentMessageId(pendingConsentMessageId), CONSENT_POPUP_DELAY_MS);
    // Also covers "user moved past this state" - if `pendingConsentMessageId`
    // changes before the timer fires (or the input stops being a consent
    // step at all, at which point this whole effect stops re-running for
    // it), this cleanup cancels the stale timer before it could reopen a
    // popup for a step that's no longer current.
    return () => clearTimeout(timer);
  }, [pendingConsentMessageId, consentPrecededByDocSummary]);

  const showConsentPopup =
    Boolean(pendingConsentMessageId) &&
    (!consentPrecededByDocSummary || visibleConsentMessageId === pendingConsentMessageId);

  // "Start Application" / "Change my previous answers" is a genuine
  // backend choice-input (never the consent gate, which is excluded
  // above), and can directly follow the parsed document/fee message with
  // no field linking the two - only their adjacency in history does. When
  // that's the case its buttons render as part of the parsed card instead
  // of a separate QuickReplyCard below it, matching Figma (both live in
  // the same card there). A past, already-answered document/fee message
  // still gets parsed into a card everywhere else in history - it just
  // doesn't get buttons once the conversation has moved on.
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

        <div className={styles.trackerSlot}>
          <StepTracker stages={STAGE_LABELS} activeIndex={displayActiveIndex} currentFill={displayFill} />
        </div>

        <div className={styles.messages} ref={messagesRef}>
          {history
            .filter((message) => !consentMessageIds.has(message.id))
            .map((message) => {
              const isLast = message.id === lastMessage?.id;
              const parsedSummary = isLast
                ? lastMessageDocSummary
                : message.sender === "bot" && parseDocumentSummaryText(extractMessageText(message));
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

          {!isTyping && input?.type === "choice input" && !isConsentAcceptStep && !pendingDocSummary && (
            <QuickReplyCard
              options={(input.items || []).map((item) => ({ label: item.content }))}
              onSelect={(option) => sendAnswer(option.label)}
            />
          )}

          {!isTyping && input?.type === "otp input" && (
            <PinInput key={input.id} onComplete={sendAnswer} />
          )}

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

          {!isTyping && input?.type === "file input" && (isPassportPhotoStep || isProfilePhotoStep) && (
            <PassportPhotoCard
              key={input.id}
              title={input.title || (isProfilePhotoStep ? "Upload your Profile photo" : undefined)}
              caption={input.caption}
              onFileSelected={submitFile}
            />
          )}

          {!isTyping && input?.type === "file input" && !isPassportPhotoStep && !isProfilePhotoStep && (
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
            actual backend response shape. PaymentCard already defaults
            amount/prefill sensibly on its own, so a response that doesn't
            (yet) send these fields still renders correctly.
          */}
          {!isTyping && input?.type === "payment input" && (
            <Suspense fallback={null}>
              <PaymentCard
                key={input.id}
                amountInRupees={input.amount ? input.amount / 100 : undefined}
                prefill={{ name: input.prefillName, email: input.prefillEmail, contact: input.prefillContact }}
                onComplete={(result) =>
                  sendAnswer(result?.paymentId ? `Payment completed (${result.paymentId})` : "Payment completed")
                }
              />
            </Suspense>
          )}

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
            ConsentDialog's onBack is a no-op, not real back-navigation: this
            is a backend-driven, single-path conversation with no "go back"
            concept anywhere else in the UI (choice/checkbox/file steps offer
            no skip either), so consent must still be answered via "I Accept"
            to proceed. It only exists so BottomSheet's close (X) button - shown
            on web/desktop widths only, matching Figma - has a truthy handler
            to render against; neither it nor "Go back" changes any state.
            DeclarationSheet below is intentionally not given one either.
          */}
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
