import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  nextId,
  sendConversationTurn,
  triggerPayuIntegration,
  verifyPayment,
  uploadConversationFile,
  addUserMessage,
  addUserFileMessage,
  clearInput,
  clearPaymentResult,
  setUploadForInputId,
  setUploadStatus,
  setUploadProgress,
  setUploadError,
  selectHistory,
  selectInput,
  selectIsTyping,
  selectConversationError,
  selectUploadStatus,
  selectUploadProgress,
  selectUploadError,
  selectUploadForInputId,
  selectPayuPayload,
  selectIsPaymentStep,
} from "../../store/slices/conversationSlice";
import { setRegistrationCompleted, selectProgress, selectSessionEnded } from "../../store/slices/registrationSlice";
import { setStoredProgress } from "../../services/conversationStorage";
import { t } from "../../i18n";

// Custom hook managing conversation state and UI interactions.
const useBackendConversation = () => {
  const dispatch = useAppDispatch();
  const history = useAppSelector(selectHistory);
  const input = useAppSelector(selectInput);
  const isTyping = useAppSelector(selectIsTyping);
  const error = useAppSelector(selectConversationError);
  const sessionEnded = useAppSelector(selectSessionEnded);
  const progress = useAppSelector(selectProgress);
  const uploadStatus = useAppSelector(selectUploadStatus);
  const uploadProgress = useAppSelector(selectUploadProgress);
  const uploadError = useAppSelector(selectUploadError);
  const uploadForInputId = useAppSelector(selectUploadForInputId);
  const payuPayload = useAppSelector(selectPayuPayload);
  const isPaymentStepFromBackend = useAppSelector(selectIsPaymentStep);

  const messagesRef = useRef(null);
  const startedRef = useRef(false);
  const lastActionRef = useRef(null);
  const isUploadingRef = useRef(false);
  const createdUrlsRef = useRef(new Set());

  useEffect(() => {
    const createdUrls = createdUrlsRef.current;
    if (history.length === 0 && createdUrls.size > 0) {
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
      createdUrls.clear();
    }
  }, [history.length]);

  useEffect(() => {
    setStoredProgress(progress);
  }, [progress]);

  useEffect(() => {
    setRegistrationCompleted(sessionEnded);
  }, [sessionEnded]);

  const runMessage = (message) => {
    lastActionRef.current = () => runMessage(message);
    dispatch(sendConversationTurn(message));
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    
    // Check for payment callback transaction ID
    const txnId = new URLSearchParams(window.location.search).get("txnid");

    // Always restore session from backend to prevent mobile restart issues
    runMessage(undefined);

    if (txnId) {
      // Clean up URL to avoid re-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      dispatch(verifyPayment(txnId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history, isTyping]);

  // Always relay the visible label, never an item id/key: the backend saves this text as-is into
  // the member's record (e.g. ApplicantPath, which the fee is looked up from) and matches replies
  // like "Yes"/"Start over" by text.
  const sendAnswer = (text) => {
    if (!text || !text.trim()) return;
    dispatch(addUserMessage(text));
    dispatch(clearInput());
    runMessage(text);
  };

  const triggerPayment = () => {
    dispatch(addUserMessage("Pay"));
    dispatch(clearInput());
    
    lastActionRef.current = () => triggerPayment();
    dispatch(triggerPayuIntegration());
  };

  const submitFile = async (file) => {
    // Prevents concurrent upload submissions.
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    const fileId = nextId();
    const targetInputId = input?.id ?? null;
    const previewUrl = URL.createObjectURL(file);
    createdUrlsRef.current.add(previewUrl);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    dispatch(
      addUserFileMessage({
        id: fileId,
        sender: "user",
        kind: "file",
        fileName: file.name,
        fileSize: `${sizeMb} MB`,
        rawFile: file,
        previewUrl,
        status: "uploading",
      })
    );
    dispatch(setUploadForInputId(targetInputId));
    dispatch(setUploadStatus("uploading"));
    dispatch(setUploadProgress(0));
    dispatch(setUploadError(""));
    lastActionRef.current = () => submitFile(file);

    try {
      await dispatch(uploadConversationFile({ file, fileId })).unwrap();
    } catch {
      // Ignore upload rejection
    } finally {
      isUploadingRef.current = false;
    }
  };

  const retry = () => {
    lastActionRef.current?.();
  };

  const dismissPaymentResult = () => {
    dispatch(clearPaymentResult());
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
    payuPayload,
    isPaymentStepFromBackend,
    messagesRef,
    sendAnswer,
    triggerPayment,
    submitFile,
    retry,
    dismissPaymentResult,
  };
};

export default useBackendConversation;
