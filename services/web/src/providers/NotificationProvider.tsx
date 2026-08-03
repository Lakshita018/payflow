// ---------------------------------------------------------------------------
// NotificationProvider — wraps the app with real-time notification setup.
//
// Responsibilities:
//   • Initialize and manage SSE notifications
//   • Handle auth state changes (connect on login, cleanup on logout)
//   • Provide a global point for real-time notification management
// ---------------------------------------------------------------------------
import type { ReactNode } from 'react';
import { useSSENotifications } from '@/hooks/useSSENotifications';

interface NotificationProviderProps {
  children: ReactNode;
}

function NotificationProviderInner() {
  // Hook handles all SSE setup and cleanup
  useSSENotifications();
  return null;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  return (
    <>
      <NotificationProviderInner />
      {children}
    </>
  );
}
