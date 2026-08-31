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
        // Ignores non-serializable File objects in conversation history.
        ignoredActions: ["conversation/addUserFileMessage"],
        ignoredPaths: ["conversation.history"],
      },
    }),
});
