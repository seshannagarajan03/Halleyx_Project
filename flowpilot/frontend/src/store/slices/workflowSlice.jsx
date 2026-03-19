import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeWorkflow: null,
  activeExecution: null,
  isExecuting: false,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setActiveWorkflow: (state, action) => {
      state.activeWorkflow = action.payload;
    },
    setActiveExecution: (state, action) => {
      state.activeExecution = action.payload;
    },
    updateExecutionLogs: (state, action) => {
      if (state.activeExecution && state.activeExecution._id === action.payload.id) {
        state.activeExecution.status = action.payload.status;
        state.activeExecution.logs = action.payload.logs;
        state.activeExecution.current_step_id = action.payload.current_step_id;
      }
    },
    setExecuting: (state, action) => {
      state.isExecuting = action.payload;
    },
  },
});

export const { setActiveWorkflow, setActiveExecution, updateExecutionLogs, setExecuting } = workflowSlice.actions;
export default workflowSlice.reducer;
