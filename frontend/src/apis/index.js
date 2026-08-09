import API from '../config/apiClient.js';

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  profile: () => API.get('/auth/profile'),
};

// ── Tasks ─────────────────────────────────────────────────────
export const tasksAPI = {
  create: (data) => API.post('/tasks', data),
  list: (params) => API.get('/tasks', { params }),
  getById: (id) => API.get(`/tasks/${id}`),
  stats: () => API.get('/tasks/stats'),
  delete: (id) => API.delete(`/tasks/${id}`),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsAPI = {
  list: () => API.get('/reports'),
  getById: (id) => API.get(`/reports/${id}`),
  byTask: (taskId) => API.get(`/reports/task/${taskId}`),
};
