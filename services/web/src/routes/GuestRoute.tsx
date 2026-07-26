// ---------------------------------------------------------------------------
// GuestRoute — wraps routes that should only be visible to unauthenticated users.
//
// Behaviour
// ---------
// • If the user is NOT authenticated → render children (Login / Register pages).
// • If the user IS authenticated    → redirect to /dashboard.
//
// This prevents an already-logged-in user from seeing the login or register
// page, which would be confusing and could accidentally overwrite their session.
// ---------------------------------------------------------------------------
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { ROUTES } from './paths';

export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}
