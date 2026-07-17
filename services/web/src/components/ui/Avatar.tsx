import { type HTMLAttributes } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name?: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({ name = '', src, size = 'md', className = '', ...rest }: AvatarProps) {
  const base =
    'inline-flex items-center justify-center rounded-full font-medium select-none overflow-hidden bg-brand-100 text-brand-700 shrink-0';
  const classes = [base, sizeClasses[size], className].filter(Boolean).join(' ');

  if (src) {
    return (
      <span className={classes} {...rest}>
        <img src={src} alt={name || 'avatar'} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className={classes} {...rest} aria-label={name || 'avatar'}>
      {name ? getInitials(name) : '?'}
    </span>
  );
}

export default Avatar;
