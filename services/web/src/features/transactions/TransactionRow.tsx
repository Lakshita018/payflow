import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { ChevronRightIcon } from '@/features/dashboard/icons';
import { transactionGridColumnsClassName } from './TransactionTable';
import type { TransactionItem } from './types';

interface TransactionRowProps {
  transaction: TransactionItem;
  onClick: () => void;
}

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const isReceived = transaction.kind === 'received';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group grid w-full grid-cols-1 gap-4 px-4 py-4 text-left transition-all duration-200 hover:bg-surface-muted/60 lg:items-center lg:gap-5 lg:px-5',
        transactionGridColumnsClassName,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={transaction.name}
          size="md"
          className={isReceived ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{transaction.name}</p>
          <p className="truncate text-sm text-text-muted">{transaction.phone}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{transaction.description}</p>
        <p className="mt-1 text-xs text-text-muted lg:hidden">{transaction.transactionId}</p>
        <p className="mt-1 text-xs text-text-muted lg:hidden">{transaction.date} · {transaction.time}</p>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="text-sm font-medium text-text-primary">{transaction.transactionId}</p>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="text-sm text-text-secondary">{transaction.date}</p>
        <p className="text-sm text-text-muted">{transaction.time}</p>
      </div>

      <div className="flex items-center lg:justify-end">
        <p className={['text-sm font-semibold', isReceived ? 'text-success' : 'text-danger'].join(' ')}>
          {transaction.amount}
        </p>
      </div>

      <div className="flex items-center lg:justify-center">
        <Badge variant={isReceived ? 'success' : 'danger'} className="min-w-[5.5rem] justify-center px-2.5 py-1 text-center">
          {isReceived ? 'Received' : 'Sent'}
        </Badge>
      </div>

      <div className="flex items-center justify-start lg:justify-center">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}