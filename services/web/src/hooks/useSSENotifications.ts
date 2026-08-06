// ---------------------------------------------------------------------------
// useSSENotifications.ts — React hook for managing SSE real-time notifications.
//
// Responsibilities:
//   • Establish SSE connection on mount (when authenticated)
//   • Handle incoming notification messages
//   • Update notification store and show toast for each type
//   • Prevent duplicate notifications
//   • Reset singleton and cleanup on logout / unmount so re-login
//     always gets a fresh connection
// ---------------------------------------------------------------------------
import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store';
import { useNotificationStore } from '@/store/notificationStore';
import { useToast } from '@/providers/ToastProvider';
import {
  createSSEClient,
  resetSSEClient,
  setAuthTokenGetter,
  type NotificationMessage,
} from '@/lib/sse-client';
import type { NotificationItem } from '@/types';

export function useSSENotifications(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken     = useAuthStore((s) => s.accessToken);
  const { addNotification, refreshUnreadCount } = useNotificationStore();
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

  // Memoize the notification handler so the connect effect only re-runs
  // when the store actions or toast context itself changes (both stable).
  const handleNotification = useCallback((notification: NotificationMessage) => {
    // Add to store (deduplication is inside addNotification)
    addNotification(notification as NotificationItem);

    // Refresh badge count from server to stay in sync
    void refreshUnreadCount();

    // Show an appropriate toast based on notification type
    const message = `${notification.title}: ${notification.body}`;
    switch (notification.type) {
      case 'MONEY_RECEIVED':
        toast.success(message);
        break;
      case 'MONEY_SENT':
        toast.info(message);
        break;
      case 'WALLET_TOPPED_UP':
        toast.success(message);
        break;
      case 'PASSWORD_CHANGED':
        toast.warning(message);
        break;
      case 'PROFILE_UPDATED':
        toast.info(message);
        break;
      default:
        toast.info(message);
    }
  }, [addNotification, refreshUnreadCount, toast]);

  // Connect once when authenticated; disconnect and reset singleton on logout
  // or unmount so re-login always opens a fresh SSE connection.
  useEffect(() => {
    if (!isAuthenticated) {
      // Ensure singleton is reset when the user logs out
      resetSSEClient();
      return;
    }

    const sseClient = createSSEClient();
    void sseClient.connect(handleNotification);

    return () => {
      // Disconnect (abort fetch) but keep singleton alive so a tab-switch
      // or StrictMode double-mount doesn't fully destroy the connection.
      sseClient.disconnect();
    };
  }, [isAuthenticated, handleNotification]);
}
