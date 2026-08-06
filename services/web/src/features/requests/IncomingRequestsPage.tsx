// ---------------------------------------------------------------------------
// IncomingRequestsPage — shows payment requests waiting for the current user
// to approve or decline. Each card has Avatar + name + amount + note + time
// and Approve/Decline buttons.
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
    case 'PENDING':  return <Badge variant="warning">Pending</Badge>;
    case 'ACCEPTED': return <Badge variant="success">Accepted</Badge>;
    case 'REJECTED': return <Badge variant="danger">Declined</Badge>;
    case 'CANCELLED': return <Badge variant="brand">Cancelled</Badge>;
    case 'EXPIRED':  return <Badge variant="brand">Expired</Badge>;
    default:         return <Badge>{status}</Badge>;
  }
}

// ── Request Card ──────────────────────────────────────────────────────────────

interface RequestCardProps {
  request: PaymentRequestItem;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  isApproving: boolean;
  isDeclining: boolean;
}

function RequestCard({ request, onApprove, onDecline, isApproving, isDeclining }: RequestCardProps) {
  const isPending = request.status === 'PENDING';
  const name = request.requesterDisplayName;

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
              <p className="truncate text-xs text-text-muted">{request.requesterEmail}</p>
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

          {isPending && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 rounded-xl"
                loading={isApproving}
                disabled={isDeclining}
                onClick={() => onApprove(request.id)}
              >
                {isApproving ? 'Approving…' : 'Approve'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1 rounded-xl"
                loading={isDeclining}
                disabled={isApproving}
                onClick={() => onDecline(request.id)}
              >
                {isDeclining ? 'Declining…' : 'Decline'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyIncoming() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7 text-text-muted">
          <path d="M22 12h-6l-2 3H10l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-text-primary">No incoming requests</p>
      <p className="mt-1 text-sm text-text-muted">You have no pending payment requests right now.</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-5 rounded-xl"
        onClick={() => navigate(ROUTES.DASHBOARD)}
      >
        Back to Dashboard
      </Button>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function IncomingRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Track which request ID is currently being acted on
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ['payment-requests-incoming'],
    queryFn: paymentRequestService.getIncoming,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentRequestService.acceptRequest(id),
    onMutate: (id) => setApprovingId(id),
    onSuccess: () => {
      toast.success('Payment approved successfully!');
      void queryClient.invalidateQueries({ queryKey: ['payment-requests-incoming'] });
      void queryClient.invalidateQueries({ queryKey: ['payment-requests-outgoing'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to approve request.';
      toast.error(msg);
    },
    onSettled: () => setApprovingId(null),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => paymentRequestService.rejectRequest(id),
    onMutate: (id) => setDecliningId(id),
    onSuccess: () => {
      toast.info('Request declined.');
      void queryClient.invalidateQueries({ queryKey: ['payment-requests-incoming'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Failed to decline request.';
      toast.error(msg);
    },
    onSettled: () => setDecliningId(null),
  });

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const otherRequests  = requests.filter((r) => r.status !== 'PENDING');

  return (
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
            <h1 className="text-xl font-semibold text-text-primary">Incoming Requests</h1>
            <p className="text-xs text-text-muted">
              {pendingRequests.length > 0
                ? `${pendingRequests.length} pending`
                : 'No pending requests'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.OUTGOING_REQUESTS)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          My Requests →
        </button>
      </div>

      {/* Content */}
      {isLoading && <ListSkeleton rows={3} />}

      {isError && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          Failed to load requests. Please refresh.
        </div>
      )}

      {!isLoading && !isError && requests.length === 0 && <EmptyIncoming />}

      {!isLoading && !isError && requests.length > 0 && (
        <div className="space-y-4">
          {/* Pending section */}
          {pendingRequests.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Awaiting Action ({pendingRequests.length})
              </p>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {pendingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onDecline={(id) => declineMutation.mutate(id)}
                      isApproving={approvingId === req.id && approveMutation.isPending}
                      isDeclining={decliningId === req.id && declineMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* History section */}
          {otherRequests.length > 0 && (
            <section>
              <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
                History
              </p>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {otherRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onApprove={(id) => approveMutation.mutate(id)}
                      onDecline={(id) => declineMutation.mutate(id)}
                      isApproving={approvingId === req.id && approveMutation.isPending}
                      isDeclining={decliningId === req.id && declineMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

