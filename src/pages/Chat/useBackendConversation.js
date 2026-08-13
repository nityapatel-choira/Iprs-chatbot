import { useEffect, useRef, useState } from "react";
import { sendMessage, uploadFile } from "../../services/conversationService";

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

function useBackendConversation() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
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

  const pushBot = (entries) => setHistory((prev) => [...prev, ...entries]);
  const pushUser = (text) => setHistory((prev) => [...prev, { id: nextId(), sender: "user", kind: "text", text }]);
  const pushUserFile = (fileName, fileSize, rawFile, previewUrl) =>
    setHistory((prev) => [
      ...prev,
      { id: nextId(), sender: "user", kind: "file", fileName, fileSize, rawFile, previewUrl },
    ]);

  const applyResponse = (data) => {
    pushBot(toRichTextMessages(data?.messages));
    if (data?.sessionEnded) {
      setSessionEnded(true);
      setInput(null);
    } else {
      setInput(data?.input ?? null);
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

    const targetInputId = input?.id ?? null;
    const previewUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    pushUserFile(file.name, `${sizeMb} MB`, file, previewUrl);
    setUploadForInputId(targetInputId);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    lastActionRef.current = () => submitFile(file);

    try {
      const data = await uploadFile(file, setUploadProgress);
      setUploadStatus("success");
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_SUCCESS_HOLD_MS));
      applyResponse(data);
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err.message || "Upload failed. Please try again.");
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
