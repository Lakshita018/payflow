import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon, PlusIcon, SendMoneyIcon } from './icons';
import { useNavigate } from 'react-router-dom';
import { walletService, transactionService } from '@/services';
import { useToast } from '@/providers/ToastProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: string | undefined): string {
  if (val === undefined || val === null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Inline Add Money Modal ────────────────────────────────────────────────────

function AddMoneyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [rawAmount, setRawAmount] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (amount: number) => walletService.credit(amount),
    onSuccess: () => {
      toast.success('Money added to wallet!');
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to add money. Please try again.';
      setError(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(rawAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) { setError('Please enter a valid amount greater than ₹0.'); return; }
    if (amount > 100000) { setError('Maximum amount per transaction is ₹1,00,000.'); return; }
    mutation.mutate(amount);
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm p-4 sm:items-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <motion.div
          key="modal-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-money-title"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-modal"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 id="quick-add-money-title" className="text-lg font-semibold text-text-primary">Add Money to Wallet</h2>
            <button type="button" onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-600"
              aria-label="Close dialog">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Amount</label>
              <div className="flex items-center rounded-xl border border-border bg-surface-subtle px-4 py-3 transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <span className="mr-2 text-xl font-medium text-text-secondary">₹</span>
                <input type="text" inputMode="decimal" value={rawAmount}
                  onChange={(e) => { setError(''); setRawAmount(e.target.value.replace(/[^0-9.]/g, '')); }}
                  placeholder="0.00" autoFocus
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted tabular-nums" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button key={amount} type="button"
                  onClick={() => { setError(''); setRawAmount(String(amount)); }}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                  ₹{amount.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            {error && <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={mutation.isPending}>Cancel</Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={mutation.isPending || !rawAmount} loading={mutation.isPending}>
                {mutation.isPending ? 'Adding…' : 'Add Money'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── QuickActionsCard ──────────────────────────────────────────────────────────

export function QuickActionsCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddMoney, setShowAddMoney] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const handleAddMoneySuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const actions = [
    {
      label: 'Send Money',
      description: 'Transfer to anyone instantly',
      icon: SendMoneyIcon,
      iconBg: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400',
      onClick: () => navigate(ROUTES.SEND_MONEY),
    },
    {
      label: 'Add Money',
      description: 'Top up your wallet',
      icon: PlusIcon,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      onClick: () => setShowAddMoney(true),
    },
  ];

  const stats = [
    { label: 'Total sent', value: fmt(dashboard?.totalSent) },
    { label: 'Total received', value: fmt(dashboard?.totalReceived) },
  ];

  return (
    <>
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

      {showAddMoney && (
        <AddMoneyModal
          onClose={() => setShowAddMoney(false)}
          onSuccess={handleAddMoneySuccess}
        />
      )}
    </>
  );
}
