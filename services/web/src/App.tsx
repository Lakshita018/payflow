// ---------------------------------------------------------------------------
// App — root component. Wires the router into the provider tree.
// ---------------------------------------------------------------------------
import { RouterProvider } from 'react-router-dom';
import { QueryProvider }        from '@/providers/QueryProvider';
import { ThemeProvider }        from '@/providers/ThemeProvider';
import { ToastProvider }        from '@/providers/ToastProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { router }               from '@/routes';

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ToastProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </ToastProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
