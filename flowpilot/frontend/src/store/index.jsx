import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workflowReducer from './slices/workflowSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workflow: workflowReducer,
  },
});

