// ---------------------------------------------------------------------------
// useSSENotifications.ts — React hook for managing SSE real-time notifications.
//
// Responsibilities:
//   • Establish SSE connection on mount (when authenticated)
//   • Handle incoming notification messages
//   • Update notification store, badge, toast, and animations
//   • Prevent duplicate notifications
//   • Cleanup on unmount
//   • Reconnect on auth changes
//
// Design notes:
//   • Depends on useAuthStore for auth state
//   • Depends on useNotificationStore for store updates
//   • Depends on useToast for toast notifications
//   • Safe with multiple mounts (only one active connection per user)
// ---------------------------------------------------------------------------
import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/providers/ToastProvider';
import { createSSEClient, setAuthTokenGetter, type NotificationMessage } from '@/lib/sse-client';
import type { NotificationItem } from '@/types';

export function useSSENotifications(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken     = useAuthStore((s) => s.accessToken);
  const { addNotification } = useNotificationStore();
  const { toast } = useToast();

  // Keep the token getter always up-to-date via a ref so the SSE client
  // reads the latest token on every connect/reconnect without the token
  // being a dependency of the connect effect (which would cancel and
  // restart the connection on every token refresh).
  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // Register the getter once on mount — it always reads the latest value
  // via the ref, so no re-registration is needed on token changes.
  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
  }, []);

  // Memoize the notification handler
  const handleNotification = useCallback((notification: NotificationMessage) => {
    console.log('[HOOK RECEIVED]', notification.id);
    console.log('[ADDING TO STORE]');
    addNotification(notification as NotificationItem);
    console.log('[STORE UPDATED]');
    const message = `${notification.title}: ${notification.body}`;
    console.log('[SHOWING TOAST]', message);
    if (notification.type === 'MONEY_RECEIVED') {
      toast.success(message);
    } else {
      toast.info(message);
    }
  }, [addNotification, toast]);

  // Connect once when authenticated; disconnect on logout or unmount.
  // accessToken is NOT a dep here — the getter ref always returns the
  // latest token, so reconnection on token refresh is handled automatically
  // by the SSE client's own scheduleReconnect logic.
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const sseClient = createSSEClient();
    void sseClient.connect(handleNotification);

    return () => {
      sseClient.disconnect();
    };
  }, [isAuthenticated, handleNotification]);
}
