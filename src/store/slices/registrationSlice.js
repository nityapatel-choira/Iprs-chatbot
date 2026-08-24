import { createSlice } from "@reduxjs/toolkit";
import { getRegistrationCompleted, setRegistrationCompleted } from "../../services/registrationState";
import { getStoredProgress } from "../../services/conversationStorage";
import {
  applyMockResponse,
  classifySessionEnded,
  sendConversationTurn,
  uploadConversationFile,
} from "./conversationSlice";

const initialState = {
  progress: getRegistrationCompleted() ? 100 : getStoredProgress(),
  sessionEnded: getRegistrationCompleted(),
};

function applyRegistrationFromResponse(state, data) {
  // Progress is set to 100% on session completion.
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

export { setRegistrationCompleted };

export default registrationSlice.reducer;
