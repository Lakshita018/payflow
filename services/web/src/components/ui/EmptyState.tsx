import { type ReactNode } from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// Default illustrated icon when none is provided
function DefaultIcon() {
  return (
    <svg className="h-8 w-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9 9h6M9 13h4" />
    </svg>
  );
}

function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 py-12 px-6 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-muted text-text-muted">
        {icon ?? <DefaultIcon />}
      </span>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={action.onClick}
          className="mt-1 rounded-xl"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
