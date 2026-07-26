// ---------------------------------------------------------------------------
// UserProfilePage — /users/:payflowId
//
// Shows the public profile of a PayFlow user relative to the logged-in user:
//   • Avatar, display name, PayFlow ID, email
//   • Favourite status (toggle button)
//   • Relationship stats: total sent, received, tx count, last interaction
//   • Recent transactions between the two users only
//   • Send Money button (navigates to /send-money with recipient prefilled)
// ---------------------------------------------------------------------------
import { type SVGProps } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { CardSkeleton, ListSkeleton } from '@/components/ui/LoadingSkeleton';
import { ROUTES } from '@/routes/paths';
import { userService } from '@/services';
import type { RelationshipTransaction } from '@/types';

// ── Icons ──────────────────────────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement>;

function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

function ArrowLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ArrowUpIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(amount: string): string {
  const n = parseFloat(amount);
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday, ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return formatDate(dateStr);
}

// ── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-text-secondary">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

// ── Transaction row ────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: RelationshipTransaction }) {
  const isDebit = tx.direction === 'DEBIT';
  const amountText = (isDebit ? '− ' : '+ ') + formatAmount(tx.amount);

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-muted/60">
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          isDebit ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600',
        ].join(' ')}
      >
        {isDebit ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{isDebit ? 'You sent' : 'You received'}</p>
        <p className="truncate text-xs text-text-muted">{tx.note ?? 'Transfer'}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={['text-sm font-semibold', isDebit ? 'text-danger' : 'text-success'].join(' ')}>
          {amountText}
        </p>
        <p className="text-xs text-text-muted">{formatDate(tx.createdAt)}</p>
      </div>

      <Badge variant={isDebit ? 'danger' : 'success'} className="hidden shrink-0 px-2.5 py-1 sm:block">
        {isDebit ? 'Sent' : 'Received'}
      </Badge>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function UserProfilePage() {
  const { payflowId } = useParams<{ payflowId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Resolve any URL-encoding artefacts
  const decodedPayflowId = payflowId ? decodeURIComponent(payflowId) : '';

  // ── Data fetching ──────────────────────────────────────────────────────────
  // refetchOnMount: 'always' ensures we hit the network every time this page
  // mounts (including when returning from Send Money), regardless of cache age.
  // staleTime: 0 (default) + refetchOnMount: 'always' = always fresh on mount.
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery({
    queryKey: ['user-profile', decodedPayflowId],
    queryFn: () => userService.getUserProfile(decodedPayflowId),
    enabled: Boolean(decodedPayflowId),
    retry: false,
    refetchOnMount: 'always',
  });

  const {
    data: relationship,
    isLoading: relLoading,
    isFetching: relFetching,
  } = useQuery({
    queryKey: ['user-relationship', decodedPayflowId],
    queryFn: () => userService.getRelationship(decodedPayflowId),
    enabled: Boolean(decodedPayflowId),
    retry: false,
    refetchOnMount: 'always',
  });

  // ── Favourite mutations ────────────────────────────────────────────────────
  const addFavMutation = useMutation({
    mutationFn: () => userService.addFavourite(decodedPayflowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-profile', decodedPayflowId] });
      void queryClient.invalidateQueries({ queryKey: ['user-relationship', decodedPayflowId] });
      void queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  const removeFavMutation = useMutation({
    mutationFn: () => userService.removeFavourite(decodedPayflowId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-profile', decodedPayflowId] });
      void queryClient.invalidateQueries({ queryKey: ['user-relationship', decodedPayflowId] });
      void queryClient.invalidateQueries({ queryKey: ['favourites'] });
    },
  });

  const isFavourite = profile?.isFavourite ?? relationship?.isFavourite ?? false;
  const isFavMutating = addFavMutation.isPending || removeFavMutation.isPending;

  const handleToggleFavourite = () => {
    if (isFavMutating) return;
    if (isFavourite) {
      removeFavMutation.mutate();
    } else {
      addFavMutation.mutate();
    }
  };

  const handleSendMoney = () => {
    void navigate(ROUTES.SEND_MONEY, { state: { prefillPayflowId: decodedPayflowId } });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <CardSkeleton className="h-48 rounded-2xl" />
        <CardSkeleton className="h-32 rounded-2xl" />
        <CardSkeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  // ── Not found / error ──────────────────────────────────────────────────────
  if (profileError || !profile) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          title="User not found"
          description={`No PayFlow user with the ID "${decodedPayflowId}" could be found.`}
          action={{ label: 'Back to Dashboard', onClick: () => navigate(ROUTES.DASHBOARD) }}
        />
      </div>
    );
  }

  const hasTransactions = (relationship?.transactionCount ?? 0) > 0;
  const relLoaded = !relLoading && relationship !== undefined;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      {/* ── Profile card ──────────────────────────────────────────────── */}
      <Card variant="elevated" className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          <Avatar
            name={profile.displayName}
            size="xl"
            className="bg-brand-100 text-brand-700 shadow-sm"
          />

          {/* Info */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-text-primary">{profile.displayName}</h1>
            <p className="mt-0.5 text-sm font-medium text-brand-600">{profile.payflowId}</p>
            <p className="mt-1 text-sm text-text-muted">{profile.email}</p>

            {isFavourite && (
              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <StarIcon filled className="h-3.5 w-3.5" />
                Favourite contact
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button
              variant="primary"
              onClick={handleSendMoney}
              leftIcon={<SendIcon className="h-4 w-4" />}
              className="rounded-2xl px-5"
            >
              Send Money
            </Button>

            <Button
              variant={isFavourite ? 'secondary' : 'ghost'}
              onClick={handleToggleFavourite}
              disabled={isFavMutating}
              loading={isFavMutating}
              leftIcon={<StarIcon filled={isFavourite} className="h-4 w-4" />}
              className="rounded-2xl px-5"
            >
              {isFavourite ? 'Remove Favourite' : 'Add Favourite'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Relationship stats ─────────────────────────────────────────── */}
      {relLoaded && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="You Sent"
            value={formatAmount(relationship.totalSent)}
            icon={<ArrowUpIcon className="h-4 w-4 text-rose-500" />}
          />
          <StatTile
            label="You Received"
            value={formatAmount(relationship.totalReceived)}
            icon={<ArrowDownIcon className="h-4 w-4 text-emerald-500" />}
          />
          <StatTile
            label="Transactions"
            value={String(relationship.transactionCount)}
            icon={<SendIcon className="h-4 w-4 text-brand-500" />}
          />
          <StatTile
            label="Last Interaction"
            value={formatRelativeDate(relationship.lastInteractionAt)}
            icon={<ClockIcon className="h-4 w-4 text-text-muted" />}
          />
        </div>
      )}

      {/* ── Recent transactions ────────────────────────────────────────── */}
      <Card variant="elevated" className="overflow-hidden p-0">
        {/* Thin refresh bar — visible only while a background refetch is in
            progress. Does not hide existing data, so no flicker. */}
        {relFetching && !relLoading && (
          <div className="h-0.5 w-full animate-pulse bg-brand-400" />
        )}

        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-base font-semibold text-text-primary">Transaction History</p>
          {hasTransactions && (
            <p className="text-xs text-text-muted">
              Showing {relationship?.recentTransactions.length ?? 0} most recent
            </p>
          )}
        </div>

        {relLoading && (
          <div className="px-4 pb-4">
            <ListSkeleton rows={3} />
          </div>
        )}

        {relLoaded && !hasTransactions && (
          <div className="px-6 pb-8 pt-2">
            <EmptyState
              title="No transactions yet"
              description="Send money to start your transaction history."
              action={{ label: 'Send Money', onClick: handleSendMoney }}
            />
          </div>
        )}

        {relLoaded && hasTransactions && (
          <div className="divide-y divide-border">
            {relationship.recentTransactions.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
