import { createSlice } from "@reduxjs/toolkit";
import { getLanguageCode } from "../../services/languagePreference";

// Persistence is called from App.jsx's handlers, not here - reducers stay free of side effects.
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
