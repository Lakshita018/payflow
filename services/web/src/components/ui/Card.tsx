import { type HTMLAttributes, type ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default:     'card',
  elevated:    'card-md',
  interactive: 'card cursor-pointer hover:shadow-card-md hover:border-border-strong transition-shadow duration-150',
};

function Card({ variant = 'default', children, className = '', ...rest }: CardProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export default Card;
