import { useLocation } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import { ROUTES } from '@/routes/paths';
import { BellIcon, MenuIcon, SearchIcon } from './icons';

type TopNavigationProps = {
  onMenuClick: () => void;
};

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.DASHBOARD]: { title: 'Good Morning, Liam 👋', subtitle: "Here's what's happening with your account today." },
  [ROUTES.TRANSACTIONS]: { title: 'Transactions', subtitle: 'View and manage all your payment activity.' },
  [ROUTES.SEND_MONEY]: { title: 'Send Money', subtitle: 'Move money to a saved contact.' },
  [ROUTES.TRANSFER]: { title: 'Send Money', subtitle: 'Move money to a saved contact.' },
  [ROUTES.FAVOURITES]: { title: 'Favourite Contacts', subtitle: 'Your saved recipients.' },
  [ROUTES.PROFILE]: { title: 'Profile', subtitle: 'Manage your PayFlow account.' },
  [ROUTES.SETTINGS]: { title: 'Settings', subtitle: 'Adjust your preferences.' },
};

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { pathname } = useLocation();
  const meta = pathname.startsWith('/transactions/')
    ? { title: 'Transaction Details', subtitle: 'This screen will be implemented in a future phase.' }
    : pageMeta[pathname] ?? pageMeta[ROUTES.DASHBOARD];

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

          <div className="min-w-0 flex-1">
            <PageHeader title={meta.title} subtitle={meta.subtitle} />
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex xl:flex-[0.95]">
            <div className="w-full max-w-[22rem]">
              <Input
                aria-label="Search transactions, contacts"
                placeholder="Search transactions, contacts..."
                leftIcon={<SearchIcon className="h-4 w-4" />}
                className="h-11 rounded-2xl border-border bg-white px-4 text-sm shadow-sm"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:text-text-primary"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
            </button>

            <Avatar name="Liam Grant" size="md" className="bg-brand-100 text-brand-700 shadow-sm" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 lg:hidden">
          <div className="flex-1">
            <Input
              aria-label="Search transactions, contacts"
              placeholder="Search transactions, contacts..."
              leftIcon={<SearchIcon className="h-4 w-4" />}
              className="h-11 rounded-2xl border-border bg-white px-4 text-sm shadow-sm"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition-all duration-200 hover:border-border-strong hover:text-text-primary"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <Avatar name="Liam Grant" size="md" className="bg-brand-100 text-brand-700 shadow-sm" />
        </div>
      </div>
    </header>
  );
}