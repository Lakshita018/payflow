import { type ReactNode } from 'react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: TrendDirection;
    label?: string;
  };
  description?: string;
  className?: string;
}

const trendColorClasses: Record<TrendDirection, string> = {
  up:      'text-success',
  down:    'text-danger',
  neutral: 'text-text-muted',
};

const TrendArrow = ({ direction }: { direction: TrendDirection }) => {
  if (direction === 'up')
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    );
  if (direction === 'down')
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  return <span className="text-xs">—</span>;
};

function StatCard({ title, value, icon, trend, description, className = '' }: StatCardProps) {
  return (
    <div className={['card flex flex-col gap-3', className].filter(Boolean).join(' ')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            {icon}
          </span>
        )}
      </div>

      <p className="text-2xl font-semibold text-text-primary leading-none">{value}</p>

      <div className="flex flex-wrap items-center gap-2">
        {trend && (
          <span
            className={[
              'inline-flex items-center gap-0.5 text-xs font-medium',
              trendColorClasses[trend.direction],
            ].join(' ')}
          >
            <TrendArrow direction={trend.direction} />
            {trend.value}
          </span>
        )}
        {description && (
          <span className="text-xs text-text-muted">{description}</span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
