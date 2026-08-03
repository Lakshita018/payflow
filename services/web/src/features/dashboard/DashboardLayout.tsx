import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { useInitAuth } from '@/hooks';
import { useNotificationStore, useAuthStore } from '@/store';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useInitAuth();

  // Poll unread count every 30 s — only once the user is loaded AND push notifications are enabled.
  // user is null on first render (tokens in localStorage, /me not yet fetched), so we
  // must wait for a non-null user before checking the preference to avoid defaulting to `true`.
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);
  const user = useAuthStore((s) => s.user);
  const pushEnabled = user !== null && (user.pushNotifications ?? true);
  useEffect(() => {
    if (!pushEnabled) return;
    void refreshUnreadCount();
    const id = setInterval(() => { void refreshUnreadCount(); }, 30_000);
    return () => clearInterval(id);
  }, [refreshUnreadCount, pushEnabled]);

  return (
    <div className="min-h-screen bg-surface-subtle text-text-primary lg:pl-[17rem]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-col">
        <TopNavigation onMenuClick={() => setMobileOpen(true)} />

        <motion.main
          className="flex-1 px-4 pb-10 pt-5 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
