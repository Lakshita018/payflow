// ---------------------------------------------------------------------------
// Application router — declares all routes using React Router v6.
//
// Structure:
//   / (redirect → /dashboard)
//   Auth routes  (wrapped in AuthLayout)      — login, register
//   App routes   (wrapped in DashboardLayout) — all authenticated pages
//   * 404
// ---------------------------------------------------------------------------
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';

// Layouts
import { AuthLayout }      from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Pages
import { LoginPage }        from '@/pages/LoginPage';
import { RegisterPage }     from '@/pages/RegisterPage';
import { DashboardPage }    from '@/pages/DashboardPage';
import { ProfilePage }      from '@/pages/ProfilePage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { TransactionDetailsPage } from '@/pages/TransactionDetailsPage';
import { TransferPage }     from '@/pages/TransferPage';
import { RecipientsPage }   from '@/pages/RecipientsPage';
import { FavouritesPage }   from '@/pages/FavouritesPage';
import { SettingsPage }     from '@/pages/SettingsPage';
import { NotFoundPage }     from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  // ── Root redirect ──────────────────────────────────────────────────────────
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },

  // ── Auth routes ─────────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN,    element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
    ],
  },

  // ── Authenticated app routes ─────────────────────────────────────────────
  {
    element: <DashboardLayout />,
    children: [
      { path: ROUTES.DASHBOARD,    element: <DashboardPage /> },
      { path: ROUTES.TRANSACTIONS, element: <TransactionsPage /> },
      { path: ROUTES.TRANSACTION_DETAILS, element: <TransactionDetailsPage /> },
      { path: ROUTES.SEND_MONEY,   element: <TransferPage /> },
      { path: ROUTES.TRANSFER,     element: <TransferPage /> },
      { path: ROUTES.RECIPIENTS,   element: <RecipientsPage /> },
      { path: ROUTES.FAVOURITES,   element: <FavouritesPage /> },
      { path: ROUTES.PROFILE,      element: <ProfilePage /> },
      { path: ROUTES.SETTINGS,     element: <SettingsPage /> },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
