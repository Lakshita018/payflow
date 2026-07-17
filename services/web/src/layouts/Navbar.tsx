// ---------------------------------------------------------------------------
// Navbar — top bar rendered inside DashboardLayout.
// ---------------------------------------------------------------------------
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD]:    'Dashboard',
  [ROUTES.TRANSFER]:     'Transfer Money',
  [ROUTES.TRANSACTIONS]: 'Transactions',
  [ROUTES.RECIPIENTS]:   'Recipients',
  [ROUTES.FAVOURITES]:   'Favourites',
  [ROUTES.SETTINGS]:     'Settings',
};

export function Navbar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'PayFlow';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>
      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
        <span className="text-xs font-semibold text-brand-700">U</span>
      </div>
    </header>
  );
}
