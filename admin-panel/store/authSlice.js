import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  admin: null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.admin = action.payload;
      state.loading = false;
    },
    loginFail: (state) => {
      state.isAuthenticated = false;
      state.loading = false;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.admin = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFail, logout } = authSlice.actions;
export default authSlice.reducer;
