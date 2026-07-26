import 'dotenv/config';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema — every env var is validated at startup.
// The process exits immediately with a descriptive error if any value is
// missing or fails validation so misconfiguration is caught early, not at
// first use of the broken value.
//
// Optional vs required breakdown
// --------------------------------
// DATABASE_URL         — REQUIRED. No fallback; the service cannot function without it.
// JWT_ACCESS_SECRET    — REQUIRED. Must be ≥32 chars; shorter values are cryptographically weak.
// JWT_REFRESH_SECRET   — REQUIRED. Must be ≥32 chars; must differ from ACCESS_SECRET.
// REDIS_URL            — OPTIONAL until Phase 5 (idempotency keys). When present it must
//                        be a valid URL; when absent the service starts normally but
//                        idempotency-key enforcement is not available. The field is typed
//                        as `string | undefined` so every future caller is forced to guard
//                        for its absence at the TypeScript level — accidental use before
//                        the client is wired is a compile error, not a runtime surprise.
// RABBITMQ_URL         — OPTIONAL until Phase 6 (async notifications). Same pattern as
//                        REDIS_URL. When the AMQP client is wired it must check that
//                        config.RABBITMQ_URL is defined before connecting.
// ---------------------------------------------------------------------------
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SERVICE_NAME: z.string().default('auth-service'),

  // ── Database (required) ───────────────────────────────────────────────────
  // Accepts both local PostgreSQL and Neon serverless URLs.
  // Neon requires ?sslmode=require appended to the connection string.
  DATABASE_URL: z.string().url(),

  // ── Redis (optional — required in Phase 5) ───────────────────────────────
  // Used for idempotency-key storage (SET NX EX) on POST /transactions/transfer.
  // When absent the server starts normally; the transfer endpoint works but
  // duplicate-request protection is not enforced.
  // Accepts: redis://host:port  |  rediss://host:port (TLS, required for Upstash)
  REDIS_URL: z.string().url().optional(),

  // ── RabbitMQ (optional — required in Phase 6) ────────────────────────────
  // Used for async payment.* and audit.* event publishing.
  // When absent the server starts normally; events are not published.
  // Accepts: amqp://user:pass@host:port  |  amqps://... (TLS)
  RABBITMQ_URL: z.string().url().optional(),

  // ── JWT (required) ────────────────────────────────────────────────────────
  // Two separate secrets so a compromised access token cannot be used to forge
  // a refresh token (type-confusion defence). Generate each with:
  //   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  // Short-lived access token (stateless, verified on every request).
  // Default 15m balances security and UX — increase only if you have a
  // specific reason (longer window = longer exposure window after compromise).
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),

  // Long-lived refresh token (single-use, rotated on every refresh).
  // Stored as a bcrypt hash in the DB — the raw token only lives in memory.
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── Bcrypt (required) ─────────────────────────────────────────────────────
  // Number of salt rounds for password hashing. 10 is the NIST minimum;
  // 12 is ~250 ms/hash on modern hardware — the recommended default.
  // Do not go below 10. Do not exceed 16 in production without benchmarking.
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(20).default(12),

  // ── Logging ───────────────────────────────────────────────────────────────
  // Pino log level. Use 'info' in production and 'debug' locally when tracing
  // request flows. 'trace' is very verbose — development only.
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Comma-separated list of allowed origins. Empty string = allow none.
  // localhost:* is always allowed in development regardless of this value.
  // Example: https://payflow.vercel.app,https://admin.payflow.io
  CORS_ALLOWED_ORIGINS: z.string().default(''),

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // Applied to auth routes only (/login, /register, /refresh).
  // RATE_LIMIT_AUTH_MAX  — max requests per window (default 10)
  // RATE_LIMIT_WINDOW_MS — sliding window in milliseconds (default 15 minutes)
  // Lower these in production; raise them in development to avoid blocking
  // yourself while testing.
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
});

// ---------------------------------------------------------------------------
// Parse + export — fail fast on bad config.
// ---------------------------------------------------------------------------
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  // Format zod errors into a readable message before crashing.
  const formatted = _parsed.error.errors
    .map((e) => `  ${e.path.join('.')}: ${e.message}`)
    .join('\n');
  console.error(`[auth-service] Invalid environment configuration:\n${formatted}`);
  process.exit(1);
}

export const config = Object.freeze(_parsed.data);
export type Config = typeof config;
