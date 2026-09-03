import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { sendMessage, uploadFile } from "../../services/conversationService";
import { getRegistrationCompleted } from "../../services/registrationState";
import { consumeFreshLoginFlag } from "../../services/conversationStorage";

let idCounter = 1;
export const nextId = () => `m${++idCounter}`;

// Brief delay so user sees upload success before next step.
const UPLOAD_SUCCESS_HOLD_MS = 900;

function toRichTextMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const result = [];
  for (const msg of messages) {
    const converted = {
      id: nextId(),
      sender: "bot",
      kind: "richText",
      richText: msg?.content?.richText,
    };
    if (extractMessageText(converted)) {
      result.push(converted);
    }
  }
  return result;
}

// Wraps terminal AI reply as a richText message.
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
      .join("\n")
      .trim();
  }
  return "";
}

function mergeBotMessages(existingHistory, newMessages) {
  if (!Array.isArray(newMessages) || newMessages.length === 0) return existingHistory;

  const updated = [...existingHistory];
  for (const msg of newMessages) {
    const newText = extractMessageText(msg);
    if (!newText && msg.kind !== "file" && msg.kind !== "summaryCard") {
      continue;
    }
    const lastMsg = updated[updated.length - 1];
    const lastText = extractMessageText(lastMsg);

    if (newText && lastText && newText === lastText) {
      continue;
    }

    updated.push(msg);
  }
  return updated;
}

// Session ends if backend flags it or returns a terminal reply with no input left.
export function classifySessionEnded(data) {
  const replyMessage = replyToRichTextMessage(data);
  const isTerminalReply = Boolean(replyMessage) && !data?.input;
  return Boolean(data?.sessionEnded) || isTerminalReply;
}

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

export const sendConversationTurn = createAsyncThunk("conversation/sendTurn", async (message) => {
  const data = await sendMessage(message);
  return { ...data, __isFreshLogin: consumeFreshLoginFlag() };
});

export const uploadConversationFile = createAsyncThunk(
  "conversation/uploadFile",
  async ({ file, fileId }, { dispatch, rejectWithValue }) => {
    try {
      const data = await uploadFile(file, (pct) => dispatch(setUploadProgress(pct)));
      dispatch(setFileMessageStatus({ fileId, status: "success" }));
      dispatch(setUploadProgress(100));
      dispatch(setUploadStatus("success"));
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_SUCCESS_HOLD_MS));

      return { ...data, __isFreshLogin: consumeFreshLoginFlag() };
    } catch (err) {
      dispatch(setFileMessageStatus({ fileId, status: "error" }));
      return rejectWithValue(err.message || "Upload failed. Please try again.");
    }
  }
);

const initialState = {
  history: [],
  input: null,
  // Prevents typing indicator flicker on restored completed sessions.
  isTyping: !getRegistrationCompleted(),
  error: null,
  uploadStatus: "idle",
  uploadProgress: 0,
  uploadError: "",
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
