// ---------------------------------------------------------------------------
// PageContainer — consistent max-width wrapper for page content.
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';

interface PageContainerProps {
  children:  ReactNode;
  title?:    string;
  subtitle?: string;
}

export function PageContainer({ children, title, subtitle }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {(title ?? subtitle) && (
        <div>
          {title    && <h2 className="text-xl font-semibold text-text-primary">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
