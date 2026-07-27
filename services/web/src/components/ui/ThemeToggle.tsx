// ---------------------------------------------------------------------------
// ThemeToggle — pill button that toggles between light and dark modes.
// ---------------------------------------------------------------------------
import { useTheme } from '@/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  variant?: 'pill' | 'icon';
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.5 1.5M17.8 17.8l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.5-1.5M17.8 6.2l1.5-1.5" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.2 13.9A7.2 7.2 0 1 1 10.1 3a8.2 8.2 0 1 0 6.1 10.9Z" />
    </svg>
  );
}

export function ThemeToggle({ className = '', variant = 'pill' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        type="button"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className={[
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border',
          'bg-surface text-text-secondary shadow-xs',
          'transition-all duration-200 hover:border-border-strong hover:bg-surface-muted hover:text-text-primary',
          'focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
          className,
        ].filter(Boolean).join(' ')}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium',
        'border-border bg-surface text-text-secondary shadow-xs',
        'transition-all duration-200 hover:border-border-strong hover:bg-surface-muted hover:text-text-primary',
        'active:scale-[0.98]',
        className,
      ].filter(Boolean).join(' ')}
    >
      {isDark ? (
        <>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
            <MoonIcon />
          </span>
          <span className="hidden sm:inline">Light</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
            <SunIcon />
          </span>
        </>
      ) : (
        <>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
            <SunIcon />
          </span>
          <span className="hidden sm:inline">Dark</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
            <MoonIcon />
          </span>
        </>
      )}
    </button>
  );
}
