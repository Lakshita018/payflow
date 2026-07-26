import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon, PlusIcon, SendMoneyIcon } from './icons';
import { useNavigate } from 'react-router-dom';
import { walletService } from '@/services';

// ── Inline Add Money Modal ────────────────────────────────────────────────────

function AddMoneyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [rawAmount, setRawAmount] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (amount: number) => walletService.credit(amount),
    onSuccess: () => { onSuccess(); onClose(); },
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Add Money to Wallet</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Amount</label>
            <div className="flex items-center rounded-xl border border-border bg-surface-subtle px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <span className="mr-2 text-xl font-medium text-text-secondary">₹</span>
              <input type="text" inputMode="decimal" value={rawAmount} onChange={(e) => { setError(''); setRawAmount(e.target.value.replace(/[^0-9.]/g, '')); }} placeholder="0.00" autoFocus className="flex-1 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((amount) => (
              <button key={amount} type="button" onClick={() => { setError(''); setRawAmount(String(amount)); }} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                ₹{amount.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          {error && <p className="rounded-lg bg-danger/5 border border-danger/20 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1 rounded-2xl" disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1 rounded-2xl" disabled={mutation.isPending || !rawAmount}>
              {mutation.isPending ? 'Adding…' : 'Add Money'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── QuickActionsCard ──────────────────────────────────────────────────────────

export function QuickActionsCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddMoney, setShowAddMoney] = useState(false);

  const handleAddMoneySuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const actions = [
    {
      label: 'Send Money',
      description: 'Transfer to anyone',
      icon: SendMoneyIcon,
      onClick: () => navigate(ROUTES.SEND_MONEY),
    },
    {
      label: 'Add Money',
      description: 'Add funds to wallet',
      icon: PlusIcon,
      onClick: () => setShowAddMoney(true),
    },
  ];

  return (
    <>
      <Card variant="elevated" className="h-full p-6 sm:p-7">
        <p className="text-lg font-semibold tracking-tight text-text-primary">Quick Actions</p>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={[
                  'group flex w-full items-center gap-4 px-4 py-5 text-left transition-all duration-200 ease-out hover:-translate-y-px hover:bg-surface-muted',
                  index === 0 ? 'border-b border-border' : '',
                ].join(' ')}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-[1.03]">
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text-primary">{action.label}</span>
                  <span className="block text-sm text-text-muted">{action.description}</span>
                </span>

                <ChevronRightIcon className="h-4 w-4 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            );
          })}
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
