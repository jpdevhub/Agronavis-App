import axios from 'axios';
import { API_URL, API_TIMEOUT } from '@constants/index';

// ─── Base Axios Instance ──────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor — Attach Auth Token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Token is injected at call-site via setAuthToken() or from store middleware
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Normalise Errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message ?? 'An error occurred';
      return Promise.reject(new Error(message));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }
    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

/** Inject Clerk token into every outgoing request */
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
