import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import userReducer from "./userSlice.js";
import eventReducer from "./eventSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    events: eventReducer,
  },
});

export default store;
