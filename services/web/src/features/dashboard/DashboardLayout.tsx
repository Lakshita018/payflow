import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { useInitAuth } from '@/hooks';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Restore user profile from token on every page load / tab refresh
  useInitAuth();

  return (
    <div className="min-h-screen bg-surface-subtle text-text-primary lg:pl-68">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-col">
        <TopNavigation onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 px-4 pb-10 pt-6 sm:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}