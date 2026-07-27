// ---------------------------------------------------------------------------
// useAuth — TanStack Query mutation hooks for all authentication operations.
//
// Responsibilities
// ----------------
// • Wraps each authService call in a useMutation so callers get isPending,
//   isError, and error state for free without any local useState.
// • Applies Zustand store side-effects (login / logout / clear) after each
//   successful API call — the service layer never touches the store directly.
// • After a successful login, calls /auth/me to get the full User (including
//   payflowId) and stores it in the Zustand auth store.
//
// Usage
// -----
//   const { loginMutation, registerMutation, handleLogout } = useAuth();
//
//   loginMutation.mutate({ email, password });                 // fire-and-forget
//   await loginMutation.mutateAsync({ email, password });      // awaitable
// ---------------------------------------------------------------------------
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
    onSuccess: async (tokens) => {
      // Temporarily store tokens so the /me call can attach the Bearer header
      const partialUser: User = { id: '', email: '', payflowId: '', createdAt: new Date().toISOString() };
      login({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: partialUser });

      // Fetch the real user profile immediately
      try {
        const userProfile = await authService.me();
        const fullUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          payflowId: userProfile.payflowId,
          createdAt: userProfile.createdAt,
        };
        login({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: fullUser });
      } catch {
        // /me failed — tokens are still valid, user navigates forward; profile will be re-fetched
      }

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
      // with their new credentials.
      void navigate(ROUTES.LOGIN, { replace: true });
    },
  });
}

// ── Logout ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async function handleLogout() {
    // Attempt the server-side logout to invalidate the refresh token hash.
    if (user?.id) {
      try {
        await authService.logout(user.id);
      } catch {
        // A failed server logout is not fatal — the access token will expire
        // naturally in ≤15 min and the local session is cleared below.
      }
    }

    // Clear all cached query data so the next user sees a clean state.
    queryClient.clear();

    // Always clear local state regardless of the server response.
    logout();
    void navigate(ROUTES.LOGIN, { replace: true });
  };
}

// ── Session restore on page load ─────────────────────────────────────────────
// When the app loads with a valid token in localStorage but user is null,
// silently fetch /me to repopulate the user object.

export function useInitAuth() {
  const { accessToken, user, login, refreshToken: storedRefresh, logout } = useAuthStore();

  const { data, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    // Only run if we have a token but no user profile
    enabled: Boolean(accessToken) && (!user || !user.payflowId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && accessToken && storedRefresh) {
      const fullUser: User = {
        id: data.id,
        email: data.email,
        payflowId: data.payflowId,
        createdAt: data.createdAt,
      };
      login({ accessToken, refreshToken: storedRefresh, user: fullUser });
    }
  }, [data, accessToken, storedRefresh, login]);

  useEffect(() => {
    if (error && accessToken) {
      // /me returned 401 — token is invalid, log out silently
      logout();
    }
  }, [error, accessToken, logout]);
}

// ── Forgot Password ──────────────────────────────────────────────────────────

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authService.forgotPassword,
  });
}

// ── Reset Password ───────────────────────────────────────────────────────────

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authService.resetPassword,
  });
}

// ── Convenience re-export ────────────────────────────────────────────────────
// Consumers can import everything from a single hook if they prefer.

export function useAuth() {
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const handleLogout = useLogout();

  return { loginMutation, registerMutation, handleLogout };
}
