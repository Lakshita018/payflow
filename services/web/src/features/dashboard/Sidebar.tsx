import { NavLink } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/routes/paths';
import {
  ChevronRightIcon,
  ContactsIcon,
  DashboardIcon,
  LogoMark,
  ProfileIcon,
  SendMoneyIcon,
  SettingsIcon,
  TransactionsIcon,
} from './icons';

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: DashboardIcon },
  { label: 'Transactions', path: ROUTES.TRANSACTIONS, icon: TransactionsIcon },
  { label: 'Send Money', path: ROUTES.SEND_MONEY, icon: SendMoneyIcon },
  { label: 'Favourite Contacts', path: ROUTES.FAVOURITES, icon: ContactsIcon },
  { label: 'Profile', path: ROUTES.PROFILE, icon: ProfileIcon },
  { label: 'Settings', path: ROUTES.SETTINGS, icon: SettingsIcon },
];

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const panelClasses = [
    'fixed inset-y-0 left-0 z-40 w-68 flex-col border-r border-slate-800/80 bg-[linear-gradient(180deg,#0f102b_0%,#12163a_45%,#070b1d_100%)] text-white shadow-[0_30px_80px_rgba(8,15,40,0.45)] transition-transform duration-300 ease-out lg:flex',
    mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
  ].join(' ');

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={panelClasses} aria-label="Primary">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <LogoMark />
          <div>
            <p className="text-base font-semibold tracking-tight text-white">PayFlow</p>
            <p className="text-xs text-white/45">Fintech workspace</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-0.5',
                      isActive
                        ? 'bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_100%)] text-white shadow-[0_18px_34px_rgba(109,40,217,0.32),0_0_0_1px_rgba(255,255,255,0.08)]'
                        : 'text-white/68 hover:bg-white/6 hover:text-white hover:shadow-[0_10px_24px_rgba(8,15,40,0.18)]',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={[
                          'flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ease-out group-hover:scale-[1.03]',
                          isActive ? 'border-white/20 bg-white/12 shadow-[0_10px_20px_rgba(15,23,42,0.16)]' : 'border-white/8 bg-white/5 group-hover:bg-white/10',
                        ].join(' ')}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ChevronRightIcon className={['h-4 w-4 transition-all duration-200 ease-out group-hover:translate-x-0.5', isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'].join(' ')} />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/6 px-3 py-3 shadow-[0_12px_24px_rgba(8,15,40,0.16)]">
            <Avatar name="Liam Grant" size="lg" className="bg-brand-500 text-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Liam Grant</p>
              <p className="truncate text-xs text-white/55">lg@example.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}