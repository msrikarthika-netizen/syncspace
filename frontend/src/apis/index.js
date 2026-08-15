import API from '../config/apiClient.js';

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  profile: () => API.get('/auth/profile'),
  updateProfile: (data) => API.patch('/auth/profile', data),
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

// ── Administration (server enforces admin role on every endpoint) ──────────
export const adminAPI = {
  dashboard: () => API.get('/admin/dashboard'),
  users: (params) => API.get('/admin/users', { params }),
  updateUser: (userId, data) => API.patch(`/admin/users/${userId}`, data),
  tasks: (params) => API.get('/admin/tasks', { params }),
  moderateTask: (taskId, data) => API.post(`/admin/tasks/${taskId}/moderate`, data),
  reports: (params) => API.get('/admin/reports', { params }),
  deleteReport: (reportId, data) => API.delete(`/admin/reports/${reportId}`, { data }),
  monitoring: () => API.get('/admin/monitoring'),
  auditLogs: (params) => API.get('/admin/audit-logs', { params }),
};
