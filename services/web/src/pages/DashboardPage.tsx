import { FavouriteContactsCard } from '@/features/dashboard/FavouriteContactsCard';
import { QuickActionsCard } from '@/features/dashboard/QuickActionsCard';
import { RecentTransactionsCard } from '@/features/dashboard/RecentTransactionsCard';
import { WalletHeroCard } from '@/features/dashboard/WalletHeroCard';

export function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <WalletHeroCard />
        </div>
        <div className="xl:col-span-2">
          <QuickActionsCard />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentTransactionsCard />
        <FavouriteContactsCard />
      </div>
    </div>
  );
}
