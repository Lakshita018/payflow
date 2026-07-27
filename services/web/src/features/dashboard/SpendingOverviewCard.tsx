import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { transactionService } from '@/services';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRupees(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatINR(val: number): string {
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Minimal SVG donut ─────────────────────────────────────────────────────────

interface Bucket { label: string; amount: number; color: string }

function DonutChart({ buckets, total }: { buckets: Bucket[]; total: number }) {
  const R = 68;
  const cx = 90;
  const cy = 90;
  const strokeW = 20;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  const slices = buckets.map((b) => {
    const pct = total > 0 ? b.amount / total : 0;
    const dashLen = pct * circumference;
    const dashOffset = circumference - offset;
    offset += dashLen;
    return { ...b, dashLen, dashOffset };
  });

  return (
    <svg viewBox="0 0 180 180" className="h-full w-full" aria-hidden="true">
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor"
        strokeWidth={strokeW} className="text-border opacity-40" />
      {total === 0 ? null : slices.map((s) => (
        <circle
          key={s.label}
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={s.color}
          strokeWidth={strokeW}
          strokeDasharray={`${s.dashLen} ${circumference - s.dashLen}`}
          strokeDashoffset={s.dashOffset}
          strokeLinecap="butt"
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      {/* Centre label */}
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-text-primary"
        fontSize="18" fontWeight="700" fontFamily="inherit">
        {total > 0 ? formatINR(total) : '—'}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="fill-text-muted"
        fontSize="10" fontFamily="inherit">
        Total activity
      </text>
    </svg>
  );
}

// ── SpendingOverviewCard ──────────────────────────────────────────────────────

export function SpendingOverviewCard() {
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: transactionService.getDashboard,
    staleTime: 30_000,
  });

  const totalSent     = parseRupees(dashboard?.totalSent);
  const totalReceived = parseRupees(dashboard?.totalReceived);

  // Derive "Added" from ADD_MONEY CREDIT transactions in the recent list.
  // This is the best we can do with the current API — it covers what's in
  // recentTransactions; the remainder of received is peer transfers.
  const addedFromRecent = (dashboard?.recentTransactions ?? [])
    .filter((t) => t.type === 'ADD_MONEY' && t.direction === 'CREDIT')
    .reduce((sum, t) => sum + parseRupees(t.amount), 0);

  // Peer-received = totalReceived minus what we know was ADD_MONEY credits.
  // Clamp to 0 in case recentTransactions is a subset of all time data.
  const peerReceived = Math.max(0, totalReceived - addedFromRecent);

  const buckets: Bucket[] = [
    { label: 'Sent',     amount: totalSent,     color: '#7c3aed' },
    { label: 'Received', amount: peerReceived,   color: '#10b981' },
    { label: 'Added',    amount: addedFromRecent, color: '#3b82f6' },
  ].filter((b) => b.amount > 0);

  const total = totalSent + totalReceived;

  return (
    <Card variant="elevated" className="h-full p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-text-primary">Activity Overview</p>
        <span className="rounded-lg border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
          All time
        </span>
      </div>

      {/* Body */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Donut */}
        <div className="mx-auto h-44 w-44 shrink-0 sm:mx-0">
          <DonutChart buckets={buckets} total={total} />
        </div>

        {/* Legend */}
        {buckets.length === 0 ? (
          <p className="flex-1 text-sm text-text-muted">No transactions yet.</p>
        ) : (
          <motion.ul
            className="flex-1 space-y-2.5"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          >
            {buckets.map((b) => {
              const pct = total > 0 ? Math.round((b.amount / total) * 100) : 0;
              return (
                <motion.li
                  key={b.label}
                  variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0, transition: { duration: 0.22 } } }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
                    <span className="truncate text-xs text-text-secondary">{b.label}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs font-semibold text-text-primary tabular-nums">
                    {formatINR(b.amount)}
                    <span className="ml-1.5 text-text-muted font-normal">{pct}%</span>
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </div>
    </Card>
  );
}
