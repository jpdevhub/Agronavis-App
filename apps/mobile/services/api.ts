import axios from 'axios';
import { API_URL, API_TIMEOUT } from '@/constants';
import { supabase } from '@/utils/supabase';

// ─── Base Axios Instance ──────────────────────────────────────────────────────
// Points to the FastAPI backend that will be deployed on HuggingFace Spaces
// alongside the trained ML model and edge functions.

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor — Attach Supabase Auth Token ────────────────────────
// Reads the active session from Supabase on every request so the token is
// always current after a silent refresh. No manual token injection required.

api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — Normalise Errors ─────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail ?? error.response.data?.message ?? 'An error occurred';
      return Promise.reject(new Error(message));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please check your connection.'));
    }
    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

export default api;
