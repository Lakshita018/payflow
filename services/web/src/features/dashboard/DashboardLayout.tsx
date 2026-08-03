import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { useInitAuth } from '@/hooks';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  useInitAuth();

  // NOTE: Real-time notifications are now delivered via SSE in useSSENotifications hook.
  // The hook handles all notification updates immediately when they arrive.
  // Legacy polling has been removed; SSE provides instant delivery.

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
