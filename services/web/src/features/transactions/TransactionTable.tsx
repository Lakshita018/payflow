import Card from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { TransactionEmptyState } from './TransactionEmptyState';
import { TransactionRow } from './TransactionRow';
import type { TransactionItem } from './types';

interface TransactionTableProps {
  transactions: TransactionItem[];
}

export const transactionGridColumnsClassName =
  'lg:grid-cols-[2.5fr_2fr_1.4fr_1.6fr_1.2fr_1fr_40px]';

export function TransactionTable({ transactions }: TransactionTableProps) {
  const navigate = useNavigate();

  if (!transactions.length) {
    return <TransactionEmptyState />;
  }

  return (
    <Card variant="elevated" className="overflow-hidden p-0">
      <div
        className={[
          'hidden border-b border-border bg-surface-muted px-5 py-3 lg:grid lg:items-center lg:gap-5',
          transactionGridColumnsClassName,
        ].join(' ')}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Contact</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Description</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Transaction ID</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Date & Time</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:text-right">Amount</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:text-center">Status</div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted lg:text-center">Action</div>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onClick={() => navigate(`${ROUTES.TRANSACTIONS}/${transaction.id}`)}
          />
        ))}
      </div>
    </Card>
  );
}