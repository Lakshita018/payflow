export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const classes = [
    'animate-spin rounded-full border-brand-200 border-t-brand-600',
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span role="status" aria-label="Loading" className={classes} />;
}

export default LoadingSpinner;
