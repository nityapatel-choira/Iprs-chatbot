import { createSlice } from "@reduxjs/toolkit";
import { getToken } from "../../services/tokenStorage";

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
