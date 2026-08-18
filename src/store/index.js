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
        // File messages intentionally carry a live File object (rawFile)
        // and an object URL for in-session preview/thumbnailing (see
        // FileMessageCard) - both are already stripped before anything is
        // persisted to localStorage (conversationStorage.js's
        // setStoredHistory), so this only silences RTK's dev-only
        // non-serializable-value warning for a known, intentional case.
        ignoredActions: ["conversation/addUserFileMessage"],
        ignoredPaths: ["conversation.history"],
      },
    }),
});
