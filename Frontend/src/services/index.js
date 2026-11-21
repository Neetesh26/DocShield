import api from './api';

export * from './authService';
export * from './documentService';

export const storageService = {
  getLocations: async (params = {}) => {
    const res = await api.get('/storage/locations', { params });
    return res.data;
  },
  getHierarchy: async () => {
    const res = await api.get('/storage/hierarchy');
    return res.data;
  },
  getLocationById: async (id) => {
    const res = await api.get(`/storage/locations/${id}`);
    return res.data;
  },
  moveDocument: async (documentId, newLocationId, remarks) => {
    const res = await api.post('/storage/move-document', { documentId, newLocationId, remarks });
    return res.data;
  }
};

export const requestService = {
  createRequest: async (data) => {
    const res = await api.post('/requests', data);
    return res.data;
  },
  getRequests: async (params = {}) => {
    const res = await api.get('/requests', { params });
    return res.data;
  },
  getRequestById: async (id) => {
    const res = await api.get(`/requests/${id}`);
    return res.data;
  },
  cancelRequest: async (id) => {
    const res = await api.put(`/requests/${id}/cancel`);
    return res.data;
  }
};

export const approvalService = {
  getApprovals: async (params = {}) => {
    const res = await api.get('/approvals', { params });
    return res.data;
  },
  approve: async (id, comments, signatureMeaning) => {
    const res = await api.post(`/approvals/${id}/approve`, { comments, signatureMeaning });
    return res.data;
  },
  reject: async (id, comments) => {
    const res = await api.post(`/approvals/${id}/reject`, { comments });
    return res.data;
  }
};

export const checkoutService = {
  getCheckouts: async (params = {}) => {
    const res = await api.get('/checkouts', { params });
    return res.data;
  },
  checkout: async (data) => {
    const res = await api.post('/checkouts', data);
    return res.data;
  },
  returnDocument: async (id, conditionOnReturn, remarks) => {
    const res = await api.post(`/checkouts/${id}/return`, { conditionOnReturn, remarks });
    return res.data;
  }
};

export const handoverService = {
  getHandovers: async (params = {}) => {
    const res = await api.get('/handovers', { params });
    return res.data;
  },
  createHandover: async (data) => {
    const res = await api.post('/handovers', data);
    return res.data;
  },
  acceptHandover: async (id) => {
    const res = await api.post(`/handovers/${id}/accept`);
    return res.data;
  },
  rejectHandover: async (id, reason) => {
    const res = await api.post(`/handovers/${id}/reject`, { reason });
    return res.data;
  }
};

export const auditService = {
  getPhysicalAudits: async (params = {}) => {
    const res = await api.get('/audits', { params });
    return res.data;
  },
  getPhysicalAuditById: async (id) => {
    const res = await api.get(`/audits/${id}`);
    return res.data;
  },
  createPhysicalAudit: async (data) => {
    const res = await api.post('/audits', data);
    return res.data;
  },
  verifyItem: async (auditId, itemData) => {
    const res = await api.put(`/audits/${auditId}/verify-item`, itemData);
    return res.data;
  },
  completeAudit: async (auditId, findings, correctiveActions) => {
    const res = await api.post(`/audits/${auditId}/complete`, { findings, correctiveActions });
    return res.data;
  },
  getAuditTrailLogs: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  }
};

export const reportService = {
  getOverview: async (params = {}) => {
    const res = await api.get('/reports/overview', { params });
    return res.data;
  },
  getDashboardStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
  getDashboardCharts: async () => {
    const res = await api.get('/dashboard/charts');
    return res.data;
  },
  getDashboardWidgets: async () => {
    const res = await api.get('/dashboard/widgets');
    return res.data;
  }
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  }
};

export const masterDataService = {
  getMasterData: async () => {
    const res = await api.get('/master-data');
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await api.post('/master-data/departments', data);
    return res.data;
  },
  createDocumentType: async (data) => {
    const res = await api.post('/master-data/document-types', data);
    return res.data;
  },
  createStorageLocation: async (data) => {
    const res = await api.post('/master-data/locations', data);
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data;
  }
};
