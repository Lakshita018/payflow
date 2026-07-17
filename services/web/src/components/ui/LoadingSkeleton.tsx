export interface LoadingSkeletonProps {
  className?: string;
}

// ── Base pulse block ───────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={['animate-pulse rounded-lg bg-surface-muted', className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

// ── Card Skeleton ──────────────────────────────────────────────────────────

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

// ── List Skeleton ──────────────────────────────────────────────────────────

export function ListSkeleton({ rows = 4, className = '' }: LoadingSkeletonProps & { rows?: number }) {
  return (
    <div className={['flex flex-col divide-y divide-border', className].filter(Boolean).join(' ')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
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

// ── Table Row Skeleton ─────────────────────────────────────────────────────

export function TableRowSkeleton({ rows = 5, cols = 4, className = '' }: LoadingSkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={['overflow-hidden rounded-xl border border-border', className].filter(Boolean).join(' ')}>
      {/* Header */}
      <div className="grid gap-4 bg-surface-muted px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-3/4" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 border-t border-border bg-surface px-4 py-3"
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

// ── Default export — all three as named exports are sufficient; ────────────
//    exporting a namespace object for convenience
const LoadingSkeleton = { CardSkeleton, ListSkeleton, TableRowSkeleton };
export default LoadingSkeleton;
