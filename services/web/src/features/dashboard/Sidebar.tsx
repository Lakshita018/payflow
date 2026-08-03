import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store';
import { useLogout } from '@/hooks';
import {
  ChevronRightIcon,
  ContactsIcon,
  DashboardIcon,
  InboxIcon,
  LogoMark,
  RequestMoneyIcon,
  SendMoneyIcon,
  TransactionsIcon,
} from './icons';

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { label: 'Dashboard',          path: ROUTES.DASHBOARD,         icon: DashboardIcon },
  { label: 'Transactions',       path: ROUTES.TRANSACTIONS,      icon: TransactionsIcon },
  { label: 'Send Money',         path: ROUTES.SEND_MONEY,        icon: SendMoneyIcon },
  { label: 'Request Money',      path: ROUTES.REQUEST_MONEY,     icon: RequestMoneyIcon },
  { label: 'Incoming Requests',  path: ROUTES.INCOMING_REQUESTS, icon: InboxIcon },
  { label: 'Favourite Contacts', path: ROUTES.FAVOURITES,        icon: ContactsIcon },
];

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LogoutButton() {
  const handleLogout = useLogout();
  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/60 transition-all duration-200 ease-out hover:bg-white/6 hover:text-white"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 transition-all duration-200 group-hover:bg-white/10">
        <LogoutIcon />
      </span>
      <span className="flex-1 text-left">Sign Out</span>
    </button>
  );
}

// ── Shared panel content ──────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.email?.split('@')[0] ?? 'Account';
  const displayEmail = user?.email ?? '';

  return (
    <>
      {/* Logo header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/8 px-5">
        <LogoMark />
        <div>
          <p className="text-[0.9375rem] font-semibold tracking-tight text-white">PayFlow</p>
          <p className="text-[0.6875rem] text-white/40">Fintech workspace</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-white shadow-[0_18px_34px_rgb(109_40_217/0.32),0_0_0_1px_rgba(255,255,255,0.08)]'
                      : 'text-white/65 hover:bg-white/6 hover:text-white hover:-translate-y-px hover:shadow-[0_10px_24px_rgb(8_15_40/0.18)]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200',
                        isActive
                          ? 'border-white/20 bg-white/12'
                          : 'border-white/8 bg-white/5 group-hover:bg-white/10',
                      ].join(' ')}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    <ChevronRightIcon
                      className={[
                        'h-3.5 w-3.5 transition-all duration-200 group-hover:translate-x-0.5',
                        isActive ? 'opacity-100' : 'opacity-25 group-hover:opacity-60',
                      ].join(' ')}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer: user + logout */}
      <div className="shrink-0 border-t border-white/8 p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-[1.125rem] border border-white/10 bg-white/5 px-3 py-2.5">
          <Avatar name={displayEmail} size="sm" className="bg-brand-500 text-white shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/50">{displayEmail}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const sidebarStyle = { background: 'var(--sidebar-bg)' };
  const sidebarBase =
    'fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-slate-800/80 text-white shadow-sidebar';

  return (
    <>
      {/* ── Mobile: animated drawer ──────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px]"
              onClick={onClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: -272 }}
              animate={{ x: 0 }}
              exit={{ x: -272 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className={sidebarBase}
              style={sidebarStyle}
              aria-label="Primary navigation"
            >
              <SidebarContent onClose={onClose} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Desktop: always-visible static sidebar ───────────────────────── */}
      <aside
        className={`${sidebarBase} hidden lg:flex`}
        style={sidebarStyle}
        aria-label="Primary navigation"
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}
