import { useState } from 'react';
import Button from '@/components/ui/Button';
import { TransactionFilters, type FilterOption } from '@/features/transactions/TransactionFilters';
import { TransactionSearch } from '@/features/transactions/TransactionSearch';
import { TransactionTable } from '@/features/transactions/TransactionTable';
import type { TransactionItem } from '@/features/transactions/types';

const transactions: TransactionItem[] = [
  { id: 'txn-784512', name: 'Rohan Sharma', phone: '+91 98765 43210', description: 'Dinner last night', transactionId: 'TXN784512', date: 'Today', time: '10:30 AM', amount: '+ ₹1,250.00', kind: 'received', initials: 'RS' },
  { id: 'txn-784511', name: 'Priya Patel', phone: '+91 91234 56789', description: 'Movie night', transactionId: 'TXN784511', date: 'Yesterday', time: '8:15 PM', amount: '- ₹850.00', kind: 'sent', initials: 'PP' },
  { id: 'txn-784510', name: 'Arav Mehta', phone: '+91 99887 76655', description: 'Rent split', transactionId: 'TXN784510', date: 'May 16, 2024', time: '6:45 PM', amount: '+ ₹2,500.00', kind: 'received', initials: 'AM' },
  { id: 'txn-784509', name: 'Sneha Iyer', phone: '+91 90001 23456', description: 'Thanks!', transactionId: 'TXN784509', date: 'May 12, 2024', time: '9:20 AM', amount: '- ₹950.00', kind: 'sent', initials: 'SI' },
  { id: 'txn-784508', name: 'Kavya Nair', phone: '+91 95555 12345', description: 'Gift return', transactionId: 'TXN784508', date: 'May 10, 2024', time: '11:10 PM', amount: '+ ₹1,000.00', kind: 'received', initials: 'KN' },
  { id: 'txn-784507', name: 'Vikas Patel', phone: '+91 98877 66554', description: 'Lunch', transactionId: 'TXN784507', date: 'May 9, 2024', time: '1:05 PM', amount: '- ₹450.00', kind: 'sent', initials: 'VP' },
  { id: 'txn-784506', name: 'Aanya Singh', phone: '+91 97766 55443', description: 'Book share', transactionId: 'TXN784506', date: 'May 8, 2024', time: '7:45 PM', amount: '+ ₹300.00', kind: 'received', initials: 'AS' },
];

export function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const visibleTransactions = transactions;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <TransactionSearch />

        <div className="flex justify-start lg:justify-end">
          <Button variant="secondary" className="h-11 rounded-2xl px-4 text-sm font-semibold">
            Select Date Range
          </Button>
        </div>
      </div>

      <TransactionFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <TransactionTable transactions={visibleTransactions} />

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          Previous
        </Button>
        <Button variant="primary" size="sm" className="rounded-full px-4">
          1
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          2
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          3
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          4
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          5
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full px-4 text-text-secondary hover:bg-surface-muted">
          Next
        </Button>
      </div>
    </div>
  );
}
