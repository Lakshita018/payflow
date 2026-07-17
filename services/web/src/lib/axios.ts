// ---------------------------------------------------------------------------
// Axios instance — single point of configuration for all API calls.
//
// Token reads and auth state changes are delegated entirely to the Zustand
// auth store, which is the single source of truth for authentication state.
// The interceptors never touch localStorage directly.
// ---------------------------------------------------------------------------
import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store';

// Base URL comes from the Vite environment variable (set in .env / .env.example).
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Reads the access token from the auth store (the single source of truth)
// and attaches it as a Bearer token to every outgoing request.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────
// Pass successful responses through unchanged.
// On 401, delegate to the store's logout() so all auth state (tokens, user,
// isAuthenticated, localStorage) is cleared in one place.
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
