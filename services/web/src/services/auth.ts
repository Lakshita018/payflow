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
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  themePreference: string;
  createdAt: string;
}

// ── Profile Update ────────────────────────────────────────────────────────────

export interface UpdateProfileRequest {
  displayName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateProfileResponse {
  id: string;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

// ── Change Password ───────────────────────────────────────────────────────────

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ── Preferences ───────────────────────────────────────────────────────────────

export interface UpdatePreferencesRequest {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  themePreference?: string;
}

export interface UpdatePreferencesResponse {
  emailNotifications: boolean;
  pushNotifications: boolean;
  themePreference: string;
}

/** GET /api/v1/auth/me → { id, email, payflowId, createdAt } */
export async function me(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/api/v1/auth/me');
  return data;
}

// ── Password Reset ───────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * POST /api/v1/auth/forgot-password
 * Always returns a generic success message — the backend never reveals
 * whether an account exists for the given email.
 */
export async function forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>('/api/v1/auth/forgot-password', payload);
  return data;
}

/**
 * POST /api/v1/auth/reset-password
 * Verifies the one-time token and sets the new password.
 * Throws on 400 (invalid/expired token or validation failure).
 */
export async function resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>('/api/v1/auth/reset-password', payload);
  return data;
}

/** PATCH /api/v1/auth/me — update display name, phone, and/or avatar */
export async function updateProfile(payload: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.patch<UpdateProfileResponse>('/api/v1/auth/me', payload);
  return data;
}

/** POST /api/v1/auth/change-password */
export async function changePassword(payload: ChangePasswordRequest): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/v1/auth/change-password', payload);
  return data;
}

/** POST /api/v1/auth/logout-all — invalidate all sessions */
export async function logoutAll(): Promise<void> {
  await apiClient.post('/api/v1/auth/logout-all');
}

/** PATCH /api/v1/auth/preferences — save notification/theme preferences */
export async function updatePreferences(payload: UpdatePreferencesRequest): Promise<UpdatePreferencesResponse> {
  const { data } = await apiClient.patch<UpdatePreferencesResponse>('/api/v1/auth/preferences', payload);
  return data;
}
