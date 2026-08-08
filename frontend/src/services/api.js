import axios from 'axios';

// Defaults to same-origin via the Vite proxy in dev (and via the Netlify/Vercel
// rewrite in production), so HttpOnly cookies are sent automatically and the
// cookies can stay SameSite=Lax.
// Set VITE_API_BASE_URL to a full URL only if you call the backend host directly
// — that is a cross-site request, so the backend also needs COOKIE_SAMESITE=none.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ML_BASE_URL = import.meta.env.VITE_ML_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // send auth cookies
});

// Tokens live in HttpOnly cookies and are unreadable from JS by design,
// so there is no Authorization header to attach here.

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const code = error.response?.data?.code;

    // On an expired access token, silently refresh once and retry.
    if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retried) {
      original._retried = true;
      try {
        // Collapse concurrent 401s into a single refresh call.
        refreshing = refreshing || api.post('/auth/refresh');
        await refreshing;
        refreshing = null;
        return api(original);
      } catch (refreshErr) {
        refreshing = null;
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      }
    }

    // Token reuse detected server-side — force a full re-login.
    if (code === 'TOKEN_REUSE') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export const mlApi = axios.create({
  baseURL: ML_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
