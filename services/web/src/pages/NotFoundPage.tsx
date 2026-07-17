import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
      <p className="text-6xl font-bold text-brand-200">404</p>
      <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="text-sm text-text-secondary">The page you are looking for does not exist.</p>
      <Link to={ROUTES.DASHBOARD} className="btn-primary mt-2">
        Go to Dashboard
      </Link>
    </div>
  );
}
