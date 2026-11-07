import api from './api';

// Auth
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

// Dashboard
export const dashboardService = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getRecentLeads: () => api.get('/dashboard/recent-leads'),
  getUpcomingActivities: () => api.get('/dashboard/upcoming-activities'),
  getTodaysTasks: () => api.get('/dashboard/todays-tasks'),
  getOverdueFollowups: () => api.get('/dashboard/overdue-followups'),
  getLeadsOverTime: (params) => api.get('/dashboard/leads-over-time', { params }),
  getLeadSourceDistribution: (params) => api.get('/dashboard/lead-source-distribution', { params }),
  getPipelineFunnel: (params) => api.get('/dashboard/pipeline-funnel', { params }),
  getRevenueOverTime: (params) => api.get('/dashboard/revenue-over-time', { params }),
  getDealStatusDistribution: (params) => api.get('/dashboard/deal-status-distribution', { params }),
};

// Leads
export const leadService = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  analyzeLead: (id) => api.post(`/leads/${id}/analyze`),
  getLeadAnalysis: (id) => api.get(`/leads/${id}/analysis`),
  checkDuplicates: (params) => api.get('/leads/check-duplicates', { params }),
  bulkUpdateStatus: (data) => api.post('/leads/bulk/status', data),
  bulkAssign: (data) => api.post('/leads/bulk/assign', data),
};

// Contacts
export const contactService = {
  getContacts: (params) => api.get('/contacts', { params }),
  getContact: (id) => api.get(`/contacts/${id}`),
  createContact: (data) => api.post('/contacts', data),
  updateContact: (id, data) => api.put(`/contacts/${id}`, data),
  deleteContact: (id) => api.delete(`/contacts/${id}`),
};

// Companies
export const companyService = {
  getCompanies: (params) => api.get('/companies', { params }),
  getCompany: (id) => api.get(`/companies/${id}`),
  createCompany: (data) => api.post('/companies', data),
  updateCompany: (id, data) => api.put(`/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/companies/${id}`),
};

// Deals
export const dealService = {
  getDeals: (params) => api.get('/deals', { params }),
  getPipeline: () => api.get('/deals/pipeline'),
  getDeal: (id) => api.get(`/deals/${id}`),
  createDeal: (data) => api.post('/deals', data),
  updateDeal: (id, data) => api.put(`/deals/${id}`, data),
  moveDealStage: (id, stage) => api.patch(`/deals/${id}/stage`, { stage }),
  deleteDeal: (id) => api.delete(`/deals/${id}`),
};

// Activities
export const activityService = {
  getActivities: (params) => api.get('/activities', { params }),
  getActivity: (id) => api.get(`/activities/${id}`),
  createActivity: (data) => api.post('/activities', data),
  updateActivity: (id, data) => api.put(`/activities/${id}`, data),
  completeActivity: (id) => api.patch(`/activities/${id}/complete`),
  rescheduleActivity: (id, dueAt) => api.patch(`/activities/${id}/reschedule`, { dueAt }),
  deleteActivity: (id) => api.delete(`/activities/${id}`),
};

// Tasks
export const taskService = {
  getTasks: (params) => api.get('/tasks', { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  completeTask: (id) => api.patch(`/tasks/${id}/complete`),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

// Notifications
export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Analytics
export const analyticsService = {
  getLeadGeneration: (params) => api.get('/analytics/lead-generation', { params }),
  getLeadConversion: (params) => api.get('/analytics/lead-conversion', { params }),
  getSalesPipeline: (params) => api.get('/analytics/sales-pipeline', { params }),
  getRevenue: (params) => api.get('/analytics/revenue', { params }),
  getDealPerformance: (params) => api.get('/analytics/deal-performance', { params }),
  getSalesRepPerformance: (params) => api.get('/analytics/sales-rep-performance', { params }),
  getActivityReport: (params) => api.get('/analytics/activities', { params }),
  getLeadSourcePerformance: (params) => api.get('/analytics/lead-source-performance', { params }),
};

// AI
export const aiService = {
  chat: (data) => api.post('/ai/assistant', data),
  generateEmail: (data) => api.post('/ai/generate-email', data),
  getBusinessInsights: () => api.get('/ai/insights'),
  testConnection: () => api.get('/ai/test'),
  getAISettings: () => api.get('/settings/ai'),
};

// Users
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  toggleUserActive: (id) => api.patch(`/users/${id}/toggle-active`),
};

// Settings
export const settingsService = {
  getOrgSettings: () => api.get('/settings/organization'),
  updateOrgSettings: (data) => api.put('/settings/organization', data),
};

// Import / Export
export const importService = {
  importLeads: (data) =>
    data instanceof FormData
      ? api.post('/import/leads', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/import/leads', typeof data === 'string' ? { csv: data } : data),
  importContacts: (data) =>
    data instanceof FormData
      ? api.post('/import/contacts', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/import/contacts', typeof data === 'string' ? { csv: data } : data),
};

export const exportService = {
  exportLeads: (params) => api.get('/export/leads', { params, responseType: 'blob' }),
  exportContacts: (params) => api.get('/export/contacts', { params, responseType: 'blob' }),
  exportDeals: (params) => api.get('/export/deals', { params, responseType: 'blob' }),
};

