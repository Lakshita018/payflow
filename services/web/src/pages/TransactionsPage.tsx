import { useState } from 'react';
import Button from '@/components/ui/Button';
import { TransactionFilters, type FilterOption } from '@/features/transactions/TransactionFilters';
import { TransactionSearch } from '@/features/transactions/TransactionSearch';
import { TransactionTable } from '@/features/transactions/TransactionTable';
import { transactionRecords } from '@/features/transactions/mockTransactions';

export function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const visibleTransactions = transactionRecords;

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
