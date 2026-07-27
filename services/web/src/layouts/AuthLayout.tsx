// ---------------------------------------------------------------------------
// AuthLayout — wraps unauthenticated pages.
// The individual auth pages (Login, Register, etc.) render their own full-page
// layout since they each have a unique left panel. This layout simply provides
// the Outlet wrapper for routing.
// ---------------------------------------------------------------------------
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return <Outlet />;
}
