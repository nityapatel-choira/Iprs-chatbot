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
import { setStoredHistory, setStoredProgress, consumeFreshLoginFlag } from "../../services/conversationStorage";

// This hook is the one integration point between the conversation/
// registration Redux slices and Chat.jsx - it reads via useAppSelector and
// dispatches actions/thunks, but returns the exact same shape it did as a
// plain useState-based hook, so Chat.jsx (and every card component it
// renders) needed zero changes for the Redux migration. See
// store/slices/conversationSlice.js and registrationSlice.js for where the
// actual state/logic now lives - this file is just wiring + the imperative
// bits (refs, scrolling, retry bookkeeping) that never belonged in Redux
// state to begin with.
function useBackendConversation() {
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

  // Imperative bookkeeping that was never state in the first place - refs
  // don't belong in Redux, so these stay exactly as they were.
  const messagesRef = useRef(null);
  const startedRef = useRef(false);
  const lastActionRef = useRef(null);
  const isUploadingRef = useRef(false);

  // Mirrors the pre-Redux useEffect-based persistence exactly (write on
  // change), just watching the Redux-selected values now instead of local
  // state. Kept out of the slice reducers themselves so reducers stay pure
  // - see the comments in conversationSlice.js/registrationSlice.js.
  useEffect(() => {
    setStoredHistory(history);
  }, [history]);

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
            dispatch(applyMockResponse({ ...mock, __isFreshLogin: consumeFreshLoginFlag() }));
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
    dispatch(addUserMessage(text));
    dispatch(clearInput());
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
      // Error state is already applied by conversationSlice's rejected
      // reducer - nothing further to do here.
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
