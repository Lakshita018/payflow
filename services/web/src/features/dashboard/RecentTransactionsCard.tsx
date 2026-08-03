import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/paths';
import { ArrowUpRightIcon } from './icons';
import { useNavigate } from 'react-router-dom';
import { transactionService } from '@/services';
import type { Transaction } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(tx: Transaction): { text: string; kind: 'received' | 'sent' } {
  const isCredit = tx.direction === 'CREDIT';
  const num = parseFloat(tx.amount);
  const formatted = '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    text: isCredit ? `+ ${formatted}` : `- ${formatted}`,
    kind: isCredit ? 'received' : 'sent',
  };
}

function getCounterpartyName(tx: Transaction): string {
  if (tx.type === 'ADD_MONEY') return 'Wallet Top-up';
  if (tx.direction === 'DEBIT') {
    return tx.receiverPayflowId?.split('@')[0] ?? tx.receiverPayflowId ?? 'Unknown';
  }
  return tx.senderPayflowId?.split('@')[0] ?? tx.senderPayflowId ?? 'Unknown';
}

function getSubLabel(tx: Transaction, kind: 'received' | 'sent'): string {
  if (tx.type === 'ADD_MONEY') return 'Wallet top-up';
  if (tx.note) return tx.note;
  return kind === 'received' ? 'Payment received' : 'Transfer sent';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const rowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

// ── RecentTransactionsCard ────────────────────────────────────────────────────

export function RecentTransactionsCard() {
  const navigate = useNavigate();
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const recentTransactions = dashboard?.recentTransactions ?? [];

  return (
    <Card variant="elevated" className="h-full p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-text-primary">Recent Transactions</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.TRANSACTIONS)}
          className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          View all →
        </button>
      </div>

      {/* Empty state */}
      {recentTransactions.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No transactions yet"
            description="Add money to your wallet or send money to get started."
            action={{ label: 'Add Money', onClick: () => navigate(ROUTES.DASHBOARD) }}
          />
        </div>
      ) : (
        <>
          {/* Transaction rows */}
          <motion.div
            className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-surface"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {recentTransactions.map((tx) => {
              const { text: amountText, kind } = formatAmount(tx);
              const counterparty = getCounterpartyName(tx);
              const subLabel = getSubLabel(tx, kind);
              const label = tx.type === 'ADD_MONEY'
                ? 'Wallet Top-up'
                : (kind === 'received' ? `From ${counterparty}` : `To ${counterparty}`);

              return (
                <motion.button
                  key={tx.id}
                  type="button"
                  variants={rowVariants}
                  onClick={() => navigate(`/transactions/${tx.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted/50 focus-visible:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600/50"
                >
                  {/* Avatar */}
                  <Avatar
                    name={counterparty}
                    size="md"
                    className={[
                      'shrink-0',
                      kind === 'received'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
                    ].join(' ')}
                  />

                  {/* Name + sub-label */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{label}</p>
                    <p className="truncate text-xs text-text-muted">{subLabel}</p>
                  </div>

                  {/* Date — desktop only */}
                  <p className="hidden shrink-0 text-right text-[11px] text-text-muted sm:block">
                    {formatDate(tx.createdAt as unknown as string)}
                  </p>

                  {/* Amount + badge */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className={[
                      'text-sm font-semibold tabular-nums',
                      kind === 'received' ? 'text-success' : 'text-danger',
                    ].join(' ')}>
                      {amountText}
                    </p>
                    <Badge
                      variant={kind === 'received' ? 'success' : 'danger'}
                      className="px-2 py-0.5 text-[10px] leading-tight"
                    >
                      {tx.type === 'ADD_MONEY' ? 'Added' : (kind === 'received' ? 'Received' : 'Sent')}
                    </Badge>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* View all CTA */}
          <div className="mt-4 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => navigate(ROUTES.TRANSACTIONS)}
              className="gap-1.5 text-sm text-brand-600 hover:bg-brand-50"
              rightIcon={<ArrowUpRightIcon className="h-4 w-4" />}
            >
              View All Transactions
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
