import api from './client';

export const workflowApi = {
  getAll: (params) => api.get('/workflows', { params }).then((res) => res.data),
  getOne: (id) => api.get(`/workflows/${id}`).then((res) => res.data),
  create: (data) => api.post('/workflows', data).then((res) => res.data),
  update: (id, data) => api.put(`/workflows/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/workflows/${id}`).then((res) => res.data),
  getSteps: (workflowId) => api.get(`/workflows/${workflowId}/steps`).then((res) => res.data),
  createStep: (workflowId, data) => api.post(`/workflows/${workflowId}/steps`, data).then((res) => res.data),
  updateStep: (id, data) => api.put(`/steps/${id}`, data).then((res) => res.data),
  deleteStep: (id) => api.delete(`/steps/${id}`).then((res) => res.data),
  getRules: (stepId) => api.get(`/steps/${stepId}/rules`).then((res) => res.data),
  createRule: (stepId, data) => api.post(`/steps/${stepId}/rules`, data).then((res) => res.data),
  updateRule: (id, data) => api.put(`/rules/${id}`, data).then((res) => res.data),
  deleteRule: (id) => api.delete(`/rules/${id}`).then((res) => res.data),
  execute: (workflowId, data) => api.post(`/workflows/${workflowId}/execute`, data).then((res) => res.data),
};

export const executionApi = {
  getAll: (params) => api.get('/executions', { params }).then((res) => res.data),
  getOne: (id) => api.get(`/executions/${id}`).then((res) => res.data),
  cancel: (id) => api.post(`/executions/${id}/cancel`).then((res) => res.data),
  resume: (id, data) => api.post(`/executions/${id}/resume`, data).then((res) => res.data),
  retry: (id) => api.post(`/executions/${id}/retry`).then((res) => res.data),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data).then((res) => res.data),
  register: (data) => api.post('/auth/register', data).then((res) => res.data),
};
