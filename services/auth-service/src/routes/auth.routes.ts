// ---------------------------------------------------------------------------
// Auth routes — wires the HTTP layer for all authentication endpoints.
//
// Composition root for the auth feature:
//   prisma singleton  →  UserRepository + WalletRepository  →  AuthService  →  AuthController
//
// All dependencies are instantiated exactly once at module-load time.
// Because Node's module cache keeps this file alive for the process lifetime,
// there is no risk of double-instantiation.
//
// Routes mounted here are prefixed with /api/v1/auth in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

// ── Dependency composition ─────────────────────────────────────────────────
const userRepository         = new UserRepository(prisma);
const walletRepository       = new WalletRepository(prisma);
const notificationRepository = new NotificationRepository(prisma);
const authService            = new AuthService(userRepository, walletRepository, notificationRepository);
const authController   = new AuthController(authService);

const auth = createAuthMiddleware(userRepository);

// ── Router ─────────────────────────────────────────────────────────────────
export const authRouter = Router();

// Arrow-function wrappers satisfy Express's `void` return type while keeping
// the async handler signature. They also eliminate the `unbound-method` lint
// warning because we are no longer passing a bound method reference directly.

// POST /api/v1/auth/register
authRouter.post('/register', (req, res, next) => { void authController.register(req, res, next); });

// POST /api/v1/auth/login
authRouter.post('/login', (req, res, next) => { void authController.login(req, res, next); });

// POST /api/v1/auth/refresh
authRouter.post('/refresh', (req, res, next) => { void authController.refreshToken(req, res, next); });

// POST /api/v1/auth/logout
authRouter.post('/logout', (req, res, next) => { void authController.logout(req, res, next); });

// GET /api/v1/auth/me  — protected, returns current user's profile
authRouter.get('/me', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void authController.me(req, res, next); });

// PATCH /api/v1/auth/me  — protected, updates editable profile fields
authRouter.patch('/me', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void authController.updateProfile(req, res, next); });

// POST /api/v1/auth/change-password  — protected
authRouter.post('/change-password', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void authController.changePassword(req, res, next); });

// POST /api/v1/auth/logout-all  — protected; invalidates all sessions
authRouter.post('/logout-all', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void authController.logoutAll(req, res, next); });

// PATCH /api/v1/auth/preferences  — protected; saves user preferences
authRouter.patch('/preferences', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void authController.updatePreferences(req, res, next); });

// POST /api/v1/auth/forgot-password  — public; rate-limited in app.ts
authRouter.post('/forgot-password', (req, res, next) => { void authController.forgotPassword(req, res, next); });

// POST /api/v1/auth/reset-password  — public; consumes the one-time token
authRouter.post('/reset-password', (req, res, next) => { void authController.resetPassword(req, res, next); });
