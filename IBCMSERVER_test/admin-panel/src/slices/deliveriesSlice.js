import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  deliveries: [],
  total: 0,
  loading: false,
  error: null,
};

const deliveriesSlice = createSlice({
  name: 'deliveries',
  initialState,
  reducers: {
    fetchDeliveriesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDeliveriesSuccess: (state, action) => {
      state.loading = false;
      state.deliveries = action.payload.deliveries;
      state.total = action.payload.total;
    },
    fetchDeliveriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateDeliveryStatusSuccess: (state, action) => {
      const index = state.deliveries.findIndex(delivery => delivery._id === action.payload.id);
      if (index !== -1) {
        state.deliveries[index].status = action.payload.status;
      }
    },
  },
});

export const {
  fetchDeliveriesStart,
  fetchDeliveriesSuccess,
  fetchDeliveriesFailure,
  updateDeliveryStatusSuccess,
} = deliveriesSlice.actions;

export default deliveriesSlice.reducer; 