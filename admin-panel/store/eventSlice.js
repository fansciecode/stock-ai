import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  events: [],
  loading: false,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    fetchEventsStart: (state) => {
      state.loading = true;
    },
    fetchEventsSuccess: (state, action) => {
      state.events = action.payload;
      state.loading = false;
    },
    fetchEventsFail: (state) => {
      state.loading = false;
    },
  },
});

export const { fetchEventsStart, fetchEventsSuccess, fetchEventsFail } = eventSlice.actions;
export default eventSlice.reducer;
