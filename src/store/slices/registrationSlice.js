import { createSlice } from "@reduxjs/toolkit";
import { getRegistrationCompleted, setRegistrationCompleted } from "../../services/registrationState";
import { getStoredProgress } from "../../services/conversationStorage";
import {
  classifySessionEnded,
  sendConversationTurn,
  uploadConversationFile,
} from "./conversationSlice";

// Registration status/progress is populated from the exact same backend
// responses as the conversation itself (see conversationSlice's two
// thunks) - this slice only reacts to them via extraReducers rather than
// duplicating the network calls, so there's one request per turn, not two.
const initialState = {
  progress: getRegistrationCompleted() ? 100 : getStoredProgress(),
  sessionEnded: getRegistrationCompleted(),
};

// Persisting the completed flag (setRegistrationCompleted) is a side
// effect, so it's deliberately NOT called from here (reducers must stay
// pure) - see the sessionEnded-watching effect in useBackendConversation,
// which mirrors how history/progress persistence already worked before
// Redux (a useEffect keyed on the value, not inline in the state update).
function applyRegistrationFromResponse(state, data) {
  // Matches the original ordering exactly: progress is taken from the
  // response first if present, then overridden to 100 below if the
  // response also means the registration is complete.
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
    // See conversationSlice's resetConversation - same reasoning: the
    // Redux store is a singleton and won't reset on its own when Chat
    // unmounts on logout, unlike the old per-component useState. Dispatched
    // alongside resetConversation from App.jsx.
    resetRegistration: () => ({ progress: 0, sessionEnded: false }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendConversationTurn.fulfilled, (state, action) => applyRegistrationFromResponse(state, action.payload))
      .addCase(uploadConversationFile.fulfilled, (state, action) => applyRegistrationFromResponse(state, action.payload));
  },
});

export const { resetRegistration } = registrationSlice.actions;

export const selectProgress = (state) => state.registration.progress;
export const selectSessionEnded = (state) => state.registration.sessionEnded;

// Re-exported so callers that need to persist the completed flag don't
// need to import registrationState.js directly too.
export { setRegistrationCompleted };

export default registrationSlice.reducer;
