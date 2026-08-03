// ---------------------------------------------------------------------------
// OutgoingRequestsPage — shows payment requests the current user created,
// with status badges and the ability to cancel pending requests.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { paymentRequestService } from '@/services';
import { useToast } from '@/providers/ToastProvider';
import type { PaymentRequestItem } from '@/types';
import { ROUTES } from '@/routes/paths';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(amount: string): string {
  const n = parseFloat(amount);
  return isNaN(n) ? amount : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function statusBadge(status: string) {
  switch (status) {
    case 'PENDING':   return <Badge variant="warning">Pending</Badge>;
    case 'ACCEPTED':  return <Badge variant="success">Accepted</Badge>;
    case 'REJECTED':  return <Badge variant="danger">Declined</Badge>;
    case 'CANCELLED': return <Badge variant="brand">Cancelled</Badge>;
    case 'EXPIRED':   return <Badge variant="brand">Expired</Badge>;
    default:          return <Badge>{status}</Badge>;
  }
}

// ── Confirm Cancel Dialog ─────────────────────────────────────────────────────

interface ConfirmCancelDialogProps {
  request: PaymentRequestItem;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

function ConfirmCancelDialog({ request, onConfirm, onClose, isPending }: ConfirmCancelDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-sm p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6 shadow-modal"
      >
        <h2 id="cancel-dialog-title" className="text-base font-semibold text-text-primary">Cancel Request?</h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Cancel your request of{' '}
          <span className="font-semibold text-text-primary">{fmtAmount(request.amount)}</span>{' '}
          from{' '}
          <span className="font-semibold text-text-primary">{request.receiverDisplayName}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={onClose} disabled={isPending}>
            Keep
          </Button>
          <Button variant="danger" className="flex-1 rounded-xl" loading={isPending} onClick={onConfirm}>
            Cancel Request
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────

interface OutgoingCardProps {
  request: PaymentRequestItem;
  onCancel: (req: PaymentRequestItem) => void;
  isCancelling: boolean;
}

function OutgoingCard({ request, onCancel, isCancelling }: OutgoingCardProps) {
  const isPending = request.status === 'PENDING';
  const name = request.receiverDisplayName;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-border bg-surface p-5 shadow-card-sm transition-shadow hover:shadow-card-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} size="md" className="shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary">{name}</p>
              <p className="truncate text-xs text-text-muted">{request.receiverEmail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {statusBadge(request.status)}
              <span className="text-xs text-text-muted">{fmtTime(request.createdAt)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary tabular-nums">
              {fmtAmount(request.amount)}
            </span>
            <span className="text-sm text-text-muted">requested</span>
          </div>

          {request.note && (
            <p className="mt-2 rounded-xl bg-surface-subtle border border-border px-3 py-2 text-sm text-text-secondary">
              &ldquo;{request.note}&rdquo;
            </p>
          )}

          {/* Status context message */}
          {request.status === 'ACCEPTED' && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="m5 13 4 4L19 7" />
              </svg>
              {name} paid your request
            </p>
          )}
          {request.status === 'REJECTED' && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
              </svg>
              {name} declined your request
            </p>
          )}

          {/* Cancel button — only for pending */}
          {isPending && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl border border-border text-text-muted hover:text-danger hover:border-danger/30"
                loading={isCancelling}
                onClick={() => onCancel(request)}
              >
                Cancel Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyOutgoing() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-text-muted">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-text-primary">No outgoing requests</p>
      <p className="mt-1 text-sm text-text-muted">Start by requesting money from someone.</p>
      <Button
        variant="primary"
        size="sm"
        className="mt-5 rounded-xl"
        onClick={() => navigate(ROUTES.REQUEST_MONEY)}
      >
        Request Money
      </Button>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OutgoingRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cancelTarget, setCancelTarget] = useState<PaymentRequestItem | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['payment-requests-outgoing'],
    queryFn: paymentRequestService.getOutgoing,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => paymentRequestService.cancelRequest(id),
    onMutate: (id) => setCancellingId(id),
    onSuccess: () => {
      toast.info('Request cancelled.');
      void queryClient.invalidateQueries({ queryKey: ['payment-requests-outgoing'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to cancel request.';
      toast.error(msg);
    },
    onSettled: () => {
      setCancellingId(null);
      setCancelTarget(null);
    },
  });

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const otherRequests   = requests.filter((r) => r.status !== 'PENDING');

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Back"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-text-primary">My Requests</h1>
              <p className="text-xs text-text-muted">
                {pendingRequests.length > 0
                  ? `${pendingRequests.length} pending`
                  : requests.length > 0 ? `${requests.length} total` : 'No requests yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(ROUTES.INCOMING_REQUESTS)}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              ← Incoming
            </button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl"
              onClick={() => navigate(ROUTES.REQUEST_MONEY)}
            >
              + New
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading && <ListSkeleton rows={3} />}

        {isError && (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            Failed to load requests. Please refresh.
          </div>
        )}

        {!isLoading && !isError && requests.length === 0 && <EmptyOutgoing />}

        {!isLoading && !isError && requests.length > 0 && (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Pending ({pendingRequests.length})
                </p>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {pendingRequests.map((req) => (
                      <OutgoingCard
                        key={req.id}
                        request={req}
                        onCancel={(r) => setCancelTarget(r)}
                        isCancelling={cancellingId === req.id && cancelMutation.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {otherRequests.length > 0 && (
              <section>
                <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  History
                </p>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {otherRequests.map((req) => (
                      <OutgoingCard
                        key={req.id}
                        request={req}
                        onCancel={(r) => setCancelTarget(r)}
                        isCancelling={cancellingId === req.id && cancelMutation.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Cancel confirm dialog */}
      <AnimatePresence>
        {cancelTarget !== null && (
          <ConfirmCancelDialog
            request={cancelTarget}
            onConfirm={() => cancelMutation.mutate(cancelTarget.id)}
            onClose={() => setCancelTarget(null)}
            isPending={cancelMutation.isPending}
          />
        )}
      </AnimatePresence>
    </>
  );
}
