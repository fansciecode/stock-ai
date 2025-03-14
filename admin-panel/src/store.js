import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import businessesReducer from './slices/businessesSlice';
import deliveriesReducer from './slices/deliveriesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    businesses: businessesReducer,
    deliveries: deliveriesReducer,
  },
});

export default store; 