// ---------------------------------------------------------------------------
// Route constants — single source of truth for all application paths.
// Import ROUTES wherever a path string is needed instead of hard-coding.
// ---------------------------------------------------------------------------
export const ROUTES = {
  HOME:             '/',
  LOGIN:            '/login',
  REGISTER:         '/register',
  FORGOT_PASSWORD:  '/forgot-pwd',
  RESET_PASSWORD:   '/reset-pwd',
  DASHBOARD:        '/dashboard',
  TRANSACTIONS:     '/transactions',
  TRANSACTION_DETAILS: '/transactions/:id',
  SEND_MONEY:       '/send-money',
  TRANSFER:         '/transfer',
  REQUEST_MONEY:    '/request-money',
  INCOMING_REQUESTS: '/requests/incoming',
  OUTGOING_REQUESTS: '/requests/outgoing',
  RECIPIENTS:       '/recipients',
  FAVOURITES:       '/favourites',
  PROFILE:          '/profile',
  SETTINGS:         '/settings',
  USER_PROFILE:     '/users/:payflowId',
} as const;

// Helper to build a concrete user-profile URL from a payflowId.
export function userProfilePath(payflowId: string): string {
  return `/users/${encodeURIComponent(payflowId)}`;
}
