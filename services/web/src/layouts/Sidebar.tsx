// ---------------------------------------------------------------------------
// Sidebar — primary navigation for authenticated users.
// Fixed on desktop. Unicode icon placeholders will be replaced with
// lucide-react icons in the UI implementation phase (structure unchanged).
// ---------------------------------------------------------------------------
import { NavLink } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

interface NavItem {
  label: string;
  path:  string;
  icon:  string;  // will become LucideIcon in the UI phase
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    path: ROUTES.DASHBOARD,    icon: '⊞' },
  { label: 'Transfer',     path: ROUTES.TRANSFER,     icon: '↗' },
  { label: 'Transactions', path: ROUTES.TRANSACTIONS, icon: '≡' },
  { label: 'Recipients',   path: ROUTES.RECIPIENTS,   icon: '◎' },
  { label: 'Favourites',   path: ROUTES.FAVOURITES,   icon: '♡' },
  { label: 'Settings',     path: ROUTES.SETTINGS,     icon: '⚙' },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r border-border bg-surface lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold">P</span>
        </div>
        <span className="text-base font-semibold text-text-primary">PayFlow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary',
              ].join(' ')
            }
          >
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4">
        <p className="text-xs text-text-muted text-center">PayFlow v1.0</p>
      </div>
    </aside>
  );
}
