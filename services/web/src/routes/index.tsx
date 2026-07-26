// ---------------------------------------------------------------------------
// Application router — declares all routes using React Router v6.
//
// Structure:
//   /        → redirect to /dashboard
//   Guest    (GuestRoute)    — login, register; redirects authenticated users to /dashboard
//   App      (ProtectedRoute) — all authenticated pages; redirects guests to /login
//   *        → 404
// ---------------------------------------------------------------------------
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './paths';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';

// Layouts
import { AuthLayout }      from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Pages
import { LoginPage }               from '@/pages/LoginPage';
import { RegisterPage }            from '@/pages/RegisterPage';
import { DashboardPage }           from '@/pages/DashboardPage';
import { ProfilePage }             from '@/pages/ProfilePage';
import { TransactionsPage }        from '@/pages/TransactionsPage';
import { TransactionDetailsPage }  from '@/pages/TransactionDetailsPage';
import { TransferPage }            from '@/pages/TransferPage';
import { RecipientsPage }          from '@/pages/RecipientsPage';
import { FavouritesPage }          from '@/pages/FavouritesPage';
import { SettingsPage }            from '@/pages/SettingsPage';
import { NotFoundPage }            from '@/pages/NotFoundPage';
import { UserProfilePage }         from '@/pages/UserProfilePage';

export const router = createBrowserRouter([
  // ── Root redirect ──────────────────────────────────────────────────────────
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },

  // ── Guest-only routes (login, register) ────────────────────────────────────
  // GuestRoute redirects authenticated users to /dashboard so they never see
  // the login or register pages while already signed in.
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN,    element: <LoginPage /> },
          { path: ROUTES.REGISTER, element: <RegisterPage /> },
        ],
      },
    ],
  },

  // ── Authenticated app routes ───────────────────────────────────────────────
  // ProtectedRoute redirects unauthenticated users to /login.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.DASHBOARD,           element: <DashboardPage /> },
          { path: ROUTES.TRANSACTIONS,        element: <TransactionsPage /> },
          { path: ROUTES.TRANSACTION_DETAILS, element: <TransactionDetailsPage /> },
          { path: ROUTES.SEND_MONEY,          element: <TransferPage /> },
          { path: ROUTES.TRANSFER,            element: <TransferPage /> },
          { path: ROUTES.RECIPIENTS,          element: <RecipientsPage /> },
          { path: ROUTES.FAVOURITES,          element: <FavouritesPage /> },
          { path: ROUTES.PROFILE,             element: <ProfilePage /> },
          { path: ROUTES.SETTINGS,            element: <SettingsPage /> },
          { path: ROUTES.USER_PROFILE,        element: <UserProfilePage /> },
        ],
      },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
