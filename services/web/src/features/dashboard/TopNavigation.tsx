import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES, userProfilePath } from '@/routes/paths';
import { useAuthStore } from '@/store';
import { userService } from '@/services';
import { MenuIcon, SearchIcon } from './icons';
import { NotificationDropdown } from './NotificationDropdown';

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
  [ROUTES.FAVOURITES]:   { subtitle: 'Quick access to your most important people.' },
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

function isUserProfilePath(pathname: string): boolean {
  return /^\/users\/[^/]+$/.test(pathname);
}

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'there';
  const [searchValue, setSearchValue] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (q: string) => {
    if (!q) return;
    setIsSearching(true);
    setSearchError('');
    try {
      // Use the search endpoint (query param — no encoding issues with '@' in path).
      // It does case-insensitive partial matching on payflowId and email, so both
      // "arav" and "aravmehta@payflow" resolve to the correct user.
      const results = await userService.search(q.trim());

      if (results.length === 0) {
        setSearchError('No user found');
        return;
      }

      setSearchValue('');
      setSearchError('');
      // Navigate using the canonical payflowId returned by the server
      // (no client-side encoding guessing needed).
      void navigate(userProfilePath(results[0].payflowId));
    } catch {
      setSearchError('No user found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchValue.trim();
      if (!q) return;
      void handleSearch(q);
    }
  };

  const isTransactionDetails = pathname.startsWith('/transactions/') && pathname !== ROUTES.TRANSACTIONS;
  const isUserProfile = isUserProfilePath(pathname);

  let title: string;
  let subtitle: string;

  if (isTransactionDetails || isUserProfile) {
    title = '';
    subtitle = '';
  } else if (pathname === ROUTES.DASHBOARD) {
    title = `${getGreeting()}, ${displayName} 👋`;
    subtitle = "Here's what's happening with your account today.";
  } else {
    title = staticPageTitles[pathname] ?? '';
    subtitle = staticPageMeta[pathname]?.subtitle ?? '';
  }

  const showMeta = !isTransactionDetails && !isUserProfile && title;

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary shadow-xs transition-all duration-150 hover:border-border-strong hover:text-text-primary lg:hidden"
            aria-label="Open navigation"
            aria-expanded="false"
          >
            <MenuIcon className="h-4 w-4" />
          </button>

          {/* Page title — desktop */}
          {showMeta ? (
            <div className="hidden min-w-0 flex-1 lg:block">
              <PageHeader title={title} subtitle={subtitle} />
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 lg:block" />
          )}

          {/* Page title — mobile */}
          {showMeta ? (
            <div className="min-w-0 flex-1 lg:hidden">
              <h1 className="truncate text-base font-semibold text-text-primary">{title}</h1>
            </div>
          ) : (
            <div className="flex-1 lg:hidden" />
          )}

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Search — desktop only */}
            <div className="relative hidden lg:block">
              <Input
                ref={searchRef}
                aria-label="Search contacts by PayFlow ID, name or email"
                placeholder="Search users…"
                leftIcon={
                  isSearching
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    : <SearchIcon className="h-4 w-4" />
                }
                className="h-9 w-56 rounded-xl text-sm xl:w-72"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setSearchError(''); }}
                onKeyDown={handleSearchKeyDown}
                disabled={isSearching}
              />
              {searchError && (
                <p className="absolute left-0 top-full mt-1 text-xs font-medium text-danger">{searchError}</p>
              )}
            </div>

            <ThemeToggle variant="icon" />

            {/* Notifications */}
            <NotificationDropdown />

            <Avatar
              name={user?.email ?? 'User'}
              size="sm"
              className="bg-brand-100 text-brand-700 shadow-xs cursor-pointer"
            />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="pb-3 lg:hidden">
          <div className="relative">
            <Input
              aria-label="Search contacts by PayFlow ID, name or email"
              placeholder="Search by PayFlow ID, name or email…"
              leftIcon={
                isSearching
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  : <SearchIcon className="h-4 w-4" />
              }
              className="h-9 rounded-xl text-sm"
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); setSearchError(''); }}
              onKeyDown={handleSearchKeyDown}
              disabled={isSearching}
            />
            {searchError && (
              <p className="absolute left-0 top-full mt-1 text-xs font-medium text-danger">{searchError}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
