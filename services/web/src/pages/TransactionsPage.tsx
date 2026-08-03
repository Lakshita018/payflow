import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/LoadingSkeleton';
import { TransactionFilters, type FilterOption } from '@/features/transactions/TransactionFilters';
import { TransactionSearch } from '@/features/transactions/TransactionSearch';
import { TransactionTable } from '@/features/transactions/TransactionTable';
import { transactionService } from '@/services';
import type { Transaction } from '@/types';
import type { TransactionRecord } from '@/features/transactions/mockTransactions';

// ── helpers ──────────────────────────────────────────────────────────────────

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
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return {
    id: tx.id,
    name: isAddMoney ? 'Wallet Top-up' : counterpartyName,
    phone: isAddMoney ? '—' : counterpartyPayflowId ?? '—',
    description: tx.note ?? (isAddMoney ? 'Added to wallet' : 'Transfer'),
    transactionId: tx.id.split('-')[0].toUpperCase(),
    date: dateStr,
    time: timeStr,
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
    summaryDate: dateStr,
    summaryTime: timeStr,
    dateTime: `${dateStr} · ${timeStr}`,
    createdAt: date.toISOString(),
  };
}

function filterByDate(records: TransactionRecord[], filter: FilterOption): TransactionRecord[] {
  const now = new Date();
  switch (filter) {
    case 'Received':
      return records.filter((r) => r.kind === 'received');
    case 'Sent':
      return records.filter((r) => r.kind === 'sent');
    case 'Today':
      return records.filter((r) => new Date(r.createdAt).toDateString() === now.toDateString());
    case 'This Week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return records.filter((r) => new Date(r.createdAt) >= weekAgo);
    }
    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return records.filter((r) => new Date(r.createdAt) >= start);
    }
    default:
      return records;
  }
}

function filterBySearch(records: TransactionRecord[], query: string): TransactionRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;
  return records.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.transactionId.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q),
  );
}

function filterByRange(
  records: TransactionRecord[],
  from: string,
  to: string,
): TransactionRecord[] {
  if (!from && !to) return records;
  const fromDate = from ? new Date(from) : null;
  // Set "to" to end of day so the selected day is fully included
  const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
  return records.filter((r) => {
    const d = new Date(r.createdAt);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });
}

// ── DateRangePicker ───────────────────────────────────────────────────────────

interface DateRangePickerProps {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
  isActive: boolean;
}

function DateRangePicker({ from, to, onApply, onClear, isActive }: DateRangePickerProps) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD, never a future date
  const [open, setOpen] = useState(false);
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  // Sync local state when external values are cleared
  useEffect(() => {
    setLocalFrom(from);
    setLocalTo(to);
  }, [from, to]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleApply = () => {
    onApply(localFrom, localTo);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFrom('');
    setLocalTo('');
    onClear();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all duration-150',
          isActive
            ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
            : 'border-border bg-white text-text-secondary hover:border-border-strong hover:text-text-primary dark:bg-surface',
        ].join(' ')}
      >
        {/* Calendar icon */}
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {isActive && from && to
          ? `${new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
          : isActive && from
            ? `From ${new Date(from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
            : isActive && to
              ? `Until ${new Date(to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'Date Range'}
        {isActive && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date range"
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleClear(); } }}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-72 rounded-2xl border border-border bg-white p-4 shadow-lg dark:bg-surface"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Filter by date range
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">From</label>
                <input
                  type="date"
                  value={localFrom}
                  max={localTo || today}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-surface-muted"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">To</label>
                <input
                  type="date"
                  value={localTo}
                  min={localFrom || undefined}
                  max={today}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-surface-muted"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!localFrom && !localTo}
                className="flex-1 rounded-xl bg-brand-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TransactionsPage ──────────────────────────────────────────────────────────

export function TransactionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [search, setSearch] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
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

  const filtered = useMemo(
    () => filterBySearch(filterByRange(filterByDate(allRecords, activeFilter), rangeFrom, rangeTo), search),
    [allRecords, activeFilter, search, rangeFrom, rangeTo],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: FilterOption) => { setActiveFilter(f); setPage(1); };
  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleRangeApply = (from: string, to: string) => { setRangeFrom(from); setRangeTo(to); setPage(1); };
  const handleRangeClear = () => { setRangeFrom(''); setRangeTo(''); setPage(1); };

  return (
    <motion.div
      className="mx-auto w-full max-w-7xl space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Search + Date range */}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <TransactionSearch value={search} onChange={handleSearch} />
        <DateRangePicker
          from={rangeFrom}
          to={rangeTo}
          onApply={handleRangeApply}
          onClear={handleRangeClear}
          isActive={Boolean(rangeFrom || rangeTo)}
        />
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
