import { createSlice } from "@reduxjs/toolkit";
import { getRegistrationCompleted, setRegistrationCompleted } from "../../services/registrationState";
import { getStoredProgress } from "../../services/conversationStorage";
import {
  applyMockResponse,
  classifySessionEnded,
  sendConversationTurn,
  uploadConversationFile,
} from "./conversationSlice";

// Progress/status come from the same backend responses conversationSlice
// already gets - this slice only reacts via extraReducers.
const initialState = {
  progress: getRegistrationCompleted() ? 100 : getStoredProgress(),
  sessionEnded: getRegistrationCompleted(),
};

// Persisting the completed flag is a side effect, so it's not done here -
// reducers must stay pure. See useBackendConversation's sessionEnded effect.
function applyRegistrationFromResponse(state, data) {
  // Order matters: progress from the response first, then overridden to 100 on completion.
  if (typeof data?.progress === "number") {
    state.progress = data.progress;
  }

  if (classifySessionEnded(data)) {
    state.sessionEnded = true;
    state.progress = 100;
  } else {
    state.sessionEnded = false;
  }
}

const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    // Same reasoning as conversationSlice's resetConversation - dispatched alongside it from App.jsx.
    resetRegistration: () => ({ progress: 0, sessionEnded: false }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendConversationTurn.fulfilled, (state, action) => applyRegistrationFromResponse(state, action.payload))
      .addCase(uploadConversationFile.fulfilled, (state, action) => applyRegistrationFromResponse(state, action.payload))
      .addCase(applyMockResponse, (state, action) => applyRegistrationFromResponse(state, action.payload));
  },
});

export const { resetRegistration } = registrationSlice.actions;

export const selectProgress = (state) => state.registration.progress;
export const selectSessionEnded = (state) => state.registration.sessionEnded;

// Re-exported so callers don't need to also import registrationState.js.
export { setRegistrationCompleted };

export default registrationSlice.reducer;
