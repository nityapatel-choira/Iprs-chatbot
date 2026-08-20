import { createSlice } from "@reduxjs/toolkit";
import { getLanguageCode } from "../../services/languagePreference";

// Deliberately minimal - only the selected language today. Persistence
// (setLanguageCode/clearLanguageCode) is called from App.jsx's handlers
// alongside these actions, same two-call pattern the app already used
// before Redux (one call to persist, one to update state) - not duplicated
// here to keep this slice's reducers free of side effects.
const initialState = {
  languageCode: getLanguageCode(),
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.languageCode = action.payload;
    },
    clearLanguage: (state) => {
      state.languageCode = null;
    },
  },
});

export const { setLanguage, clearLanguage } = uiSlice.actions;

export const selectLanguageCode = (state) => state.ui.languageCode;

export default uiSlice.reducer;
