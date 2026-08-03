// ---------------------------------------------------------------------------
// RequestMoneyPage — allows a user to request money from another PayFlow user.
// Mirrors the SendMoneyPage UX: search → select → amount → note → review → send.
// ---------------------------------------------------------------------------
import { useState, useEffect, type SVGProps } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { paymentRequestService, userService } from '@/services';
import { useToast } from '@/providers/ToastProvider';
import { useDebounce } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import type { PublicProfile } from '@/types';

// ── Icon helpers ──────────────────────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement>;

function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="6.5" /><path d="M16.2 16.2 20 20" />
    </svg>
  );
}

function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function XCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

// ── Amount in words ───────────────────────────────────────────────────────────

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n] ?? '';
  if (n < 100) return (tens[Math.floor(n / 10)] ?? '') + (n % 10 ? ' ' + (ones[n % 10] ?? '') : '');
  if (n < 1000) return (ones[Math.floor(n / 100)] ?? '') + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
  return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
}

function amountInWords(raw: string): string {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (!n || isNaN(n)) return '';
  const int = Math.floor(n);
  const dec = Math.round((n - int) * 100);
  const base = `Rupees ${numToWords(int)}`;
  return dec > 0 ? `${base} and ${numToWords(dec)} Paise Only` : `${base} Only`;
}

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

// ── Step definitions ──────────────────────────────────────────────────────────

type Step = 'search' | 'amount' | 'review';

// ── Success modal ─────────────────────────────────────────────────────────────

interface SuccessModalProps {
  receiverName: string;
  amount: string;
  onViewRequests: () => void;
  onDone: () => void;
}

function SuccessModal({ receiverName, amount, onViewRequests, onDone }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-md rounded-[1.5rem] border border-border bg-surface p-6 shadow-[0_24px_60px_rgba(15,23,42,0.18)] text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
          <CheckCircleIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary">Request Sent!</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You requested{' '}
          <span className="font-semibold text-text-primary">{amount}</span>{' '}
          from{' '}
          <span className="font-semibold text-text-primary">{receiverName}</span>.
        </p>
        <p className="mt-1 text-xs text-text-muted">They will be notified and can approve or decline.</p>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-2xl" onClick={onViewRequests}>
            View Requests
          </Button>
          <Button variant="primary" className="flex-1 rounded-2xl" onClick={onDone}>
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RequestMoneyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Read prefilled PayFlow ID from navigation state
  const location = useLocation();
  const prefillId: string = (location.state as { prefillPayflowId?: string } | null)?.prefillPayflowId ?? '';

  const [step, setStep] = useState<Step>(prefillId ? 'amount' : 'search');
  const [searchQuery, setSearchQuery] = useState(prefillId);
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [rawAmount, setRawAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 350);

  // Search query
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () => userService.search(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2 && step === 'search',
    staleTime: 15_000,
  });

  // If prefillId set, look up the user immediately
  useEffect(() => {
    if (!prefillId) return;
    void userService.search(prefillId).then((results) => {
      const match = results.find(
        (u) => u.payflowId.replace(/@payflow$/i, '') === prefillId.replace(/@payflow$/i, ''),
      );
      if (match) setSelectedUser(match);
    });
  }, [prefillId]);

  // Create request mutation
  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error('No user selected');
      return paymentRequestService.createRequest({
        receiverPayflowId: selectedUser.payflowId,
        amount: parseFloat(rawAmount),
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payment-requests-outgoing'] });
      setShowSuccess(true);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to send request. Please try again.';
      setError(msg);
      toast.error(msg);
    },
  });

  // ── Step handlers ──────────────────────────────────────────────────────────

  function handleSelectUser(user: PublicProfile) {
    setSelectedUser(user);
    setStep('amount');
    setSearchQuery(user.payflowId);
  }

  function handleAmountNext() {
    setError('');
    const amount = parseFloat(rawAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (amount > 100000) {
      setError('Maximum request amount is ₹1,00,000.');
      return;
    }
    setStep('review');
  }

  function handleSubmit() {
    if (mutation.isPending) return;
    mutation.mutate();
  }

  const displayName = selectedUser?.displayName ?? selectedUser?.payflowId?.split('@')[0] ?? '';
  const amtNum = parseFloat(rawAmount.replace(/,/g, ''));
  const amtFormatted = isNaN(amtNum) ? '' : `₹${amtNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stepConfig = { search: 1, amount: 2, review: 3 };

  return (
    <>
      <div className="mx-auto w-full max-w-xl px-4 py-6 sm:py-8">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (step === 'amount') setStep('search');
              else if (step === 'review') setStep('amount');
              else navigate(-1);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Request Money</h1>
            <p className="text-xs text-text-muted">Step {stepConfig[step]} of 3</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex gap-1.5">
          {(['search', 'amount', 'review'] as Step[]).map((s) => (
            <div
              key={s}
              className={[
                'h-1 flex-1 rounded-full transition-all duration-300',
                stepConfig[s] <= stepConfig[step] ? 'bg-brand-600' : 'bg-border',
              ].join(' ')}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Search ─────────────────────────────────────────────── */}
          {step === 'search' && (
            <motion.div
              key="step-search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6 shadow-card-sm">
                <h2 className="mb-1 text-base font-semibold text-text-primary">Who do you want to request from?</h2>
                <p className="mb-4 text-sm text-text-muted">Search by name, email, or PayFlow ID.</p>

                {/* Search input */}
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                    <SearchIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users…"
                    autoFocus
                    className="input pl-10"
                  />
                  {isSearching && (
                    <span className="absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 animate-spin text-text-muted" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface"
                    >
                      {searchResults.map((user, idx) => {
                        const name = user.displayName ?? user.payflowId.split('@')[0] ?? user.payflowId;
                        return (
                          <motion.button
                            key={user.payflowId}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            whileHover={{ backgroundColor: 'var(--surface-muted)' }}
                            whileTap={{ scale: 0.99 }}
                            className={[
                              'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                              idx < searchResults.length - 1 ? 'border-b border-border' : '',
                            ].join(' ')}
                          >
                            <Avatar name={name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
                              <p className="truncate text-xs text-text-muted">{user.email}</p>
                            </div>
                            <ArrowRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                  {debouncedQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-3 text-center text-sm text-text-muted py-4"
                    >
                      No users found for &ldquo;{debouncedQuery}&rdquo;
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Amount ─────────────────────────────────────────────── */}
          {step === 'amount' && selectedUser && (
            <motion.div
              key="step-amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Selected user */}
              <div className="rounded-3xl border border-border bg-surface p-5 shadow-card-sm">
                <p className="mb-3 text-sm font-medium text-text-muted">Requesting from</p>
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text-primary">{displayName}</p>
                    <p className="truncate text-xs text-text-muted">{selectedUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedUser(null); setStep('search'); }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                    aria-label="Change recipient"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div className="rounded-3xl border border-border bg-surface p-5 shadow-card-sm">
                <p className="mb-3 text-sm font-medium text-text-secondary">Enter amount</p>
                <div className="flex items-center rounded-2xl border border-border bg-surface-subtle px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <span className="mr-2 text-2xl font-semibold text-text-secondary">₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rawAmount}
                    onChange={(e) => { setError(''); setRawAmount(e.target.value.replace(/[^0-9.]/g, '')); }}
                    placeholder="0.00"
                    autoFocus
                    className="flex-1 bg-transparent text-3xl font-semibold text-text-primary outline-none placeholder:text-text-muted tabular-nums"
                  />
                </div>
                {rawAmount && (
                  <p className="mt-2 text-xs text-text-muted italic">{amountInWords(rawAmount)}</p>
                )}

                {/* Quick amounts */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setError(''); setRawAmount(String(amt)); }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                {/* Note */}
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-text-secondary">Note <span className="text-xs text-text-muted">(optional)</span></p>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's this for?"
                    maxLength={200}
                    className="input w-full"
                  />
                </div>

                {error && (
                  <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
                )}
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="rounded-2xl"
                onClick={handleAmountNext}
                disabled={!rawAmount}
              >
                Review Request
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: Review ─────────────────────────────────────────────── */}
          {step === 'review' && selectedUser && (
            <motion.div
              key="step-review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-card-sm text-center">
                {/* Amount display */}
                <div className="mb-6">
                  <p className="text-sm text-text-muted mb-1">You are requesting</p>
                  <p className="text-4xl font-bold text-text-primary tabular-nums">{amtFormatted}</p>
                  {amountInWords(rawAmount) && (
                    <p className="mt-1 text-xs text-text-muted italic">{amountInWords(rawAmount)}</p>
                  )}
                </div>

                {/* From */}
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-surface-subtle px-5 py-4">
                  <Avatar name={displayName} size="md" />
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-text-primary truncate">{displayName}</p>
                    <p className="text-xs text-text-muted truncate">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Note */}
                {note && (
                  <div className="mt-4 rounded-2xl border border-border bg-surface-subtle px-4 py-3 text-left">
                    <p className="text-xs text-text-muted mb-0.5">Note</p>
                    <p className="text-sm text-text-primary">{note}</p>
                  </div>
                )}

                {/* Trust signal */}
                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-success">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                  </svg>
                  Secured by PayFlow
                </div>

                {error && (
                  <p className="mt-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => setStep('amount')}
                  disabled={mutation.isPending}
                >
                  Edit
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 rounded-2xl"
                  loading={mutation.isPending}
                  onClick={handleSubmit}
                >
                  {mutation.isPending ? 'Sending…' : 'Send Request'}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Success modal */}
      {showSuccess && (
        <SuccessModal
          receiverName={displayName}
          amount={amtFormatted}
          onViewRequests={() => navigate('/requests/outgoing')}
          onDone={() => navigate('/dashboard')}
        />
      )}
    </>
  );
}
