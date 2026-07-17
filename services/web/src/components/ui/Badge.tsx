import { type HTMLAttributes, type ReactNode } from 'react';

export type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  brand:   'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
};

function Badge({ variant = 'brand', children, className = '', ...rest }: BadgeProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
