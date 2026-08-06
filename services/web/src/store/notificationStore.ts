// ---------------------------------------------------------------------------
// notificationStore — Zustand store for the notification center.
//
// Responsibilities:
//   • Hold the notification list and unread count.
//   • Expose actions: fetch, mark read, mark all read.
//   • Poll unread count in the background (every 30 s) while authenticated.
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import type { NotificationItem } from '@/types';
import { notificationService } from '@/services';

interface NotificationState {
  // ── State ──────────────────────────────────────────────────────────────────
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
  isOpen: boolean;
  isFetching: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  /** Open/close the dropdown. */
  setOpen: (open: boolean) => void;
  /** Fetch the first page and refresh unread count. */
  fetchNotifications: () => Promise<void>;
  /** Load the next page (infinite scroll). */
  fetchMore: () => Promise<void>;
  /** Refresh only the badge count. */
  refreshUnreadCount: () => Promise<void>;
  /** Mark a single notification as read. */
  markRead: (id: string) => Promise<void>;
  /** Mark all notifications as read. */
  markAllRead: () => Promise<void>;
  /** Add a real-time notification (SSE). Prevents duplicates by ID. */
  addNotification: (notification: NotificationItem) => void;
  /** Reset store on logout. */
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────────────────
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  isOpen: false,
  isFetching: false,

  // ── Actions ────────────────────────────────────────────────────────────────
  setOpen: (open) => set({ isOpen: open }),

  fetchNotifications: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });
    try {
      const result = await notificationService.list();
      set({
        notifications: result.notifications,
        unreadCount:   result.unreadCount,
        nextCursor:    result.nextCursor,
      });
    } catch {
      // silently ignore — badge stays at previous value
    } finally {
      set({ isFetching: false });
    }
  },

  fetchMore: async () => {
    const { nextCursor, isFetching } = get();
    if (!nextCursor || isFetching) return;
    set({ isFetching: true });
    try {
      const result = await notificationService.list(nextCursor);
      set((state) => ({
        notifications: [...state.notifications, ...result.notifications],
        nextCursor:    result.nextCursor,
        unreadCount:   result.unreadCount,
      }));
    } catch {
      // silently ignore
    } finally {
      set({ isFetching: false });
    }
  },

  refreshUnreadCount: async () => {
    try {
      const { unreadCount } = await notificationService.getUnreadCount();
      set({ unreadCount });
    } catch {
      // silently ignore
    }
  },

  markRead: async (id) => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.find((n) => n.id === id)?.isRead ? 0 : 1)),
    }));
    try {
      await notificationService.markRead(id);
    } catch {
      // revert on failure
      await get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationService.markAllRead();
    } catch {
      // revert on failure
      await get().fetchNotifications();
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Deduplicate by ID
      if (state.notifications.some((n) => n.id === notification.id)) return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    });
  },

  reset: () => set({ notifications: [], unreadCount: 0, nextCursor: null, isOpen: false, isFetching: false }),
}));
