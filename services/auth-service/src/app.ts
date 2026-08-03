import crypto from 'crypto';
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';
import { config } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { walletRouter } from './routes/wallet.routes';
import { transactionRouter } from './routes/transaction.routes';
import { userRouter } from './routes/user.routes';
import { notificationRouter } from './routes/notification.routes';
import { notFoundMiddleware, errorMiddleware } from './middlewares/error.middleware';

// ---------------------------------------------------------------------------
// Factory function — returns a configured Express Application.
// Separating the app factory from server.ts makes the app importable in
// tests without binding to a port, which is the standard pattern for
// supertest-based integration testing.
// ---------------------------------------------------------------------------
export function createApp(): Application {
  const app = express();

  // ── Security: trust proxy + disable x-powered-by ────────────────────────

  // Disable the "X-Powered-By: Express" header — minor security hardening.
  app.disable('x-powered-by');

  // Trust the first proxy hop (needed for accurate IP behind load balancers).
  if (config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ── Helmet — HTTP security headers ──────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────────────────────
  // Build the allowed-origins list from the environment variable plus
  // localhost variants for development convenience.
  const envOrigins = config.CORS_ALLOWED_ORIGINS
    ? config.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const allowedOrigins: (string | RegExp)[] = [
    ...envOrigins,
    // Always allow localhost in development so devs don't need extra config.
    ...(config.NODE_ENV !== 'production'
      ? [/^https?:\/\/localhost(:\d+)?$/]
      : []),
  ];
  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      credentials: true,
    }),
  );

  // ── Compression — gzip responses ────────────────────────────────────────
  app.use(compression());

  // ── Core middleware ──────────────────────────────────────────────────────

  // Parse JSON bodies.  The limit is set to 3 MB to accommodate base64-encoded
  // avatar images — a 2 MB image becomes ~2.67 MB as a base64 data URI, so 1 MB
  // was too small and caused Express to reject PATCH /auth/me with a 500.
  app.use(express.json({ limit: '3mb' }));
  app.use(express.urlencoded({ extended: true, limit: '3mb' }));

  // Structured HTTP request logging via pino-http.
  // Each incoming request gets a unique `reqId` for distributed tracing.
  app.use(
    pinoHttp({
      logger,
      // Assign a per-request ID — prefer the forwarded header so the same ID
      // flows through all services in a request chain (set by API Gateway).
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'] as string | undefined;
        const id = existing ?? crypto.randomUUID();
        // Echo the id back so callers can correlate client-side logs.
        res.setHeader('X-Request-ID', id);
        return id;
      },
      // Don't log health/ready probes — they're too noisy.
      autoLogging: {
        ignore: (req) =>
          req.url === '/health' || req.url === '/ready' || req.url === '/metrics',
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  // ── Rate limiting — auth endpoints ───────────────────────────────────────
  const authRateLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  });

  // ── Swagger UI ────────────────────────────────────────────────────────────
  // Served at /api-docs — does not require authentication.
  // Helmet's default CSP blocks inline scripts/styles that Swagger UI requires,
  // so we override only that header for this path.
  app.use('/api-docs', (_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
    );
    next();
  });
  app.use('/api-docs', swaggerUi.serve);
  app.use('/api-docs', swaggerUi.setup(swaggerSpec, { explorer: false }));

  // ── Routes ───────────────────────────────────────────────────────────────
  app.use('/', healthRouter);
  app.use('/api/v1/auth/login',           authRateLimiter);
  app.use('/api/v1/auth/register',        authRateLimiter);
  app.use('/api/v1/auth/refresh',         authRateLimiter);
  app.use('/api/v1/auth/forgot-password', authRateLimiter);
  app.use('/api/v1/auth/reset-password',  authRateLimiter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/wallets', walletRouter);
  app.use('/api/v1/transactions', transactionRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/notifications', notificationRouter);

  // ── Error handling (must be last) ─────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
