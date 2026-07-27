export interface LoadingSkeletonProps {
  className?: string;
}

// ── Base skeleton block ─────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={['skeleton rounded-lg', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

// ── Card Skeleton ───────────────────────────────────────────────────────────

export function CardSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={['card flex flex-col gap-4', className].filter(Boolean).join(' ')}>
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-8 w-8 rounded-xl" />
      </div>
      <SkeletonBlock className="h-7 w-24" />
      <SkeletonBlock className="h-3 w-40" />
    </div>
  );
}

// ── List Skeleton ───────────────────────────────────────────────────────────

export function ListSkeleton({ rows = 4, className = '' }: LoadingSkeletonProps & { rows?: number }) {
  return (
    <div className={['flex flex-col divide-y divide-border', className].filter(Boolean).join(' ')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBlock className="h-3.5 w-1/3" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
          <SkeletonBlock className="h-3.5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Table Row Skeleton ──────────────────────────────────────────────────────

export function TableRowSkeleton({
  rows = 5,
  cols = 4,
  className = '',
}: LoadingSkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={['overflow-hidden rounded-2xl border border-border', className].filter(Boolean).join(' ')}>
      {/* Header */}
      <div
        className="grid gap-4 bg-surface-muted px-5 py-3.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 border-t border-border bg-surface px-5 py-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className="h-3.5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Wallet Hero Skeleton ────────────────────────────────────────────────────

export function WalletHeroSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={['rounded-2xl overflow-hidden p-6 sm:p-8 bg-surface border border-border', className].filter(Boolean).join(' ')}>
      <SkeletonBlock className="h-3 w-32 mb-4" />
      <SkeletonBlock className="h-10 w-48 mb-8" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-12 w-32 rounded-2xl" />
        <SkeletonBlock className="h-12 w-32 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Dashboard skeleton ──────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <WalletHeroSkeleton className="xl:col-span-3" />
        <CardSkeleton className="xl:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <SkeletonBlock className="h-5 w-48 mb-4" />
          <ListSkeleton rows={4} />
        </div>
        <div className="card">
          <SkeletonBlock className="h-5 w-40 mb-4" />
          <ListSkeleton rows={4} />
        </div>
      </div>
    </div>
  );
}

// ── Default export namespace ────────────────────────────────────────────────
const LoadingSkeleton = {
  CardSkeleton,
  ListSkeleton,
  TableRowSkeleton,
  WalletHeroSkeleton,
  DashboardSkeleton,
};
export default LoadingSkeleton;
