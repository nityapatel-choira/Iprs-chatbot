import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sendMessage, uploadFile } from "../../services/conversationService";
import { getRegistrationCompleted } from "../../services/registrationState";
import { consumeFreshLoginFlag } from "../../services/conversationStorage";

// Exported so submitFile can pre-generate an id to correlate later status updates.
let idCounter = 1;
export const nextId = () => `m${++idCounter}`;

// Backend bundles the next input into the upload response, so pause here
// or the success state is never seen.
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

// Backend sometimes replies { engine: "AI", reply } instead of { messages,
// input } (e.g. once registration is complete) - wrapped as richText so it
// renders normally.
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

// "Session-ended" = backend says so, or it replied with the terminal AI
// shape and no input left. Exported for registrationSlice.
export function classifySessionEnded(data) {
  const replyMessage = replyToRichTextMessage(data);
  const isTerminalReply = Boolean(replyMessage) && !data?.input;
  return Boolean(data?.sessionEnded) || isTerminalReply;
}

// Shared by both thunks and the dev-mock action. __isFreshLogin is computed
// by the thunk, not here - reducers must stay pure.
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

// Same endpoint for the initial resume and every answer - message is omitted for resume.
export const sendConversationTurn = createAsyncThunk("conversation/sendTurn", async (message) => {
  const data = await sendMessage(message);
  return { ...data, __isFreshLogin: consumeFreshLoginFlag() };
});

export const uploadConversationFile = createAsyncThunk(
  "conversation/uploadFile",
  async ({ file, fileId }, { dispatch, rejectWithValue }) => {
    try {
      const data = await uploadFile(file, (pct) => dispatch(setUploadProgress(pct)));
      // Backend re-asking for "file input" means it rejected the file.
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
  // Only the mount-time resume call populates history - never seeded from stale local data.
  history: [],
  input: null,
  // Avoids flickering through a loading state when a completed registration is restored.
  isTyping: !getRegistrationCompleted(),
  error: null,
  uploadStatus: "idle",
  uploadProgress: 0,
  uploadError: "",
  // Ties uploadStatus/Progress/Error to a specific input.id - a mismatch means a fresh uploader.
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
    // Dev-only (see devMocks.js): applies a canned response through the
    // same reducer logic, no network call.
    applyMockResponse: (state, action) => {
      applyConversationResponse(state, action.payload);
      state.isTyping = false;
    },
    // Redux's store outlives Chat unmounting - dispatched on logout so a
    // new login doesn't inherit stale state.
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
