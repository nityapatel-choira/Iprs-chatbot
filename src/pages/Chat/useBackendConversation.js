import { useEffect, useRef, useState } from "react";
import { sendMessage, uploadFile } from "../../services/conversationService";
import { getRegistrationCompleted, setRegistrationCompleted } from "../../services/registrationState";
import {
  getStoredHistory,
  setStoredHistory,
  getStoredProgress,
  setStoredProgress,
  consumeFreshLoginFlag,
} from "../../services/conversationStorage";

let idCounter = 1;
const nextId = () => `m${++idCounter}`;
// Purely cosmetic: how long the success checkmark stays visible before the
// uploader advances to the next question. The backend bundles the next
// input into the same upload response, so without this pause the success
// state would never actually be seen. Correctness does NOT depend on this
// value - see uploadForInputId below.
const UPLOAD_SUCCESS_HOLD_MS = 900;

function toRichTextMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages.map((msg) => ({
    id: nextId(),
    sender: "bot",
    kind: "richText",
    richText: msg?.content?.richText,
  }));
}

// The backend uses a second response shape for turns that don't go through
// the normal Typebot relay - most notably when the user's registration is
// already complete, it replies with { engine: "AI", reply: "<text>" }
// instead of { messages: [...], input: {...} }. This must render through
// the exact same message UI as a normal assistant message, so it's wrapped
// in the same richText node shape RichText already knows how to render,
// rather than inventing a second message kind/component. Only produces a
// message when `data.messages` has items, so a normal Typebot response is
// never double-rendered.
function replyToRichTextMessage(data) {
  if (Array.isArray(data?.messages) && data.messages.length > 0) return null;
  if (typeof data?.reply !== "string" || !data.reply.trim()) return null;
  return {
    id: nextId(),
    sender: "bot",
    kind: "richText",
    richText: [{ type: "p", children: [{ text: data.reply }] }],
  };
}

function extractMessageText(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg.trim();
  if (typeof msg.text === "string" && msg.text.trim()) return msg.text.trim();
  if (Array.isArray(msg.richText)) {
    return msg.richText
      .map((node) => {
        if (typeof node === "string") return node;
        if (node?.children && Array.isArray(node.children)) {
          return node.children.map((c) => c?.text || "").join(" ");
        }
        return "";
      })
      .join(" ")
      .trim();
  }
  return "";
}

function mergeBotMessages(existingHistory, newMessages) {
  if (!Array.isArray(newMessages) || newMessages.length === 0) return existingHistory;

  const updated = [...existingHistory];
  for (const msg of newMessages) {
    const newText = extractMessageText(msg);
    const lastMsg = updated[updated.length - 1];
    const lastText = extractMessageText(lastMsg);

    if (newText && lastText && newText === lastText) {
      continue;
    }

    updated.push(msg);
  }
  return updated;
}

function useBackendConversation() {
  const [history, setHistory] = useState(() => getStoredHistory());
  const [input, setInput] = useState(null);
  // If a previous session already confirmed registration is complete,
  // restore that instantly from localStorage - both `sessionEnded` (drives
  // the completed-state UI in Chat.jsx) and `isTyping` start from it, so a
  // refresh renders the exact same completed screen on the very first paint
  // instead of a loading/typing state that only resolves to it after the
  // network call below returns. The backend call still runs regardless (see
  // the mount effect) and remains the source of truth - this is purely
  // about not flickering through the wrong UI while waiting for it.
  const [isTyping, setIsTyping] = useState(() => !getRegistrationCompleted());
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(() => getRegistrationCompleted());
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  // Backend's overall registration progress (0-100), the sole source of
  // truth for the stepper - see components/StepTracker/stepProgress.js.
  // Kept at its last known value when a response omits the field, rather
  // than resetting to 0, so the stepper never jumps backwards on its own.
  const [progress, setProgress] = useState(() => {
    if (getRegistrationCompleted()) return 100;
    return getStoredProgress();
  });
  // Which file-input step (by backend input.id) the upload state above
  // belongs to. This is the actual source of truth for whether that state
  // should be shown - see Chat.jsx, which only renders it when this still
  // matches the currently active input.id, and treats any mismatch (a new
  // file-input step arrived) as a fresh, idle uploader regardless of timing.
  const [uploadForInputId, setUploadForInputId] = useState(null);

  const messagesRef = useRef(null);
  const startedRef = useRef(false);
  const lastActionRef = useRef(null);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    setStoredHistory(history);
  }, [history]);

  useEffect(() => {
    setStoredProgress(progress);
  }, [progress]);

  const pushUser = (text) => setHistory((prev) => [...prev, { id: nextId(), sender: "user", kind: "text", text }]);
  const pushUserFile = (id, fileName, fileSize, rawFile, previewUrl, status = "uploading") =>
    setHistory((prev) => [
      ...prev,
      { id, sender: "user", kind: "file", fileName, fileSize, rawFile, previewUrl, status },
    ]);

  const applyResponse = (data) => {
    const replyMessage = replyToRichTextMessage(data);
    const incomingMessages = replyMessage ? [replyMessage] : toRichTextMessages(data?.messages);

    if (typeof data?.progress === "number") {
      setProgress(data.progress);
    }

    // A `reply`-shaped response with no further `input` means there is
    // nothing left to answer (e.g. registration already complete) - treat
    // it as session-ended so the UI shows the completed state (tracker
    // hidden, no composer/choice/file input, first question never re-asked)
    // instead of leaving `input` null with no explanation.
    const isTerminalReply = Boolean(replyMessage) && !data?.input;
    const isSessionEnded = Boolean(data?.sessionEnded) || isTerminalReply;

    if (isSessionEnded) {
      setSessionEnded(true);
      setInput(null);
      setRegistrationCompleted(true);
      setProgress(100);

      if (incomingMessages.length > 0) {
        setHistory((prev) => mergeBotMessages(prev, incomingMessages));
      }
    } else {
      // The backend is always authoritative: a normal continuation response
      // means the conversation is still active, so any stale "completed"
      // state (e.g. left over from a previous session/user on this browser,
      // or the optimistic restore above turning out to be wrong) must be
      // cleared rather than sticking forever - `sessionEnded` otherwise
      // never has anywhere else to reset back to false.
      setSessionEnded(false);
      setRegistrationCompleted(false);
      setInput(data?.input ?? null);
      if (data?.input?.type === "file input") {
        setUploadStatus("idle");
        setUploadProgress(0);
        setUploadError("");
      }

      const isFreshLogin = consumeFreshLoginFlag();
      let messagesToAppend = incomingMessages;

      const hasProgress = (typeof data?.progress === "number" && data.progress > 0) || history.length > 0;
      if (isFreshLogin && hasProgress) {
        const inProgressNotice = {
          id: nextId(),
          sender: "bot",
          kind: "richText",
          richText: [{ type: "p", children: [{ text: "Your registration is still in progress." }] }],
        };
        messagesToAppend = [inProgressNotice, ...incomingMessages];
      }

      if (messagesToAppend.length > 0) {
        setHistory((prev) => mergeBotMessages(prev, messagesToAppend));
      }
    }
  };

  const runMessage = async (message) => {
    setIsTyping(true);
    setError(null);
    lastActionRef.current = () => runMessage(message);
    try {
      const data = await sendMessage(message);
      applyResponse(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Dev-only escape hatch for visually QA-ing cards the live backend
    // can't trigger yet (see devMocks.js) - e.g. `?mockInput=summary`.
    // import.meta.env.DEV is statically false in production builds, so
    // Vite dead-code-eliminates this whole branch (and its devMocks.js
    // import) out of the prod bundle.
    if (import.meta.env.DEV) {
      const mockKey = new URLSearchParams(window.location.search).get("mockInput");
      if (mockKey) {
        import("./devMocks").then(({ DEV_MOCK_INPUTS }) => {
          const mock = DEV_MOCK_INPUTS[mockKey];
          if (mock) {
            setIsTyping(false);
            applyResponse(mock);
          } else {
            console.warn(`No dev mock registered for mockInput="${mockKey}"`, Object.keys(DEV_MOCK_INPUTS));
            runMessage(undefined);
          }
        });
        return;
      }
    }

    runMessage(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history, isTyping]);

  const sendAnswer = (text) => {
    if (!text || !text.trim()) return;
    pushUser(text);
    setInput(null);
    runMessage(text);
  };

  const submitFile = async (file) => {
    // Belt-and-suspenders against a second upload racing the first (the UI
    // already disables the uploader while busy) - this guard makes it
    // impossible regardless of how submitFile gets triggered.
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    const fileId = nextId();
    const targetInputId = input?.id ?? null;
    const previewUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    pushUserFile(fileId, file.name, `${sizeMb} MB`, file, previewUrl, "uploading");
    setUploadForInputId(targetInputId);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    lastActionRef.current = () => submitFile(file);

    try {
      const data = await uploadFile(file, setUploadProgress);
      const isRejected = data?.input?.type === "file input";

      if (isRejected) {
        setUploadStatus("error");
        setHistory((prev) =>
          prev.map((msg) => (msg.id === fileId ? { ...msg, status: "error" } : msg))
        );
        applyResponse(data);
      } else {
        setUploadProgress(100);
        setUploadStatus("success");
        setHistory((prev) =>
          prev.map((msg) => (msg.id === fileId ? { ...msg, status: "success" } : msg))
        );
        await new Promise((resolve) => setTimeout(resolve, UPLOAD_SUCCESS_HOLD_MS));
        applyResponse(data);
      }
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err.message || "Upload failed. Please try again.");
      setHistory((prev) =>
        prev.map((msg) => (msg.id === fileId ? { ...msg, status: "error" } : msg))
      );
    } finally {
      isUploadingRef.current = false;
    }
  };

  const retry = () => {
    lastActionRef.current?.();
  };

  return {
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
  };
}

export default useBackendConversation;
