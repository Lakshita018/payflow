// ---------------------------------------------------------------------------
// DashboardLayout — shell for all authenticated pages.
// ---------------------------------------------------------------------------
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar }  from './Navbar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-surface-subtle">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 lg:ml-68">
        <Navbar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
