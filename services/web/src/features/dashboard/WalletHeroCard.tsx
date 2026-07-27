import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { walletService, transactionService } from '@/services';
import { useAuthStore } from '@/store';
import { ROUTES } from '@/routes/paths';
import { PlusIcon, SendMoneyIcon } from './icons';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBalance(balance: string | undefined): string {
  if (!balance) return '₹0.00';
  const num = parseFloat(balance);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
// Draws a smooth SVG polyline from a set of transaction amounts.
// The line is reversed so the most-recent entry is on the right.

interface SparklineProps {
  /** Raw amount values, oldest-first */
  points: number[];
}

function Sparkline({ points }: SparklineProps) {
  const W = 180;
  const H = 64;
  const PAD = 6;

  if (points.length < 2) {
    // Not enough data — just draw a flat dim line
    const y = H / 2;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden="true">
        <line x1={PAD} y1={y} x2={W - PAD} y2={y}
          stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => {
    const x = PAD + (i / (points.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  // Build a smooth cubic-bezier path
  let d = `M ${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i++) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
  }

  // Fill path (closed)
  const fillD = `${d} L ${coords[coords.length - 1][0]},${H} L ${coords[0][0]},${H} Z`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="spk-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={fillD} fill="url(#spk-fill)" />
      {/* Line */}
      <path d={d} fill="none" stroke="#c4b5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={lastX} cy={lastY} r="4" fill="#c4b5fd" />
      <circle cx={lastX} cy={lastY} r="7" fill="rgba(196,181,253,0.25)" />
    </svg>
  );
}

// ── Add Money Modal ───────────────────────────────────────────────────────────

interface AddMoneyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddMoneyModal({ onClose, onSuccess }: AddMoneyModalProps) {
  const [rawAmount, setRawAmount] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (amount: number) => walletService.credit(amount),
    onSuccess: () => {
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
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (amount > 100000) {
      setError('Maximum amount per transaction is ₹1,00,000.');
      return;
    }
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-modal"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Add Money to Wallet</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close"
            >
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={rawAmount}
                  onChange={(e) => {
                    setError('');
                    setRawAmount(e.target.value.replace(/[^0-9.]/g, ''));
                  }}
                  placeholder="0.00"
                  autoFocus
                  className="flex-1 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setError('');
                    setRawAmount(String(amount));
                  }}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  ₹{amount.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {error && (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={mutation.isPending}>
                Cancel
              </Button>
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

// ── WalletHeroCard ────────────────────────────────────────────────────────────

export function WalletHeroCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddMoney, setShowAddMoney] = useState(false);

  const user = useAuthStore((s) => s.user);

  const { data: wallet } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: walletService.getBalance,
    staleTime: 30_000,
  });

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

  const balance = formatBalance(wallet?.balance);

  // Derive sparkline points from recent transactions (oldest → newest, CREDIT = positive, DEBIT = negative)
  const sparkPoints: number[] = (dashboard?.recentTransactions ?? [])
    .slice()
    .reverse()
    .map((t) => {
      const amt = Math.abs(parseFloat(t.amount) || 0);
      return t.direction === 'CREDIT' ? amt : -amt;
    })
    // Convert to running balance deltas for a cumulative trend feel
    .reduce<number[]>((acc, delta) => {
      const prev = acc[acc.length - 1] ?? 0;
      acc.push(prev + delta);
      return acc;
    }, []);

  // Month-over-month net: received this month vs spending this month
  const rxMonth = parseFloat(dashboard?.moneyReceivedThisMonth ?? '0') || 0;
  const spMonth = parseFloat(dashboard?.monthlySpending ?? '0') || 0;
  const netMonth = rxMonth - spMonth;
  const netSign  = netMonth >= 0 ? '+' : '';
  const netLabel = rxMonth + spMonth > 0
    ? `${netSign}${((netMonth / (rxMonth + spMonth)) * 100).toFixed(1)}%`
    : null;

  // Mask the payflowId to look like a card number
  const maskedId = user?.payflowId
    ? '···· ' + user.payflowId.replace('@payflow', '').slice(-4).padStart(4, '·')
    : '···· ····';

  return (
    <>
      <Card
        variant="elevated"
        className="relative flex h-full flex-col justify-between overflow-hidden border-0 bg-[linear-gradient(135deg,#4c1d95_0%,#5b21b6_30%,#6d28d9_65%,#7c3aed_100%)] p-6 text-white shadow-[0_24px_60px_rgb(109_40_217/0.28)] sm:p-7"
      >
        {/* Decorative glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(255_255_255/0.20),transparent_34%),radial-gradient(circle_at_bottom_left,rgb(255_255_255/0.06),transparent_26%)]" />
        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:20px_20px]" />

        {/* ── Top: card visual + sparkline panel ──────────────────────────── */}
        <div className="relative flex items-start gap-3">
          {/* Physical card */}
          <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            {/* Card header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">PayFlow Wallet</span>
              {/* Contactless icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-white/50" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                <path d="M5.5 19A10 10 0 0 1 5.5 5" strokeLinecap="round"/>
                <path d="M8.5 16A6 6 0 0 1 8.5 8" strokeLinecap="round"/>
                <path d="M11.5 13A3 3 0 0 1 11.5 11" strokeLinecap="round"/>
                <circle cx="13.5" cy="12" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            {/* Balance */}
            <p className="mt-3 text-xs font-medium text-white/55">Balance</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-white">{balance}</p>
            {/* Masked ID */}
            <p className="mt-3 text-xs font-mono tracking-[0.18em] text-white/45">{maskedId}</p>
          </div>

          {/* Sparkline panel */}
          <div className="flex w-36 shrink-0 flex-col rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm sm:w-44">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-medium text-white/60">This month</span>
              {netLabel && (
                <span className={[
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  netMonth >= 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300',
                ].join(' ')}>
                  {netLabel}
                </span>
              )}
            </div>
            <div className="mt-2 h-16">
              <Sparkline points={sparkPoints} />
            </div>
          </div>
        </div>

        {/* ── Bottom: balance label + actions ─────────────────────────────── */}
        <div className="relative mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Total Wallet Balance</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{balance}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              className="h-10 rounded-xl border-0 bg-white px-5 text-sm font-semibold text-brand-700 shadow-[0_8px_24px_rgb(15_23_42/0.14)] transition-all hover:-translate-y-px hover:bg-white/95 hover:shadow-[0_12px_28px_rgb(15_23_42/0.18)]"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setShowAddMoney(true)}
            >
              Add Money
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:bg-white/16"
              leftIcon={<SendMoneyIcon className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.SEND_MONEY)}
            >
              Send Money
            </Button>
          </div>
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
