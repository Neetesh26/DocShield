import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('docushield_token') || localStorage.getItem('docushield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isSignatureAction =
      error.config?.url?.includes('periodic-review') ||
      error.config?.url?.includes('destruction') ||
      error.config?.url?.includes('approve');

    if (error.response && error.response.status === 401 && !isSignatureAction) {
      sessionStorage.removeItem('docushield_token');
      sessionStorage.removeItem('docushield_user');
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

