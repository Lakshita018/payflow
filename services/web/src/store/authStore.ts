// ---------------------------------------------------------------------------
// Zustand auth store — holds the authenticated session state.
//
// Responsibilities:
//   • Store the access token, refresh token, and user profile.
//   • Persist tokens to localStorage so sessions survive page reloads.
//   • Expose login(), logout(), and clear() actions.
//
// This is the single source of truth for all auth state. The axios instance
// reads tokens via useAuthStore.getState() rather than touching localStorage
// directly, so every token read and every auth state change goes through here.
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Called after a successful login or token refresh. */
  login: (payload: { accessToken: string; refreshToken: string; user: User }) => void;
  /** Clears all auth state and removes tokens from localStorage. */
  logout: () => void;
  /** Alias for logout — explicit reset without any side-effects beyond state. */
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Initial state — hydrated from localStorage on first load ───────────────
  accessToken:     localStorage.getItem('accessToken'),
  refreshToken:    localStorage.getItem('refreshToken'),
  user:            null,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),

  // ── Actions ────────────────────────────────────────────────────────────────
  login: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
