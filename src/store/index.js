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
        // File messages carry a live File object + object URL (see
        // FileMessageCard) - non-serializable by design, silences RTK's dev warning.
        ignoredActions: ["conversation/addUserFileMessage"],
        ignoredPaths: ["conversation.history"],
      },
    }),
});
