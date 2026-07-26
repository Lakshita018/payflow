import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store';
import { BellIcon, MenuIcon, SearchIcon } from './icons';

type TopNavigationProps = {
  onMenuClick: () => void;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const staticPageMeta: Record<string, { subtitle: string }> = {
  [ROUTES.TRANSACTIONS]: { subtitle: 'View and manage all your payment activity.' },
  [ROUTES.SEND_MONEY]:   { subtitle: 'Move money to a saved contact.' },
  [ROUTES.TRANSFER]:     { subtitle: 'Move money to a saved contact.' },
  [ROUTES.FAVOURITES]:   { subtitle: 'Quick access to your most important people' },
  [ROUTES.PROFILE]:      { subtitle: 'Manage your PayFlow account.' },
  [ROUTES.SETTINGS]:     { subtitle: 'Adjust your preferences.' },
};

const staticPageTitles: Record<string, string> = {
  [ROUTES.TRANSACTIONS]: 'Transactions',
  [ROUTES.SEND_MONEY]:   'Send Money',
  [ROUTES.TRANSFER]:     'Send Money',
  [ROUTES.FAVOURITES]:   'Favourite Contacts',
  [ROUTES.PROFILE]:      'Profile',
  [ROUTES.SETTINGS]:     'Settings',
};

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'there';
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchValue.trim();
      if (!q) return;
      setSearchValue('');
      void navigate(ROUTES.SEND_MONEY, { state: { prefillPayflowId: q } });
    }
  };

  const isTransactionDetails = pathname.startsWith('/transactions/') && pathname !== ROUTES.TRANSACTIONS;

  let title: string;
  let subtitle: string;

  if (isTransactionDetails) {
    title = '';
    subtitle = '';
  } else if (pathname === ROUTES.DASHBOARD) {
    title = `${getGreeting()}, ${displayName} 👋`;
    subtitle = "Here's what's happening with your account today.";
  } else {
    title = staticPageTitles[pathname] ?? '';
    subtitle = staticPageMeta[pathname]?.subtitle ?? '';
  }

  const showMeta = !isTransactionDetails && title;

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:text-text-primary lg:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          {showMeta ? (
            <div className="min-w-0 flex-1">
              <PageHeader title={title} subtitle={subtitle} />
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 lg:block" />
          )}

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex xl:flex-[0.95]">
            <div className="w-full max-w-[22rem]">
              <Input
                ref={searchRef}
                aria-label="Search contacts by PayFlow ID"
                placeholder="Search by PayFlow ID…"
                leftIcon={<SearchIcon className="h-4 w-4" />}
                className="h-11 rounded-2xl border-border bg-white px-4 text-sm shadow-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:text-text-primary"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <Avatar name={user?.email ?? 'User'} size="md" className="bg-brand-100 text-brand-700 shadow-sm" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 lg:hidden">
          <div className="flex-1">
              <Input
                aria-label="Search contacts by PayFlow ID"
                placeholder="Search by PayFlow ID…"
                leftIcon={<SearchIcon className="h-4 w-4" />}
                className="h-11 rounded-2xl border-border bg-white px-4 text-sm shadow-sm"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:text-text-primary"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <Avatar name={user?.email ?? 'User'} size="md" className="bg-brand-100 text-brand-700 shadow-sm" />
        </div>
      </div>
    </header>
  );
}
