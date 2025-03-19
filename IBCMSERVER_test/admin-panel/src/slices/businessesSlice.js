import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  businesses: [],
  total: 0,
  loading: false,
  error: null,
};

const businessesSlice = createSlice({
  name: 'businesses',
  initialState,
  reducers: {
    fetchBusinessesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBusinessesSuccess: (state, action) => {
      state.loading = false;
      state.businesses = action.payload.businesses;
      state.total = action.payload.total;
    },
    fetchBusinessesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateBusinessSuccess: (state, action) => {
      const index = state.businesses.findIndex(business => business._id === action.payload._id);
      if (index !== -1) {
        state.businesses[index] = action.payload;
      }
    },
    verifyBusinessSuccess: (state, action) => {
      const index = state.businesses.findIndex(business => business._id === action.payload);
      if (index !== -1) {
        state.businesses[index].status = 'verified';
      }
    },
    rejectBusinessSuccess: (state, action) => {
      const index = state.businesses.findIndex(business => business._id === action.payload.id);
      if (index !== -1) {
        state.businesses[index].status = 'rejected';
        state.businesses[index].rejectionReason = action.payload.reason;
      }
    },
  },
});

export const {
  fetchBusinessesStart,
  fetchBusinessesSuccess,
  fetchBusinessesFailure,
  updateBusinessSuccess,
  verifyBusinessSuccess,
  rejectBusinessSuccess,
} = businessesSlice.actions;

export default businessesSlice.reducer; 