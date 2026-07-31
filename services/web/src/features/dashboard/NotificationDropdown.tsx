// ---------------------------------------------------------------------------
// NotificationDropdown — bell dropdown for the notification center.
//
// Features:
//   • Unread badge on the bell icon
//   • Paginated list (load more button)
//   • Mark individual notification as read on click
//   • Mark all as read button
//   • Click outside to dismiss
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store';
import type { NotificationItem } from '@/types';
import { ROUTES } from '@/routes/paths';
import { BellIcon } from './icons';

// ── Relative time helper ──────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Icon per notification type ────────────────────────────────────────────────
function NotifIcon({ type }: { type: NotificationItem['type'] }) {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full';
  if (type === 'MONEY_RECEIVED') {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M12 19V5M5 12l7 7 7-7" />
        </svg>
      </span>
    );
  }
  if (type === 'MONEY_SENT') {
    return (
      <span className={`${base} bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M12 5v14M19 12l-7-7-7 7" />
        </svg>
      </span>
    );
  }
  if (type === 'WALLET_TOPPED_UP') {
    return (
      <span className={`${base} bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="2" y="6" width="20" height="14" rx="3" />
          <path d="M16 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor" />
          <path d="M2 10h20" />
        </svg>
      </span>
    );
  }
  if (type === 'PASSWORD_CHANGED') {
    return (
      <span className={`${base} bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </span>
    );
  }
  // PROFILE_UPDATED + fallback
  return (
    <span className={`${base} bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400`}>
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20c1.6-3.6 4.9-5.5 6.5-5.5S16.9 16.4 18.5 20" />
      </svg>
    </span>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
    if (notification.refId) {
      void navigate(`${ROUTES.TRANSACTIONS}/${notification.refId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-100',
        notification.isRead
          ? 'hover:bg-surface-subtle'
          : 'bg-brand-50/60 hover:bg-brand-50 dark:bg-brand-900/10 dark:hover:bg-brand-900/20',
      ].join(' ')}
    >
      <NotifIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-xs font-semibold ${notification.isRead ? 'text-text-primary' : 'text-brand-700 dark:text-brand-400'}`}>
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-text-muted">{relativeTime(notification.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{notification.body}</p>
      </div>
      {!notification.isRead && (
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
      )}
    </button>
  );
}

// ── Main dropdown ─────────────────────────────────────────────────────────────
export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    nextCursor,
    isOpen,
    isFetching,
    setOpen,
    fetchNotifications,
    fetchMore,
    markRead,
    markAllRead,
  } = useNotificationStore();

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch when opening
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, setOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary shadow-xs transition-all duration-150 hover:border-border-strong hover:text-text-primary"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-4 w-4" />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[10px] font-bold leading-none text-white ring-1 ring-surface"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[26rem] overflow-y-auto">
              {isFetching && notifications.length === 0 ? (
                // Loading skeleton
                <div className="space-y-0 divide-y divide-border">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-subtle" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-subtle" />
                        <div className="h-2.5 w-3/4 animate-pulse rounded bg-surface-subtle" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                  <BellIcon className="h-8 w-8 text-text-muted opacity-40" />
                  <p className="text-sm text-text-muted">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <NotifRow
                      key={n.id}
                      notification={n}
                      onMarkRead={(id) => void markRead(id)}
                    />
                  ))}
                  {/* Load more */}
                  {nextCursor && (
                    <div className="flex justify-center px-4 py-3">
                      <button
                        type="button"
                        disabled={isFetching}
                        onClick={() => void fetchMore()}
                        className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50"
                      >
                        {isFetching ? 'Loading…' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
