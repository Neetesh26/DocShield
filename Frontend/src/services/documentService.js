import api from './api';

export const documentService = {
  // Step 1 -> Step 2: Upload file and extract metadata
  extractMetadata: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/documents/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  checkDuplicate: async (criteria) => {
    const response = await api.post('/documents/check-duplicate', criteria);
    return response.data;
  },

  // Step 4: Finalize creation
  createDocument: async (documentData) => {
    const response = await api.post('/documents', documentData);
    return response.data;
  },

  getDocuments: async (params = {}) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  updateMetadata: async (id, data) => {
    const response = await api.put(`/documents/${id}/metadata`, data);
    return response.data;
  },

  getDocumentQR: async (id) => {
    const response = await api.get(`/documents/${id}/qr`);
    return response.data;
  },

  aiSearch: async (query, params = {}) => {
    const response = await api.post('/documents/ai-search', { query, ...params });
    return response.data;
  },

  askAssistant: async (documentId, prompt, mode = 'qa') => {
    const response = await api.post('/assistant/chat', { documentId, prompt, mode });
    return response.data;
  }
};

