import { useQuery } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { PageContainer } from '@/layouts/PageContainer';
import { useAuthStore } from '@/store';
import { walletService, transactionService, userService } from '@/services';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'Account';
  const payflowId = user?.payflowId ?? '—';

  const { data: wallet } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: walletService.getBalance,
    staleTime: 30_000,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn: userService.getFavourites,
    staleTime: 60_000,
  });

  const balanceDisplay = wallet?.balance
    ? '₹' + parseFloat(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';

  const txCount = dashboard?.transactionCount ?? 0;
  const favCount = favourites.length;

  return (
    <PageContainer title="Profile" subtitle="Manage your PayFlow account.">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="elevated" className="xl:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={user?.email ?? 'User'} size="xl" className="bg-brand-100 text-brand-700" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-text-primary">{displayName}</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">{user?.email ?? '—'}</p>
                <p className="mt-1 text-sm text-text-muted">{payflowId}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-muted px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">PayFlow ID</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">{payflowId}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text-secondary">Primary Wallet</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">{balanceDisplay}</p>
              <p className="mt-1 text-sm text-text-muted">Available balance</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text-secondary">Account Status</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">Active</p>
              <p className="mt-1 text-sm text-text-muted">Wallet verified</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard title="Wallet Balance" value={balanceDisplay} description="Primary wallet" />
          <StatCard title="Transactions" value={String(txCount)} description="All-time activity" />
          <StatCard title="Favourite Contacts" value={String(favCount)} description="Saved recipients" />
        </div>
      </div>
    </PageContainer>
  );
}
