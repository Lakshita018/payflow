// ---------------------------------------------------------------------------
// AuthLayout — wraps unauthenticated pages (Login, Register).
// ---------------------------------------------------------------------------
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-semibold text-text-primary">PayFlow</span>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
