// ---------------------------------------------------------------------------
// Axios instance — single point of configuration for all API calls.
//
// Token reads and auth state changes are delegated entirely to the Zustand
// auth store, which is the single source of truth for authentication state.
// The interceptors never touch localStorage directly.
//
// Silent refresh strategy
// -----------------------
// When any request returns 401 the interceptor first attempts a silent token
// refresh using the stored refresh token. If the refresh succeeds the original
// request is retried with the new access token. Only if the refresh itself
// fails (expired / invalidated refresh token) is the user logged out.
//
// Concurrency guard
// -----------------
// A promise is shared across all simultaneous 401 failures so only one refresh
// request is ever in-flight at a time. Every other failing request queues
// behind that single promise and is replayed once it resolves.
// ---------------------------------------------------------------------------
import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store';

// Base URL comes from the Vite environment variable (set in .env.local).
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Reads the access token from the auth store and attaches it as a Bearer token.
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
// On 401: attempt a silent token refresh, then replay the original request.
// On refresh failure: logout and propagate the error.

// Tracks an in-flight refresh so concurrent 401s share one refresh call.
let refreshPromise: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // Only intercept 401s that haven't been retried yet and aren't themselves
    // a refresh request (avoids an infinite retry loop).
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
    if (error.response?.status !== 401 || originalRequest._retried === true || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    const { refreshToken, login, logout } = useAuthStore.getState();

    // No refresh token stored — nothing to attempt, log out immediately.
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    // Coalesce concurrent 401s behind a single refresh call.
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await axios.post<{ accessToken: string; refreshToken: string }>(
            `${BASE_URL}/api/v1/auth/refresh`,
            { refreshToken },
          );
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
          // Persist the new tokens. We don't have a User object here (the
          // refresh endpoint only returns tokens), so preserve the existing
          // user from the store unchanged.
          const currentUser = useAuthStore.getState().user;
          if (currentUser !== null) {
            login({ accessToken: newAccess, refreshToken: newRefresh, user: currentUser });
          } else {
            // Edge case: user object was cleared but tokens were still present.
            // Persist tokens directly without touching user.
            localStorage.setItem('accessToken', newAccess);
            localStorage.setItem('refreshToken', newRefresh);
            useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh, isAuthenticated: true });
          }
        } catch {
          // Refresh failed — session is genuinely expired.
          logout();
          throw error; // re-throw the original 401 error to the caller
        } finally {
          refreshPromise = null;
        }
      })();
    }

    // Wait for the refresh to complete, then replay the original request.
    try {
      await refreshPromise;
      // Update the Authorization header with the freshly-stored token.
      const { accessToken: freshToken } = useAuthStore.getState();
      if (freshToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
      }
      return apiClient(originalRequest);
    } catch {
      return Promise.reject(error);
    }
  },
);
