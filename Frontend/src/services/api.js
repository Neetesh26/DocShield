import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docushield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if session token is expired/invalid, not for electronic signature password checks
    const isSignatureAction =
      error.config?.url?.includes('periodic-review') ||
      error.config?.url?.includes('destruction') ||
      error.config?.url?.includes('approve');

    if (error.response && error.response.status === 401 && !isSignatureAction) {
      // Clear token and redirect to login if session expired
      localStorage.removeItem('docushield_token');
      localStorage.removeItem('docushield_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

