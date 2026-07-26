// ---------------------------------------------------------------------------
// services/auth.ts — typed API wrappers for all authentication endpoints.
//
// Each function maps 1-to-1 to a backend route:
//   POST /api/v1/auth/register  →  register()
//   POST /api/v1/auth/login     →  login()
//   POST /api/v1/auth/refresh   →  refresh()
//   POST /api/v1/auth/logout    →  logout()
//
// These are plain async functions — no React, no hooks, no side effects.
// State mutations (token storage, Zustand updates) happen in useAuth, not here.
//
// Response shapes are inferred from the auth controller:
//   register → { id, email, createdAt }
//   login    → { accessToken, refreshToken }
//   refresh  → { accessToken, refreshToken }
//   logout   → 204 No Content (void)
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type { AuthTokens } from '@/types';

// ── Request / response types ─────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: string;
}

// ── API wrappers ─────────────────────────────────────────────────────────────

/** POST /api/v1/auth/login → { accessToken, refreshToken } */
export async function login(payload: LoginRequest): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/api/v1/auth/login', payload);
  return data;
}

/** POST /api/v1/auth/register → { id, email, createdAt } */
export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/api/v1/auth/register', payload);
  return data;
}

/** POST /api/v1/auth/refresh → { accessToken, refreshToken } */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken });
  return data;
}

/**
 * POST /api/v1/auth/logout → 204 No Content
 *
 * The backend currently reads userId from req.body (auth middleware is wired
 * in a later phase). We pass it explicitly here from the Zustand store.
 * When the backend is updated to read from req.user this call becomes a plain
 * POST with no body — no frontend change needed at that point.
 */
export async function logout(userId: string): Promise<void> {
  await apiClient.post('/api/v1/auth/logout', { userId });
}

export interface MeResponse {
  id: string;
  email: string;
  payflowId: string;
  createdAt: string;
}

/** GET /api/v1/auth/me → { id, email, payflowId, createdAt } */
export async function me(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/v1/auth/me');
  return data;
}
