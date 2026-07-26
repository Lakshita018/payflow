import { useQuery } from '@tanstack/react-query';
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

function formatAmount(tx: Transaction): { text: string; kind: 'received' | 'sent' } {
  // direction is the authoritative field: CREDIT = money in, DEBIT = money out
  const isCredit = tx.direction === 'CREDIT';
  const num = parseFloat(tx.amount);
  const formatted = '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    text: isCredit ? `+ ${formatted}` : `- ${formatted}`,
    kind: isCredit ? 'received' : 'sent',
  };
}

function getCounterpartyName(tx: Transaction): string {
  if (tx.type === 'ADD_MONEY') return 'Added to wallet';
  // DEBIT row → sender is self, counterparty is receiver
  if (tx.direction === 'DEBIT') {
    return tx.receiverPayflowId?.split('@')[0] ?? tx.receiverPayflowId ?? 'Unknown';
  }
  // CREDIT row → receiver is self, counterparty is sender
  return tx.senderPayflowId?.split('@')[0] ?? tx.senderPayflowId ?? 'Unknown';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function RecentTransactionsCard() {
  const navigate = useNavigate();
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const recentTransactions = dashboard?.recentTransactions ?? [];

  return (
    <Card variant="elevated" className="h-full p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg font-semibold tracking-tight text-text-primary">Recent Transactions</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.TRANSACTIONS)}
          className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
        >
          View all
        </button>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No transactions yet"
            description="Add money to your wallet or send money to get started."
            action={{ label: 'Add Money', onClick: () => navigate(ROUTES.DASHBOARD) }}
          />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border bg-surface">
          {recentTransactions.map((tx) => {
            const { text: amountText, kind } = formatAmount(tx);
            const counterparty = getCounterpartyName(tx);
            const description = tx.type === 'ADD_MONEY' ? 'Wallet top-up' : (tx.note ?? 'Transfer');
            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-4 py-4 transition-all duration-150 hover:bg-surface-muted/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
              >
                <Avatar
                  name={counterparty}
                  size="md"
                  className={kind === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {tx.type === 'ADD_MONEY' ? 'Wallet Top-up' : (kind === 'received' ? `From ${counterparty}` : `To ${counterparty}`)}
                  </p>
                  <p className="truncate text-sm text-text-muted">{description}</p>
                </div>

                <div className="hidden shrink-0 text-right md:block">
                  <p className="text-sm text-text-secondary">{formatDate(tx.createdAt as unknown as string)}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <p className={['text-sm font-semibold', kind === 'received' ? 'text-success' : 'text-danger'].join(' ')}>
                    {amountText}
                  </p>
                  <Badge variant={kind === 'received' ? 'success' : 'danger'} className="px-2.5 py-1">
                    {tx.type === 'ADD_MONEY' ? 'Added' : (kind === 'received' ? 'Received' : 'Sent')}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recentTransactions.length > 0 && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.TRANSACTIONS)}
            className="group gap-2 rounded-full px-4 py-2 text-brand-700 transition-all duration-200 hover:bg-brand-50 hover:underline underline-offset-4"
            rightIcon={<ArrowUpRightIcon className="h-4 w-4" />}
          >
            View All Transactions
          </Button>
        </div>
      )}
    </Card>
  );
}
