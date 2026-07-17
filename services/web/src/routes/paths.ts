// ---------------------------------------------------------------------------
// Route constants — single source of truth for all application paths.
// Import ROUTES wherever a path string is needed instead of hard-coding.
// ---------------------------------------------------------------------------
export const ROUTES = {
  HOME:         '/',
  LOGIN:        '/login',
  REGISTER:     '/register',
  DASHBOARD:    '/dashboard',
  TRANSACTIONS: '/transactions',
  TRANSACTION_DETAILS: '/transactions/:id',
  SEND_MONEY:   '/send-money',
  TRANSFER:     '/transfer',
  RECIPIENTS:   '/recipients',
  FAVOURITES:   '/favourites',
  PROFILE:      '/profile',
  SETTINGS:     '/settings',
} as const;
