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
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-text-muted">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-sm text-text-muted max-w-xs">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
