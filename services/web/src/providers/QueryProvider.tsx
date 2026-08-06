// ---------------------------------------------------------------------------
// QueryProvider — wraps the app with TanStack Query's QueryClientProvider.
//
// queryClient is exported so useSSENotifications can invalidate caches
// directly when a real-time notification arrives, without needing an
// additional hook level or prop drilling.
// ---------------------------------------------------------------------------
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minute
      retry: 1,
      // Re-fetch on focus so switching back to a tab after a background
      // transaction always shows fresh data.
      refetchOnWindowFocus: true,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
