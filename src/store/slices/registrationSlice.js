import { createSlice } from "@reduxjs/toolkit";
import { getRegistrationCompleted, setRegistrationCompleted } from "../../services/registrationState";
import { getStoredProgress } from "../../services/conversationStorage";
import {
  applyMockResponse,
  classifySessionEnded,
  sendConversationTurn,
  uploadConversationFile,
} from "./conversationSlice";

// Registration status/progress comes from the same backend responses as the
// conversation itself (see conversationSlice's two thunks) - this slice
// only reacts via extraReducers rather than duplicating the network calls.
const initialState = {
  progress: getRegistrationCompleted() ? 100 : getStoredProgress(),
  sessionEnded: getRegistrationCompleted(),
};

// Persisting the completed flag (setRegistrationCompleted) is a side
// effect, so it's deliberately NOT called from here - reducers must stay
// pure. See the sessionEnded-watching effect in useBackendConversation.
function applyRegistrationFromResponse(state, data) {
  // Order matters: progress is taken from the response first if present,
  // then overridden to 100 below if the response also means completion.
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
    // Same reasoning as conversationSlice's resetConversation: Redux's store
    // is a singleton and won't reset on its own when Chat unmounts on logout.
    // Dispatched alongside resetConversation from App.jsx.
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

// Re-exported so callers that need to persist the completed flag don't
// need to import registrationState.js directly too.
export { setRegistrationCompleted };

export default registrationSlice.reducer;
