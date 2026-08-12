import { useEffect, useRef, useState } from "react";
import { STEPS, summarizeCheckboxSelection } from "./conversationFlow";

let idCounter = 1;
const nextId = () => `m${++idCounter}`;
const BOT_TYPE_DELAY = 700;

function useConversationFlow() {
  const [history, setHistory] = useState([]);
  const [stepId, setStepId] = useState("start");
  const [isTyping, setIsTyping] = useState(false);
  const [inputVisible, setInputVisible] = useState(false);
  const [trackerIndex, setTrackerIndex] = useState(null);
  const [consentSheet, setConsentSheet] = useState(null);
  const messagesRef = useRef(null);
  const startedRef = useRef(false);

  const pushBot = (entry) => setHistory((prev) => [...prev, { id: nextId(), sender: "bot", ...entry }]);
  const pushUser = (text) => setHistory((prev) => [...prev, { id: nextId(), sender: "user", kind: "text", text }]);
  const pushUserFile = (fileName, fileSize, rawFile, previewUrl) =>
    setHistory((prev) => [
      ...prev,
      { id: nextId(), sender: "user", kind: "file", fileName, fileSize, rawFile, previewUrl },
    ]);

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
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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
  const handleFileUploaded = (fileData) => {
    const fileName = typeof fileData === "string" ? fileData : fileData?.name || "Uploaded File.pdf";
    const fileSize = typeof fileData === "object" ? fileData?.size : "1.2 MB";
    const rawFile = typeof fileData === "object" ? fileData?.rawFile : null;
    const previewUrl = typeof fileData === "object" ? fileData?.previewUrl : null;

    pushUserFile(fileName, fileSize, rawFile, previewUrl);
    setInputVisible(false);
    runStep(input.next);
  };
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

  return {
    history,
    stepId,
    isTyping,
    inputVisible,
    trackerIndex,
    consentSheet,
    messagesRef,
    step,
    input,
    isTextStep,
    handleQuickReply,
    handleYesNo,
    handleCheckboxSubmit,
    handleFileUploaded,
    handleTextSubmit,
    handleConsentAccept,
    handleConsentBack,
  };
}

export default useConversationFlow;
