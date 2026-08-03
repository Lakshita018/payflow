// ---------------------------------------------------------------------------
// Zustand auth store — holds the authenticated session state.
//
// Responsibilities:
//   • Store the access token, refresh token, and user profile.
//   • Persist tokens to localStorage (remember me) or sessionStorage (session-only).
//   • Expose login(), logout(), and clear() actions.
//
// Remember-me behaviour
// ---------------------
//   rememberMe = true  → tokens written to localStorage  (survive browser close)
//   rememberMe = false → tokens written to sessionStorage (cleared on tab close)
//
// On hydration we check localStorage first, then sessionStorage, so both paths
// restore correctly after a page reload within the same session.
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/types';

// ── Storage helpers ──────────────────────────────────────────────────────────
// Reads a token from whichever storage currently holds it.
function readToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

// Writes tokens to the chosen storage and removes any stale copy in the other.
function writeTokens(accessToken: string, refreshToken: string, rememberMe: boolean): void {
  const primary   = rememberMe ? localStorage   : sessionStorage;
  const secondary = rememberMe ? sessionStorage  : localStorage;
  primary.setItem('accessToken',  accessToken);
  primary.setItem('refreshToken', refreshToken);
  // Remove from the other storage so there is never a stale copy in both.
  secondary.removeItem('accessToken');
  secondary.removeItem('refreshToken');
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Called after a successful login or token refresh.
   *  Pass rememberMe=true to persist across browser restarts (localStorage).
   *  Pass rememberMe=false (default) to keep tokens only for this session (sessionStorage).
   *  When called during a token refresh the rememberMe flag is inferred from
   *  whichever storage already holds the existing refresh token. */
  login: (payload: { accessToken: string; refreshToken: string; user: User; rememberMe?: boolean }) => void;
  /** Clears all auth state and removes tokens from both storages. */
  logout: () => void;
  /** Alias for logout — explicit reset without any side-effects beyond state. */
  clear: () => void;
  /** Patches the stored user object in-place (e.g. after a profile update). */
  setUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Initial state — hydrated from whichever storage holds a token ──────────
  accessToken:     readToken('accessToken'),
  refreshToken:    readToken('refreshToken'),
  user:            null,
  isAuthenticated: Boolean(readToken('accessToken')),

  // ── Actions ────────────────────────────────────────────────────────────────
  login: ({ accessToken, refreshToken, user, rememberMe }) => {
    // If rememberMe is not explicitly provided, infer it from whichever storage
    // currently holds the refresh token (i.e. preserve the original choice on refresh).
    const remember = rememberMe ?? Boolean(localStorage.getItem('refreshToken'));
    writeTokens(accessToken, refreshToken, remember);
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  clear: () => {
    clearTokens();
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (patch) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : null,
    }));
  },
}));
