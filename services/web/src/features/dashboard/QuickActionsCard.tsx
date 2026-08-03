import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon, RequestMoneyIcon, SendMoneyIcon } from './icons';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '@/services';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | undefined): string {
  if (val === undefined || val === null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── QuickActionsCard ──────────────────────────────────────────────────────────

export function QuickActionsCard() {
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const actions = [
    {
      label: 'Send Money',
      description: 'Transfer to anyone instantly',
      icon: SendMoneyIcon,
      iconBg: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400',
      onClick: () => navigate(ROUTES.SEND_MONEY),
    },
    {
      label: 'Request Money',
      description: 'Ask someone to pay you',
      icon: RequestMoneyIcon,
      iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      onClick: () => navigate(ROUTES.REQUEST_MONEY),
    },
  ];

  const stats = [
    { label: 'Total sent', value: fmt(dashboard?.totalSent) },
    { label: 'Total received', value: fmt(dashboard?.totalReceived) },
  ];

  return (
    <Card variant="elevated" className="flex h-full flex-col p-5 sm:p-6">
      <p className="text-base font-semibold text-text-primary">Quick Actions</p>

      {/* Action list */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              type="button"
              onClick={action.onClick}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className={[
                'group flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-muted/60',
                index === 0 ? 'border-b border-border' : '',
              ].join(' ')}
            >
              <span className={['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-[1.06]', action.iconBg].join(' ')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text-primary">{action.label}</span>
                <span className="block text-xs text-text-muted">{action.description}</span>
              </span>
              <ChevronRightIcon className="h-4 w-4 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
            </motion.button>
          );
        })}
      </div>

      {/* Stats chips */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface-subtle p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{s.label}</p>
            <p className="mt-1.5 text-sm font-semibold tabular-nums text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
