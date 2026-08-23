import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import registrationReducer from "./slices/registrationSlice";
import conversationReducer from "./slices/conversationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    registration: registrationReducer,
    conversation: conversationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // File messages intentionally carry a live File object (rawFile) and
        // an object URL for preview/thumbnailing (see FileMessageCard) - both
        // are non-serializable by design, so this just silences RTK's dev warning.
        ignoredActions: ["conversation/addUserFileMessage"],
        ignoredPaths: ["conversation.history"],
      },
    }),
});
