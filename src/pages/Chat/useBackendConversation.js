import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  nextId,
  sendConversationTurn,
  uploadConversationFile,
  addUserMessage,
  addUserFileMessage,
  clearInput,
  setUploadForInputId,
  setUploadStatus,
  setUploadProgress,
  setUploadError,
  applyMockResponse,
  selectHistory,
  selectInput,
  selectIsTyping,
  selectConversationError,
  selectUploadStatus,
  selectUploadProgress,
  selectUploadError,
  selectUploadForInputId,
} from "../../store/slices/conversationSlice";
import { setRegistrationCompleted, selectProgress, selectSessionEnded } from "../../store/slices/registrationSlice";
import { setStoredProgress, consumeFreshLoginFlag } from "../../services/conversationStorage";

// Wires the conversation/registration Redux slices to Chat.jsx, plus the
// imperative bits (refs, scrolling, retry) that don't belong in Redux state.
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

  // Refs don't belong in Redux state.
  const messagesRef = useRef(null);
  const startedRef = useRef(false);
  const lastActionRef = useRef(null);
  const isUploadingRef = useRef(false);

  // Write-on-change persistence, kept out of the reducers to stay pure.
  // History itself isn't persisted here - see conversationSlice's initialState.
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

  // ?mockInput=consentSequence - scripted two-turn sequence verifying
  // consent 1's message stays suppressed once resolved.
  const CONSENT_SEQUENCE_STEP_DELAY_MS = 400;
  const runConsentSequenceMock = ({ consentPrivacy, consentFraud }) => {
    dispatch(applyMockResponse({ ...consentPrivacy, __isFreshLogin: consumeFreshLoginFlag() }));
    setTimeout(() => {
      dispatch(addUserMessage("I Accept"));
      dispatch(applyMockResponse({ ...consentFraud, __isFreshLogin: false }));
    }, CONSENT_SEQUENCE_STEP_DELAY_MS);
  };

  const applyDevMock = (mockKey, DEV_MOCK_INPUTS) => {
    if (mockKey === "consentSequence") {
      runConsentSequenceMock(DEV_MOCK_INPUTS);
      return;
    }

    const mock = DEV_MOCK_INPUTS[mockKey];
    if (mock) {
      dispatch(applyMockResponse({ ...mock, __isFreshLogin: consumeFreshLoginFlag() }));
    } else {
      console.warn(`No dev mock registered for mockInput="${mockKey}"`, Object.keys(DEV_MOCK_INPUTS));
      runMessage(undefined);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Dev-only QA hatch (see devMocks.js) - stripped from prod since
    // import.meta.env.DEV is statically false there.
    if (import.meta.env.DEV) {
      const mockKey = new URLSearchParams(window.location.search).get("mockInput");
      if (mockKey) {
        import("./devMocks").then(({ DEV_MOCK_INPUTS }) => applyDevMock(mockKey, DEV_MOCK_INPUTS));
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
    dispatch(addUserMessage(text));
    dispatch(clearInput());
    runMessage(text);
  };

  const submitFile = async (file) => {
    // Guards against a second upload racing the first, regardless of how submitFile gets triggered.
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    const fileId = nextId();
    const targetInputId = input?.id ?? null;
    const previewUrl = URL.createObjectURL(file);
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
      // Error state is already applied by conversationSlice's rejected reducer.
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
};

export default useBackendConversation;
