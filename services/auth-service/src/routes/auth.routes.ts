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
import { AuthService } from '../services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

// ── Dependency composition ─────────────────────────────────────────────────
const userRepository   = new UserRepository(prisma);
const walletRepository = new WalletRepository(prisma);
const authService      = new AuthService(userRepository, walletRepository);
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
