import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import PageHeader from '@/components/ui/PageHeader';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES, userProfilePath } from '@/routes/paths';
import { useAuthStore } from '@/store';
import { userService } from '@/services';
import { useDebounce } from '@/hooks';
import { useLogout } from '@/hooks/useAuth';
import { MenuIcon, SearchIcon, ProfileIcon, SettingsIcon } from './icons';
import { NotificationDropdown } from './NotificationDropdown';
import type { PublicProfile, RecentContact } from '@/types';

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

// ── Search result row ────────────────────────────────────────────────────────
function SearchResultRow({
  name,
  sub,
  avatarUrl,
  active,
  onClick,
}: {
  name: string;
  sub: string;
  payflowId?: string;
  avatarUrl?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
        active
          ? 'bg-brand-50 dark:bg-brand-950/40'
          : 'hover:bg-surface-subtle',
      ].join(' ')}
    >
      <Avatar
        name={name}
        src={avatarUrl ?? undefined}
        size="sm"
        className="shrink-0 bg-brand-100 text-brand-700"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{name}</p>
        <p className="truncate text-xs text-text-muted">{sub}</p>
      </div>
    </button>
  );
}

// ── Search dropdown ───────────────────────────────────────────────────────────
function SearchDropdown({
  query,
  onSelect,
  activeIndex,
}: {
  query: string;
  onSelect: (payflowId: string) => void;
  activeIndex: number;
}) {
  const trimmed = query.trim();

  // Live search results (debounced upstream)
  const { data: searchResults = [], isFetching: searching } = useQuery<PublicProfile[]>({
    queryKey: ['search', trimmed],
    queryFn: () => userService.search(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });

  // Recent contacts — always available regardless of query
  const { data: recentContacts = [] } = useQuery<RecentContact[]>({
    queryKey: ['recent-contacts'],
    queryFn: userService.getRecentContacts,
    staleTime: 60_000,
  });

  const hasSearch  = trimmed.length >= 1;
  const hasResults = searchResults.length > 0;
  const showRecent = !hasSearch || !hasResults;

  if (!hasSearch && recentContacts.length === 0) return null;

  return (
    <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[17rem] rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
      {/* Loading shimmer */}
      {searching && (
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-xs text-text-muted">Searching…</span>
        </div>
      )}

      {/* Search results section */}
      {hasSearch && hasResults && (
        <div>
          <p className="px-3 pt-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Results
          </p>
          {searchResults.map((r, i) => (
            <SearchResultRow
              key={r.payflowId}
              name={r.displayName}
              sub={r.payflowId}
              payflowId={r.payflowId}
              active={activeIndex === i}
              onClick={() => onSelect(r.payflowId)}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {hasSearch && !searching && !hasResults && (
        <p className="px-3 py-3 text-sm text-text-muted">
          No users found for &ldquo;{trimmed}&rdquo;
        </p>
      )}

      {/* Recent users (shown when no query, or as a fallback section) */}
      {showRecent && recentContacts.length > 0 && (
        <div>
          <p className="px-3 pt-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Recent
          </p>
          {recentContacts.slice(0, 5).map((c, i) => (
            <SearchResultRow
              key={c.payflowId}
              name={c.displayName}
              sub={c.payflowId}
              payflowId={c.payflowId}
              active={activeIndex === i}
              onClick={() => onSelect(c.payflowId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SearchBox (self-contained: input + dropdown + keyboard nav) ───────────────
function SearchBox({ className }: { className?: string }) {
  const navigate     = useNavigate();
  const [value, setValue]           = useState('');
  const [open, setOpen]             = useState(false);
  const [activeIndex, setActive]    = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounced    = useDebounce(value, 250);

  // Flat list of items for keyboard nav — mirrors what SearchDropdown renders
  const trimmed = debounced.trim();
  const { data: searchResults = [] } = useQuery<PublicProfile[]>({
    queryKey: ['search', trimmed],
    queryFn: () => userService.search(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 10_000,
  });
  const { data: recentContacts = [] } = useQuery<RecentContact[]>({
    queryKey: ['recent-contacts'],
    queryFn: userService.getRecentContacts,
    staleTime: 60_000,
  });

  const navItems: { payflowId: string }[] = trimmed.length >= 1
    ? searchResults
    : recentContacts.slice(0, 5);

  const handleSelect = useCallback((payflowId: string) => {
    setValue('');
    setOpen(false);
    setActive(-1);
    void navigate(userProfilePath(payflowId));
  }, [navigate]);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const count = navItems.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % count);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + count) % count);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && navItems[activeIndex]) {
        handleSelect(navItems[activeIndex].payflowId);
      } else if (trimmed.length >= 1 && searchResults[0]) {
        // Enter with no arrow selection — navigate to first result
        handleSelect(searchResults[0].payflowId);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && (value.trim().length >= 1 || recentContacts.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Input */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search users by name, PayFlow ID or email"
          placeholder="Search users…"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="input h-9 w-full pl-9 pr-3 rounded-xl text-sm"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <SearchDropdown
          query={debounced}
          onSelect={handleSelect}
          activeIndex={activeIndex}
        />
      )}
    </div>
  );
}

// ── AvatarMenu ────────────────────────────────────────────────────────────────
function AvatarMenu() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'User';
  const subline = user?.payflowId ?? user?.email ?? '';

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function go(path: string) {
    setOpen(false);
    void navigate(path);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <Avatar
          name={user?.email ?? 'User'}
          src={user?.avatarUrl ?? undefined}
          size="sm"
          className="bg-brand-100 text-brand-700 shadow-xs"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          {/* Identity header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
            {subline && <p className="truncate text-xs text-text-muted mt-0.5">{subline}</p>}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => go(ROUTES.PROFILE)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-subtle"
            >
              <ProfileIcon className="h-4 w-4 shrink-0 text-text-muted" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => go(ROUTES.SETTINGS)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-surface-subtle"
            >
              <SettingsIcon className="h-4 w-4 shrink-0 text-text-muted" />
              Settings
            </button>
          </div>

          {/* Logout — separated */}
          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); void handleLogout(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger transition-colors hover:bg-danger/5"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TopNavigation ──────────────────────────────────────────────────────────────
export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'there';

  const isTransactionDetails = pathname.startsWith('/transactions/') && pathname !== ROUTES.TRANSACTIONS;
  const isUserProfile = isUserProfilePath(pathname);

  let title: string;
  let subtitle: string;

  if (isTransactionDetails || isUserProfile) {
    title = '';
    subtitle = '';
  } else if (pathname === ROUTES.DASHBOARD) {
    title = `${getGreeting()}, ${displayName}`;
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
            <SearchBox className="hidden lg:block w-56 xl:w-72" />

            <ThemeToggle variant="icon" />

            {/* Notifications */}
            <NotificationDropdown />

            <AvatarMenu />
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="pb-3 lg:hidden">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
