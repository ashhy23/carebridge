/**
 * Shared Axios client for the CareBridge API.
 * Sends credentials (httpOnly refresh cookie) and attaches the access token.
 * On 401, attempts one token refresh and retries the original request.
 */
import axios from 'axios';

// In-memory access token (synced with AuthContext state, not localStorage)
let accessToken = null;

// Optional callback so AuthContext can stay in sync after interceptor refresh
let onAccessTokenChange = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnAccessTokenChange(callback) {
  onAccessTokenChange = callback;
}

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
});

// Attach Bearer token to every request when we have one
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 once per request; skip if no config (network error)
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Do not retry refresh itself — avoid infinite loop
    if (originalRequest.url?.includes('/auth/refresh')) {
      setAccessToken(null);
      onAccessTokenChange?.(null);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);
      onAccessTokenChange?.(data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onAccessTokenChange?.(null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default api;
