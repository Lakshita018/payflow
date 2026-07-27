import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
    <PageContainer>
      <motion.div
        className="grid gap-5 xl:grid-cols-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Main profile card */}
        <Card variant="elevated" className="xl:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={user?.email ?? 'User'} size="xl" className="bg-brand-100 text-brand-700" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-text-primary">{displayName}</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">{user?.email ?? '—'}</p>
                <p className="mt-0.5 text-xs text-text-muted font-mono">{payflowId}</p>
              </div>
            </div>

            {/* PayFlow ID chip */}
            <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">PayFlow ID</p>
              <p className="mt-1 text-sm font-semibold text-text-primary font-mono">{payflowId}</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Primary Wallet</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">{balanceDisplay}</p>
              <p className="mt-0.5 text-xs text-text-muted">Available balance</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Account Status</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">Active</p>
              <p className="mt-0.5 text-xs text-text-muted">Wallet verified</p>
            </div>
          </div>
        </Card>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard
            title="Wallet Balance"
            value={balanceDisplay}
            description="Primary wallet"
          />
          <StatCard
            title="Transactions"
            value={String(txCount)}
            description="All-time activity"
          />
          <StatCard
            title="Favourite Contacts"
            value={String(favCount)}
            description="Saved recipients"
          />
        </div>
      </motion.div>
    </PageContainer>
  );
}
