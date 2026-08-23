import { createSlice } from "@reduxjs/toolkit";
import { getToken } from "../../services/tokenStorage";

// JWT stays in tokenStorage/localStorage only - this slice just tracks the derived boolean.
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
