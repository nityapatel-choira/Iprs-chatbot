import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sendMessage, uploadFile } from "../../services/conversationService";
import { getRegistrationCompleted } from "../../services/registrationState";
import { consumeFreshLoginFlag } from "../../services/conversationStorage";

// Same id scheme as before (module-level counter) - exported so the
// upload path can pre-generate a message id before dispatching (it needs
// the id up front to correlate the eventual success/error status update
// with the right history entry; see submitFile in useBackendConversation).
let idCounter = 1;
export const nextId = () => `m${++idCounter}`;

// How long the success checkmark stays visible before the uploader
// advances to the next question. The backend bundles the next input into
// the same upload response, so without this pause the success state would
// never actually be seen. Correctness does not depend on this value.
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
// in the same richText node shape RichText already knows how to render.
// Only produces a message when `data.messages` has items, so a normal
// Typebot response is never double-rendered.
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

export function extractMessageText(msg) {
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

// A response is "session-ended" if the backend explicitly says so, or if
// it replied with the terminal AI-reply shape and nothing left to answer.
// Exported for registrationSlice, which needs the same classification to
// decide sessionEnded/progress - written once here rather than duplicated.
export function classifySessionEnded(data) {
  const replyMessage = replyToRichTextMessage(data);
  const isTerminalReply = Boolean(replyMessage) && !data?.input;
  return Boolean(data?.sessionEnded) || isTerminalReply;
}

// Shared by both thunks' `fulfilled` reducers and the dev-mock action -
// mirrors the original useBackendConversation's `applyResponse`, minus the
// progress/sessionEnded bits (registrationSlice owns those - see
// applyRegistrationFromResponse there). Reducers must stay pure, so
// `data.__isFreshLogin` is computed by the thunk (an async function, where
// side effects are expected) rather than this function calling
// consumeFreshLoginFlag() itself.
function applyConversationResponse(state, data) {
  const replyMessage = replyToRichTextMessage(data);
  const incomingMessages = replyMessage ? [replyMessage] : toRichTextMessages(data?.messages);
  const isSessionEnded = classifySessionEnded(data);

  if (isSessionEnded) {
    state.input = null;
    if (incomingMessages.length > 0) {
      state.history = mergeBotMessages(state.history, incomingMessages);
    }
  } else {
    state.input = data?.input ?? null;
    if (data?.input?.type === "file input") {
      state.uploadStatus = "idle";
      state.uploadProgress = 0;
      state.uploadError = "";
    }

    let messagesToAppend = incomingMessages;
    const hasProgress = (typeof data?.progress === "number" && data.progress > 0) || state.history.length > 0;
    if (data?.__isFreshLogin && hasProgress) {
      const inProgressNotice = {
        id: nextId(),
        sender: "bot",
        kind: "richText",
        richText: [{ type: "p", children: [{ text: "Your registration is still in progress." }] }],
      };
      messagesToAppend = [inProgressNotice, ...incomingMessages];
    }

    if (messagesToAppend.length > 0) {
      state.history = mergeBotMessages(state.history, messagesToAppend);
    }
  }
}

// The mount-time "resume" call and every answer both go through this -
// same endpoint, `message` omitted for the initial resume.
export const sendConversationTurn = createAsyncThunk("conversation/sendTurn", async (message) => {
  const data = await sendMessage(message);
  return { ...data, __isFreshLogin: consumeFreshLoginFlag() };
});

export const uploadConversationFile = createAsyncThunk(
  "conversation/uploadFile",
  async ({ file, fileId }, { dispatch, rejectWithValue }) => {
    try {
      const data = await uploadFile(file, (pct) => dispatch(setUploadProgress(pct)));
      // The backend re-asking for "file input" means it rejected the file
      // (bad format, failed validation, etc.) rather than accepting it.
      const isRejected = data?.input?.type === "file input";
      dispatch(setFileMessageStatus({ fileId, status: isRejected ? "error" : "success" }));

      if (isRejected) {
        dispatch(setUploadStatus("error"));
      } else {
        dispatch(setUploadProgress(100));
        dispatch(setUploadStatus("success"));
        // See UPLOAD_SUCCESS_HOLD_MS above.
        await new Promise((resolve) => setTimeout(resolve, UPLOAD_SUCCESS_HOLD_MS));
      }

      return { ...data, __isFreshLogin: consumeFreshLoginFlag() };
    } catch (err) {
      dispatch(setFileMessageStatus({ fileId, status: "error" }));
      return rejectWithValue(err.message || "Upload failed. Please try again.");
    }
  }
);

const initialState = {
  // Always starts empty rather than being seeded from localStorage: the
  // mount-time resume call below (sendConversationTurn(undefined)) is the
  // one and only way history gets populated, on first-ever load and on
  // every refresh alike. That keeps this the exact same code path both
  // times - the backend's response is rendered as-is, never merged with a
  // locally-persisted transcript that could disagree with it.
  history: [],
  input: null,
  // Restoring a previously-completed registration instantly (see
  // registrationSlice) means this should start "not typing" too, so the
  // completed screen renders on the very first paint instead of flickering
  // through a loading state - the resume call below still runs regardless
  // and remains authoritative.
  isTyping: !getRegistrationCompleted(),
  error: null,
  uploadStatus: "idle",
  uploadProgress: 0,
  uploadError: "",
  // Which file-input step (by backend input.id) uploadStatus/Progress/Error
  // belong to - the UI only trusts that state when it still matches the
  // currently active input.id, treating any mismatch as a fresh uploader.
  uploadForInputId: null,
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      state.history.push({ id: nextId(), sender: "user", kind: "text", text: action.payload });
    },
    addUserFileMessage: (state, action) => {
      state.history.push(action.payload);
    },
    clearInput: (state) => {
      state.input = null;
    },
    setFileMessageStatus: (state, action) => {
      const { fileId, status } = action.payload;
      const message = state.history.find((msg) => msg.id === fileId);
      if (message) message.status = status;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    setUploadStatus: (state, action) => {
      state.uploadStatus = action.payload;
    },
    setUploadForInputId: (state, action) => {
      state.uploadForInputId = action.payload;
    },
    setUploadError: (state, action) => {
      state.uploadError = action.payload;
    },
    // Dev-only escape hatch (see useBackendConversation's devMocks.js
    // branch) for visually QA-ing cards the live backend can't trigger
    // yet - applies a canned response through the exact same reducer logic
    // as a real turn, without going through a thunk/network call.
    applyMockResponse: (state, action) => {
      applyConversationResponse(state, action.payload);
      state.isTyping = false;
    },
    // Unlike the old per-component useState version of this hook, Redux's
    // store is a singleton that outlives Chat unmounting on logout - it
    // won't reset itself for free the way component state used to.
    // Dispatched from App.jsx's handleLogout/onUnauthorized alongside the
    // existing clearStoredConversation() localStorage clear, so a
    // subsequent login never starts from a stale in-memory conversation.
    resetConversation: () => ({
      history: [],
      input: null,
      isTyping: true,
      error: null,
      uploadStatus: "idle",
      uploadProgress: 0,
      uploadError: "",
      uploadForInputId: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendConversationTurn.pending, (state) => {
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendConversationTurn.fulfilled, (state, action) => {
        applyConversationResponse(state, action.payload);
        state.isTyping = false;
      })
      .addCase(sendConversationTurn.rejected, (state, action) => {
        state.error = action.error?.message || "Something went wrong. Please try again.";
        state.isTyping = false;
      })
      .addCase(uploadConversationFile.fulfilled, (state, action) => {
        applyConversationResponse(state, action.payload);
      })
      .addCase(uploadConversationFile.rejected, (state, action) => {
        state.uploadStatus = "error";
        state.uploadError = action.payload || "Upload failed. Please try again.";
      });
  },
});

export const {
  addUserMessage,
  addUserFileMessage,
  clearInput,
  setFileMessageStatus,
  setUploadProgress,
  setUploadStatus,
  setUploadForInputId,
  setUploadError,
  applyMockResponse,
  resetConversation,
} = conversationSlice.actions;

export const selectHistory = (state) => state.conversation.history;
export const selectInput = (state) => state.conversation.input;
export const selectIsTyping = (state) => state.conversation.isTyping;
export const selectConversationError = (state) => state.conversation.error;
export const selectUploadStatus = (state) => state.conversation.uploadStatus;
export const selectUploadProgress = (state) => state.conversation.uploadProgress;
export const selectUploadError = (state) => state.conversation.uploadError;
export const selectUploadForInputId = (state) => state.conversation.uploadForInputId;

export default conversationSlice.reducer;
