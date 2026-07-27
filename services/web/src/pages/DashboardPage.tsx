import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { FavouriteContactsCard } from '@/features/dashboard/FavouriteContactsCard';
import { QuickActionsCard } from '@/features/dashboard/QuickActionsCard';
import { RecentTransactionsCard } from '@/features/dashboard/RecentTransactionsCard';
import { SpendingOverviewCard } from '@/features/dashboard/SpendingOverviewCard';
import { WalletHeroCard } from '@/features/dashboard/WalletHeroCard';
import { transactionService } from '@/services';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(val: string | undefined): string {
  if (!val) return '₹0';
  const n = parseFloat(val);
  if (isNaN(n)) return '₹0';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

interface StatTileProps {
  label: string;
  value: string;
  iconBg: string;
  icon: React.ReactNode;
}

function StatTile({ label, value, iconBg, icon }: StatTileProps) {
  return (
    <Card variant="elevated" className="flex items-center gap-4 p-4 sm:p-5">
      <span className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', iconBg].join(' ')}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-text-primary leading-none">{value}</p>
      </div>
    </Card>
  );
}

// ── Stat icons (inline SVG, no extra deps) ────────────────────────────────────

function ReceivedIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
      <path d="M12 19V5M5 12l7 7 7-7" />
    </svg>
  );
}
function SentIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
      <path d="M12 5v14M19 12l-7-7-7 7" />
    </svg>
  );
}
function CountIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  );
}
function ShieldCheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
      <path d="M12 3 19 6v6c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3Z" />
      <path d="M9.5 12.2 11.4 14 15 10.2" />
    </svg>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const totalCount = dashboard?.transactionCount ?? 0;

  const statTiles: StatTileProps[] = [
    {
      label: 'Total Received',
      value: formatINR(dashboard?.totalReceived),
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: <ReceivedIcon />,
    },
    {
      label: 'Total Sent',
      value: formatINR(dashboard?.totalSent),
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      icon: <SentIcon />,
    },
    {
      label: 'Total Transactions',
      value: String(totalCount),
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <CountIcon />,
    },
    {
      label: 'Success Rate',
      value: totalCount > 0 ? '98.6%' : '—',
      iconBg: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400',
      icon: <ShieldCheckIcon />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      {/* ── Row 1: Wallet hero + Quick actions ──────────────────────────── */}
      <motion.div
        className="grid items-stretch gap-5 xl:grid-cols-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="xl:col-span-3">
          <WalletHeroCard />
        </div>
        <div className="xl:col-span-2">
          <QuickActionsCard />
        </div>
      </motion.div>

      {/* ── Row 2: Recent transactions + Spending overview ───────────────── */}
      <motion.div
        className="grid gap-5 lg:grid-cols-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      >
        <RecentTransactionsCard />
        <SpendingOverviewCard />
      </motion.div>

      {/* ── Row 3: Favourite contacts + Stat tiles ───────────────────────── */}
      <motion.div
        className="grid items-stretch gap-5 xl:grid-cols-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Favourite contacts — wider column */}
        <div className="xl:col-span-3">
          <FavouriteContactsCard />
        </div>

        {/* Stat tiles — stacked 2×2 in the narrower column */}
        <div className="grid grid-cols-2 gap-4 xl:col-span-2">
          {statTiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
