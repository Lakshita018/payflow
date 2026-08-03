import { useState, useEffect, type SVGProps } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { transactionService, userService, walletService } from '@/services';

// ── Icon helpers ──────────────────────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement>;

function XCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function ShieldCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function WalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function StarIcon(props: IconProps & { filled?: boolean }) {
  const { filled, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ── Amount in words ───────────────────────────────────────────────────────────

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
  return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
}

function amountInWords(raw: string): string {
  const cleaned = raw.replace(/,/g, '');
  const n = parseFloat(cleaned);
  if (!n || isNaN(n)) return '';
  const int = Math.floor(n);
  const dec = Math.round((n - int) * 100);
  const base = `Rupees ${numToWords(int)}`;
  return dec > 0 ? `${base} and ${numToWords(dec)} Paise Only` : `${base} Only`;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// ── Success Modal ─────────────────────────────────────────────────────────────

interface SuccessModalProps {
  receiverName: string;
  receiverPayflowId: string;
  amount: string;
  onAddFavourite: () => void;
  onDone: () => void;
  isAddingFavourite: boolean;
  alreadyFavourite: boolean;
}

function SuccessModal({ receiverName, receiverPayflowId, amount, onAddFavourite, onDone, isAddingFavourite, alreadyFavourite }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Money Sent!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{amount}</span> sent to <span className="font-semibold text-text-primary">{receiverName}</span>
        </p>
        <p className="mt-1 text-xs text-text-muted">{receiverPayflowId}</p>

        {!alreadyFavourite && (
          <button
            type="button"
            onClick={onAddFavourite}
            disabled={isAddingFavourite}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-50"
          >
            <StarIcon className="h-4 w-4" />
            {isAddingFavourite ? 'Saving…' : 'Add to Favourite Contacts'}
          </button>
        )}
        {alreadyFavourite && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-success">
            <StarIcon filled className="h-3.5 w-3.5" />
            Added to favourites
          </p>
        )}

        <Button variant="primary" fullWidth className="mt-4 rounded-2xl" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SendMoneyPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Read prefilled PayFlow ID from navigation state (set by User Profile → Send Money)
  const location = useLocation();
  const prefillId: string = (location.state as { prefillPayflowId?: string } | null)?.prefillPayflowId ?? '';

  // Recipient lookup
  // Strip @payflow suffix when storing – we re-append on lookup
  const stripSuffix = (v: string) => v.replace(/@payflow$/i, '').trim();
  const [payflowIdInput, setPayflowIdInput] = useState(stripSuffix(prefillId));
  const [lookupQuery, setLookupQuery] = useState(prefillId);
  const [recipientConfirmed, setRecipientConfirmed] = useState(false);

  // Amount & note
  const [rawAmount, setRawAmount] = useState('');
  const [message, setMessage] = useState('');

  // Post-transfer state
  const [successData, setSuccessData] = useState<{ receiverName: string; receiverPayflowId: string; amount: string } | null>(null);
  const [addedFavourite, setAddedFavourite] = useState(false);
  const [lastReceiverContactId, setLastReceiverContactId] = useState<string>('');
  const [transferError, setTransferError] = useState('');

  // Recipient lookup query
  const { data: recipient, isLoading: lookupLoading, isError: lookupError } = useQuery({
    queryKey: ['recipient', lookupQuery],
    queryFn: () => userService.lookupRecipient(lookupQuery),
    enabled: Boolean(lookupQuery) && lookupQuery.length >= 3,
    retry: false,
  });

  // Favourites (to check if already favourite)
  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn: userService.getFavourites,
    staleTime: 60_000,
  });

  // Recent contacts
  const { data: recentContacts = [] } = useQuery({
    queryKey: ['recent-contacts'],
    queryFn: userService.getRecentContacts,
    staleTime: 60_000,
  });

  // Auto-confirm recipient when prefilled from user profile page (already validated there)
  useEffect(() => {
    if (prefillId && recipient && !recipientConfirmed) {
      setRecipientConfirmed(true);
    }
  }, [prefillId, recipient, recipientConfirmed]);

  // Wallet balance
  const { data: wallet } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: walletService.getBalance,
    staleTime: 30_000,
  });

  const transferMutation = useMutation({
    mutationFn: transactionService.transfer,
    onSuccess: (result) => {
      // Invalidate all queries that need to reflect the new transfer.
      // Do this immediately in onSuccess so the profile page's queries are
      // already marked stale before we navigate back to it.
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['recent-contacts'] });

      // Invalidate the target user's profile + relationship caches so the
      // profile page refetches fresh data the moment it mounts.
      if (prefillId) {
        void queryClient.invalidateQueries({ queryKey: ['user-profile', prefillId] });
        void queryClient.invalidateQueries({ queryKey: ['user-relationship', prefillId] });
      }
      // Also cover the case where the recipient was typed manually (no prefillId)
      if (result.receiverPayflowId) {
        void queryClient.invalidateQueries({ queryKey: ['user-profile', result.receiverPayflowId] });
        void queryClient.invalidateQueries({ queryKey: ['user-relationship', result.receiverPayflowId] });
      }

      const formatted = '₹' + (parseFloat(rawAmount.replace(/,/g, '')) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setSuccessData({ receiverName: result.receiverName, receiverPayflowId: result.receiverPayflowId, amount: formatted });
      setLastReceiverContactId(result.receiverPayflowId);
      setAddedFavourite(false);
      setTransferError('');
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Transfer failed. Please try again.';
      setTransferError(message);
    },
  });

  const addFavouriteMutation = useMutation({
    // Backend now accepts both UUID and payflowId, so we pass the payflowId directly.
    mutationFn: (payflowId: string) => userService.addFavourite(payflowId),
    onSuccess: () => {
      setAddedFavourite(true);
      void queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  const numericAmount = parseFloat(rawAmount.replace(/,/g, '')) || 0;
  const words = amountInWords(rawAmount);
  const formattedAmount = numericAmount > 0
    ? '₹' + numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';

  const handleAmountChange = (value: string) => {
    setRawAmount(value.replace(/[^0-9.,]/g, ''));
  };

  const addQuickAmount = (amount: number) => {
    const current = parseFloat(rawAmount.replace(/,/g, '')) || 0;
    const next = current + amount;
    setRawAmount(next.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const buildFullId = (username: string) => {
    const u = username.trim();
    if (!u) return '';
    return u.includes('@') ? u : `${u}@payflow`;
  };

  const handleLookup = () => {
    const full = buildFullId(payflowIdInput);
    if (!full) return;
    setLookupQuery(full);
    setRecipientConfirmed(false);
  };

  const handleConfirmRecipient = () => {
    setRecipientConfirmed(true);
  };

  const handleSend = () => {
    if (!recipient || !recipientConfirmed) return;
    if (numericAmount <= 0) { setTransferError('Please enter a valid amount.'); return; }
    setTransferError('');
    transferMutation.mutate({
      receiverPayflowId: recipient.payflowId,
      amount: numericAmount,
      note: message || undefined,
    });
  };

  const handleDone = () => {
    // If we came from a user profile page, prefetch the now-stale profile data
    // then navigate so the profile page renders with fresh data immediately
    // (no skeleton flash, no stale totals).
    const returnId = prefillId || lastReceiverContactId;
    if (returnId) {
      // Fire background refetches for both profile queries. They were already
      // invalidated in onSuccess, so these calls hit the network right away.
      void queryClient.refetchQueries({ queryKey: ['user-relationship', returnId] });
      void queryClient.refetchQueries({ queryKey: ['user-profile', returnId] });
      void navigate(`/users/${encodeURIComponent(returnId)}`, { replace: true });
      return;
    }
    setSuccessData(null);
    setPayflowIdInput('');
    setLookupQuery('');
    setRecipientConfirmed(false);
    setRawAmount('');
    setMessage('');
    setLastReceiverContactId('');
  };

  const isAlreadyFavourite = favourites.some((f) => f.payflowId === lastReceiverContactId);
  const balanceDisplay = wallet?.balance
    ? '₹' + parseFloat(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Step 1 — Recipient */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Recipient</h3>
                <p className="text-xs text-text-secondary">Enter the PayFlow ID of the person you want to send money to</p>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Split input: user types only the username; @payflow is a fixed suffix */}
              <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-border bg-surface-subtle px-4 py-2.5 text-sm transition-all focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <input
                  type="text"
                  value={payflowIdInput}
                  onChange={(e) => {
                    // Prevent the user from typing the suffix manually
                    const raw = e.target.value.replace(/@payflow.*/i, '');
                    setPayflowIdInput(raw);
                    setRecipientConfirmed(false);
                    if (!raw.trim()) setLookupQuery('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLookup();
                  }}
                  placeholder="username"
                  className="min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none"
                />
                <span className="ml-0.5 shrink-0 select-none text-text-muted">@payflow</span>
              </div>
              <Button
                variant="secondary"
                onClick={handleLookup}
                disabled={lookupLoading || !payflowIdInput.trim()}
                className="rounded-xl px-4"
              >
                {lookupLoading ? 'Looking up…' : 'Look Up'}
              </Button>
            </div>

            {lookupQuery && lookupError && (
              <p className="mt-2 text-sm text-danger">No user found with PayFlow ID: {lookupQuery}</p>
            )}

            {recipient && !lookupError && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
                <Avatar name={recipient.displayName} size="md" className="bg-brand-100 text-brand-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{recipient.displayName}</p>
                  <p className="text-xs text-text-muted">{recipient.payflowId}</p>
                </div>
                {!recipientConfirmed ? (
                  <Button variant="primary" size="sm" className="rounded-xl px-3" onClick={handleConfirmRecipient}>
                    Confirm
                  </Button>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
            )}

            {/* Recent contacts shortcuts */}
            {recentContacts.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-text-muted uppercase tracking-wide">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {recentContacts.slice(0, 5).map((c) => (
                    <button
                      key={c.payflowId}
                      type="button"
                      onClick={() => {
                        setPayflowIdInput(stripSuffix(c.payflowId));
                        setLookupQuery(c.payflowId);
                        setRecipientConfirmed(false);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Avatar name={c.displayName} size="xs" className="bg-brand-100 text-brand-700 h-5 w-5 text-[0.55rem]" />
                      {c.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Step 2 — Amount */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Amount</h3>
                <p className="text-xs text-text-secondary">Enter the amount you want to send</p>
              </div>
            </div>

            <div className="relative flex items-center rounded-xl border border-border bg-surface-subtle px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <span className="mr-2 text-xl font-medium text-text-secondary">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={rawAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted"
              />
              {rawAmount && (
                <button type="button" onClick={() => setRawAmount('')} className="ml-2 text-text-muted transition-colors hover:text-text-secondary" aria-label="Clear amount">
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {words && <p className="mt-2 text-xs text-text-secondary">{words}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => addQuickAmount(amount)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  + ₹{amount.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Message */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Message <span className="font-normal text-text-muted">(Optional)</span>
                </h3>
                <p className="text-xs text-text-secondary">Add a note for the recipient</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 50))}
                placeholder="What's this payment for?"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <span className="absolute bottom-3 right-3 text-xs text-text-muted">{message.length} / 50</span>
            </div>
          </section>

          {transferError && (
            <p className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3 text-sm text-danger">{transferError}</p>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            className="h-14 rounded-2xl bg-brand-600 text-base font-semibold shadow-[0_8px_24px_rgba(109,40,217,0.28)] hover:bg-brand-700"
            onClick={handleSend}
            disabled={!recipientConfirmed || numericAmount <= 0 || transferMutation.isPending}
          >
            {transferMutation.isPending ? 'Sending…' : 'Send Money'}
          </Button>
        </div>

        {/* ── Right column — Payment Summary ─────────────────────────────── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h3 className="mb-4 text-base font-semibold text-text-primary">Payment Summary</h3>

            <p className="text-xs text-text-secondary">You are sending</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight text-text-primary">{formattedAmount}</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text-secondary">To</span>
                <span className="text-right text-sm font-medium text-text-primary">
                  {recipient ? recipient.displayName : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text-secondary">PayFlow ID</span>
                <span className="text-right text-sm font-medium text-text-primary">
                  {recipient ? recipient.payflowId : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-secondary">Wallet Balance</span>
                <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-text-primary">
                  <WalletIcon className="h-3.5 w-3.5 text-brand-600" />
                  {balanceDisplay}
                </span>
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Amount</span>
                <span className="text-sm font-medium text-text-primary">{formattedAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Convenience Fee</span>
                <span className="text-sm font-medium text-text-primary">₹0.00</span>
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Total Payable</span>
              <span className="text-base font-bold text-brand-700">{formattedAmount}</span>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <ShieldCheckIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-brand-700">Secure &amp; Encrypted</p>
                <p className="mt-0.5 text-xs text-brand-600/80 leading-relaxed">Your payment is protected with bank-level security and encryption.</p>
              </div>
            </div>
          </div>

          {/* Favourites shortcuts */}
          {favourites.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Favourite Contacts</h3>
              </div>
              <div className="space-y-1">
                {favourites.slice(0, 5).map((contact) => (
                  <button
                    key={contact.payflowId}
                    type="button"
                    onClick={() => {
                      setPayflowIdInput(contact.payflowId);
                      setLookupQuery(contact.payflowId);
                      setRecipientConfirmed(false);
                    }}
                    className={[
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-muted',
                      recipient?.payflowId === contact.payflowId ? 'bg-brand-50' : '',
                    ].join(' ')}
                  >
                    <Avatar name={contact.displayName} size="sm" className="bg-brand-100 text-brand-700" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-text-primary">{contact.displayName}</p>
                      <p className="truncate text-xs text-text-muted">{contact.payflowId}</p>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors group-hover:border-brand-300 group-hover:bg-brand-50 group-hover:text-brand-600">
                      <SendIcon className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal
          receiverName={successData.receiverName}
          receiverPayflowId={successData.receiverPayflowId}
          amount={successData.amount}
          onAddFavourite={() => addFavouriteMutation.mutate(lastReceiverContactId)}
          onDone={handleDone}
          isAddingFavourite={addFavouriteMutation.isPending}
          alreadyFavourite={addedFavourite || isAlreadyFavourite}
        />
      )}
    </div>
  );
}
