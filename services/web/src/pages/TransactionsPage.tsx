import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import { TransactionFilters, type FilterOption } from '@/features/transactions/TransactionFilters';
import { TransactionSearch } from '@/features/transactions/TransactionSearch';
import { TransactionTable } from '@/features/transactions/TransactionTable';
import { transactionService } from '@/services';
import type { Transaction } from '@/types';
import type { TransactionRecord } from '@/features/transactions/mockTransactions';

function toTransactionRecord(tx: Transaction): TransactionRecord {
  const isAddMoney = tx.type === 'ADD_MONEY';
  const isCredit = tx.direction === 'CREDIT';

  const counterpartyPayflowId = isAddMoney
    ? 'wallet'
    : (isCredit ? tx.senderPayflowId : tx.receiverPayflowId);
  const counterpartyName = counterpartyPayflowId?.split('@')[0] ?? counterpartyPayflowId ?? 'Unknown';

  const num = parseFloat(tx.amount);
  const formatted = '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = new Date(tx.createdAt as unknown as string);

  return {
    id: tx.id,
    name: isAddMoney ? 'Wallet Top-up' : counterpartyName,
    phone: isAddMoney ? '—' : counterpartyPayflowId ?? '—',
    description: tx.note ?? (isAddMoney ? 'Added to wallet' : 'Transfer'),
    transactionId: tx.id.split('-')[0].toUpperCase(),
    date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    amount: isCredit ? `+ ${formatted}` : `- ${formatted}`,
    kind: isCredit ? 'received' : 'sent',
    initials: (isAddMoney ? 'W' : counterpartyName.slice(0, 2).toUpperCase()),
    contactLabel: isCredit ? 'From' : 'To',
    statusLabel: isAddMoney ? 'Added' : (isCredit ? 'Received' : 'Sent'),
    referenceId: tx.id,
    paymentMethod: 'PayFlow Wallet',
    amountSign: isCredit ? '+' : '-',
    amountValue: formatted,
    amountWords: '',
    summaryDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    summaryTime: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    dateTime: `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
  };
}

function filterTransactions(records: TransactionRecord[], filter: FilterOption): TransactionRecord[] {
  const now = new Date();
  switch (filter) {
    case 'Received':
      return records.filter((r) => r.kind === 'received');
    case 'Sent':
      return records.filter((r) => r.kind === 'sent');
    case 'Today':
      return records.filter((r) => {
        const d = new Date(r.summaryDate);
        return d.toDateString() === now.toDateString();
      });
    case 'This Week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return records.filter((r) => new Date(r.date) >= weekAgo);
    }
    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return records.filter((r) => new Date(r.date) >= start);
    }
    default:
      return records;
  }
}

export function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', 'history'],
    queryFn: transactionService.getHistory,
    staleTime: 30_000,
  });

  const allRecords = useMemo(
    () => transactions.map((tx) => toTransactionRecord(tx)),
    [transactions],
  );

  const filtered = useMemo(() => filterTransactions(allRecords, activeFilter), [allRecords, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: FilterOption) => {
    setActiveFilter(f);
    setPage(1);
  };

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Search + Date range */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <TransactionSearch />
        <Button variant="secondary" className="h-10 rounded-xl px-4 text-sm font-medium">
          Date Range
        </Button>
      </div>

      {/* Filters */}
      <TransactionFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      {/* Table */}
      {isLoading ? (
        <TableRowSkeleton rows={8} cols={5} />
      ) : (
        <TransactionTable transactions={paged} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl px-3 text-text-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'primary' : 'ghost'}
              size="sm"
              className="min-w-[2rem] rounded-xl px-3"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl px-3 text-text-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </Button>
        </div>
      )}
    </motion.div>
  );
}
