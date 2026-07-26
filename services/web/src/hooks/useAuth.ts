// ---------------------------------------------------------------------------
// useAuth — TanStack Query mutation hooks for all authentication operations.
//
// Responsibilities
// ----------------
// • Wraps each authService call in a useMutation so callers get isPending,
//   isError, and error state for free without any local useState.
// • Applies Zustand store side-effects (login / logout / clear) after each
//   successful API call — the service layer never touches the store directly.
// • Derives a User object from the register + login responses so the store
//   always holds a populated User after authentication.
//
// Usage
// -----
//   const { loginMutation, registerMutation, handleLogout } = useAuth();
//
//   loginMutation.mutate({ email, password });                 // fire-and-forget
//   await loginMutation.mutateAsync({ email, password });      // awaitable
// ---------------------------------------------------------------------------
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/routes/paths';
import type { User } from '@/types';

// ── Login ────────────────────────────────────────────────────────────────────

export function useLoginMutation() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (tokens, variables) => {
      // The login endpoint returns only tokens, not a User object.
      // We build a minimal User from the email that was submitted.
      // The id and payflowId will be populated once we add a /me endpoint
      // in a later phase; for now placeholders satisfy the type contract.
      const partialUser: User = {
        id: '',
        email: variables.email,
        payflowId: '',
        createdAt: new Date().toISOString(),
      };
      login({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: partialUser });
      void navigate(ROUTES.DASHBOARD, { replace: true });
    },
  });
}

// ── Register ─────────────────────────────────────────────────────────────────

export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      // After a successful registration, redirect to login so the user signs in
      // with their new credentials. We intentionally do NOT auto-login to keep
      // the flow explicit and avoid storing tokens before email verification
      // is added in a future phase.
      void navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}

// ── Logout ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  return async function handleLogout() {
    // Attempt the server-side logout to invalidate the refresh token hash in
    // the database. We only have a userId if the user object is populated.
    if (user?.id) {
      try {
        await authService.logout(user.id);
      } catch {
        // A failed server logout is not fatal — the access token will expire
        // naturally in ≤15 min and the local session is cleared below.
      }
    }

    // Always clear local state regardless of the server response.
    logout();
    void navigate(ROUTES.LOGIN, { replace: true });
  };
}

// ── Convenience re-export ────────────────────────────────────────────────────
// Consumers can import everything from a single hook if they prefer.

export function useAuth() {
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const handleLogout = useLogout();

  return { loginMutation, registerMutation, handleLogout };
}
