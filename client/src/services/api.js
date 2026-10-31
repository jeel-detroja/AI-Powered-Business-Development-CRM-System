import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 30000,
});

// Request interceptor — attach JWT bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 without reload loops
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/me') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register');

      // Clear local auth session
      useAuthStore.getState().clearUser();

      // Only redirect on unexpected protected route failure, never on auth attempts or if already on auth page
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage = path === '/login' || path === '/register' || path === '/forgot-password';
        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;


