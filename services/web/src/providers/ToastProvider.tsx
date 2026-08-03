// ---------------------------------------------------------------------------
// ToastProvider — lightweight toast notification system.
// Usage:
//   const { toast } = useToast();
//   toast.success('Payment sent!');
//   toast.error('Something went wrong');
//   toast.info('Copied to clipboard');
// ---------------------------------------------------------------------------
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: {
    success: (message: string, duration?: number) => void;
    error:   (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info:    (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { bar: string; bg: string; icon: JSX.Element }> = {
  success: {
    bar: 'bg-success',
    bg:  'border-success/20 bg-success/5',
    icon: (
      <svg className="h-4 w-4 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bar: 'bg-danger',
    bg:  'border-danger/20 bg-danger/5',
    icon: (
      <svg className="h-4 w-4 text-danger shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    bar: 'bg-warning',
    bg:  'border-warning/20 bg-warning/5',
    icon: (
      <svg className="h-4 w-4 text-warning shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  info: {
    bar: 'bg-brand-600',
    bg:  'border-brand-200/40 bg-brand-50/60 dark:border-brand-800/40 dark:bg-brand-950/40',
    icon: (
      <svg className="h-4 w-4 text-brand-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
};

// ── Individual toast with auto-dismiss progress bar ───────────────────────────
function Toast({ t, onDismiss }: { t: ToastItem; onDismiss: (id: string) => void }) {
  const { bar, bg, icon } = variantConfig[t.variant];

  return (
    <motion.div
      layout
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={[
        'pointer-events-auto relative flex w-full max-w-sm items-start gap-3',
        'overflow-hidden rounded-2xl border bg-surface px-4 py-3 shadow-card-md',
        bg,
      ].join(' ')}
    >
      {/* Left accent bar */}
      <div className={['absolute inset-y-0 left-0 w-[3px] rounded-l-2xl', bar].join(' ')} />

      <span className="mt-0.5 ml-2">{icon}</span>

      <p className="flex-1 text-sm font-medium text-text-primary leading-snug">{t.message}</p>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(t.id)}
        className="mt-0.5 shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={['absolute bottom-0 left-0 h-[2px] rounded-full', bar].join(' ')}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: t.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Cap at 4 visible toasts
    setToasts((prev) => [...prev.slice(-3), { id, message, variant, duration }]);
    timerRef.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg: string, dur?: number) => addToast(msg, 'success', dur),
    error:   (msg: string, dur?: number) => addToast(msg, 'error',   dur ?? 5000),
    warning: (msg: string, dur?: number) => addToast(msg, 'warning', dur),
    info:    (msg: string, dur?: number) => addToast(msg, 'info',    dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — bottom-right on desktop, bottom-centre on mobile */}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2 max-sm:right-0 max-sm:left-0 max-sm:items-center max-sm:px-4"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map((t) => (
            <Toast key={t.id} t={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
