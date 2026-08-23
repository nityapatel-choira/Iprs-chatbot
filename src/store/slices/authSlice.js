import { createSlice } from "@reduxjs/toolkit";
import { getToken } from "../../services/tokenStorage";

// The JWT itself is never duplicated into Redux state - it stays only in
// tokenStorage/localStorage (read by apiClient on every request). This
// slice only tracks the derived boolean the rest of the app gates on.
const initialState = {
  isAuthenticated: Boolean(getToken()),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
  },
});

export const { setAuthenticated } = authSlice.actions;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;
