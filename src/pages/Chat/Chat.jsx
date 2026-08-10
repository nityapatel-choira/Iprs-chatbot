import { useEffect, useRef, useState } from "react";
import iprsLogo from "../../assets/iprs-logo.png";
import QuickReplyCard from "../../components/QuickReplyCard/QuickReplyCard";
import YesNoPills from "../../components/YesNoPills/YesNoPills";
import CheckboxGroup from "../../components/CheckboxGroup/CheckboxGroup";
import FileUploader from "../../components/FileUploader/FileUploader";
import FeeSummaryCard from "../../components/FeeSummaryCard/FeeSummaryCard";
import StepTracker from "../../components/StepTracker/StepTracker";
import ConsentSheet from "../../components/ConsentSheet/ConsentSheet";
import { STEPS, CONSENT, TRACKER_STAGES, summarizeCheckboxSelection } from "./conversationFlow";
import styles from "./Chat.module.css";

let idCounter = 1;
const nextId = () => `m${++idCounter}`;
const BOT_TYPE_DELAY = 700;

function TranslateIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <text x="8" y="12.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor">
        A
      </text>
      <text x="16" y="17.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor">
        x
      </text>
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 9.5a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10" y1="15.5" x2="10" y2="18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M3 10 17 3l-5.5 14-2.3-6.2L3 10Z" fill="currentColor" />
    </svg>
  );
}

function BotAvatar() {
  return (
    <span className={styles.avatar} aria-hidden="true">
      <img src={iprsLogo} alt="" />
    </span>
  );
}

export default function Chat({ language = "English", onBack }) {
  const [history, setHistory] = useState([]);
  const [stepId, setStepId] = useState("start");
  const [isTyping, setIsTyping] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [trackerIndex, setTrackerIndex] = useState(null);
  const [consentSheet, setConsentSheet] = useState(null);
  const endRef = useRef(null);
  const startedRef = useRef(false);

  const pushBot = (entry) => setHistory((prev) => [...prev, { id: nextId(), sender: "bot", ...entry }]);
  const pushUser = (text) => setHistory((prev) => [...prev, { id: nextId(), sender: "user", kind: "text", text }]);

  const runStep = (id) => {
    const step = STEPS[id];
    if (!step) return;
    setStepId(id);
    setInputVisible(false);

    if (step.tracker) setTrackerIndex(step.tracker.activeIndex);

    if (step.input?.type === "consent") {
      setConsentSheet(step.input.sheet);
      return;
    }

    const entries = step.bot.map((text) => ({ kind: "text", text }));
    if (step.input?.type === "summary") {
      entries.push({ kind: "summaryCard", data: step.input.data });
    }

    if (entries.length === 0) {
      setInputVisible(true);
      return;
    }

    setIsTyping(true);
    let i = 0;
    const typeNext = () => {
      setTimeout(() => {
        pushBot(entries[i]);
        i += 1;
        if (i < entries.length) {
          typeNext();
        } else {
          setIsTyping(false);
          if (step.input) setInputVisible(true);
        }
      }, BOT_TYPE_DELAY);
    };
    typeNext();
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runStep("start");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping, inputVisible, consentSheet]);

  const advance = (targetId, userText) => {
    if (userText !== undefined) pushUser(userText);
    setInputVisible(false);
    runStep(targetId);
  };

  const step = STEPS[stepId];
  const input = step?.input;

  const handleQuickReply = (option) => advance(option.next, option.label);
  const handleYesNo = (value) => advance(input.next, value);
  const handleCheckboxSubmit = (selected) => advance(input.next, summarizeCheckboxSelection(selected));
  const handleFileUploaded = (fileName) => advance(input.next, `${fileName} uploaded`);
  const handleTextSubmit = (value) => advance(input.next, value);

  const handleConsentAccept = () => {
    const nextStepId = input.next;
    setConsentSheet(null);
    runStep(nextStepId);
  };
  const handleConsentBack = () => {
    setConsentSheet(null);
    runStep("summary");
  };

  const isTextStep = inputVisible && input?.type === "text";

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <header className={styles.header}>
          {onBack && (
            <button type="button" className={styles.backButton} onClick={onBack} aria-label="Back">
              ←
            </button>
          )}
          <h1 className={styles.title}>IPRS Membership Assistant</h1>
          <span className={styles.langToggle}>
            <TranslateIcon />
            {language}
          </span>
        </header>

        {trackerIndex !== null && (
          <div className={styles.trackerSlot}>
            <StepTracker stages={TRACKER_STAGES} activeIndex={trackerIndex} />
          </div>
        )}

        <div className={styles.messages}>
          {history.map((msg) => (
            <div key={msg.id} className={`${styles.row} ${msg.sender === "user" ? styles.rowUser : styles.rowBot}`}>
              {msg.sender === "bot" && msg.kind !== "summaryCard" && <BotAvatar />}
              {msg.kind === "summaryCard" ? (
                <FeeSummaryCard {...msg.data} />
              ) : (
                <div className={`${styles.bubble} ${msg.sender === "user" ? styles.bubbleUser : styles.bubbleBot}`}>
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.row} ${styles.rowBot}`}>
              <BotAvatar />
              <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typing}`} aria-live="polite">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </div>
          )}

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

          <div ref={endRef} />
        </div>

        <ChatComposer
          onSend={handleTextSubmit}
          disabled={isTyping || !isTextStep}
          placeholder={isTextStep ? input.placeholder : "Write your message"}
          inputMode={isTextStep ? input.inputMode : "text"}
        />
      </div>

      {consentSheet && (
        <ConsentSheet
          open
          title={CONSENT[consentSheet].title}
          onAccept={handleConsentAccept}
          onBack={handleConsentBack}
        >
          {consentSheet === "privacy" ? (
            <p>
              {CONSENT.privacy.bodyBefore}
              <a href={CONSENT.privacy.linkHref} target="_blank" rel="noreferrer">
                {CONSENT.privacy.linkText}
              </a>
              {CONSENT.privacy.bodyAfter}
            </p>
          ) : (
            <p>{CONSENT.fraud.body}</p>
          )}
        </ConsentSheet>
      )}
    </div>
  );
}

function ChatComposer({ onSend, disabled, placeholder, inputMode }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (disabled) setValue("");
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div className={styles.composerWrap}>
      <form className={styles.composer} onSubmit={handleSubmit}>
        <button type="button" className={styles.micButton} aria-label="Voice input" disabled={disabled}>
          <MicIcon />
        </button>
        <input
          className={styles.composerInput}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          aria-label="Type your message"
        />
        <button type="submit" className={styles.sendButton} disabled={disabled || !value.trim()} aria-label="Send">
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
