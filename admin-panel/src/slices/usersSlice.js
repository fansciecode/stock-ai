import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  total: 0,
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action) => {
      state.loading = false;
      state.users = action.payload.users;
      state.total = action.payload.total;
    },
    fetchUsersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserSuccess: (state, action) => {
      const index = state.users.findIndex(user => user._id === action.payload._id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUserSuccess: (state, action) => {
      state.users = state.users.filter(user => user._id !== action.payload);
      state.total -= 1;
    },
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  updateUserSuccess,
  deleteUserSuccess,
} = usersSlice.actions;

export default usersSlice.reducer; 