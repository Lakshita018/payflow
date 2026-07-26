// ---------------------------------------------------------------------------
// ProtectedRoute — wraps any route that requires authentication.
//
// Behaviour
// ---------
// • If the user IS authenticated (accessToken present in the store)  → render children.
// • If the user is NOT authenticated → redirect to /login, preserving the
//   attempted URL in location.state so LoginPage can redirect back after
//   a successful login (implemented when the full /me flow is added).
//
// Why check the store, not localStorage directly?
// -------------------------------------------------
// The Zustand store is hydrated from localStorage on first load
// (see authStore.ts: `isAuthenticated: Boolean(localStorage.getItem('accessToken'))`).
// Checking the store here means the guard is reactive — it updates instantly
// when the user logs out in another tab or when the 401 interceptor clears state.
// ---------------------------------------------------------------------------
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from './paths';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Pass the attempted path so we can redirect back after login in a future phase.
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
