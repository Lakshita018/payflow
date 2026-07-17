import { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary truncate">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-muted truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export default PageHeader;
