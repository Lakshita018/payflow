// ---------------------------------------------------------------------------
// App — root component. Wires the router into the provider tree.
// ---------------------------------------------------------------------------
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from '@/providers';
import { router }        from '@/routes';

export function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}
