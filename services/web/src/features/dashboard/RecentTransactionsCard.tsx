import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/routes/paths';
import { ArrowUpRightIcon } from './icons';
import { useNavigate } from 'react-router-dom';

type TransactionItem = {
  name: string;
  description: string;
  time: string;
  amount: string;
  kind: 'received' | 'sent';
  initials: string;
};

const transactions: TransactionItem[] = [
  { name: 'Rohan Sharma', description: 'Dinner last night', time: 'Today, 10:30 AM', amount: '+ ₹1,250.00', kind: 'received', initials: 'RS' },
  { name: 'Priya Patel', description: 'Movie night', time: 'Yesterday, 8:15 PM', amount: '- ₹850.00', kind: 'sent', initials: 'PP' },
  { name: 'Arav Mehta', description: 'Rent split', time: 'May 16, 6:45 PM', amount: '+ ₹2,500.00', kind: 'received', initials: 'AM' },
  { name: 'Sneha Iyer', description: 'Thanks!', time: 'May 12, 9:20 AM', amount: '- ₹950.00', kind: 'sent', initials: 'SI' },
  { name: 'Kavya Nair', description: 'Gift return', time: 'May 10, 11:10 PM', amount: '+ ₹1,000.00', kind: 'received', initials: 'KN' },
];

export function RecentTransactionsCard() {
  const navigate = useNavigate();

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

      <div className="mt-6 divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border bg-surface">
        {transactions.map((transaction) => (
          <div key={`${transaction.name}-${transaction.time}`} className="flex items-center gap-4 px-4 py-4 transition-all duration-150 hover:bg-surface-muted/60 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <Avatar name={transaction.name} size="md" className={transaction.kind === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{transaction.kind === 'received' ? 'From ' : 'To '}{transaction.name}</p>
              <p className="truncate text-sm text-text-muted">{transaction.description}</p>
            </div>

            <div className="hidden shrink-0 text-right md:block">
              <p className="text-sm text-text-secondary">{transaction.time}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1 text-right">
              <p className={['text-sm font-semibold', transaction.kind === 'received' ? 'text-success' : 'text-danger'].join(' ')}>
                {transaction.amount}
              </p>
              <Badge variant={transaction.kind === 'received' ? 'success' : 'danger'} className="px-2.5 py-1">
                {transaction.kind === 'received' ? 'Received' : 'Sent'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

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
    </Card>
  );
}