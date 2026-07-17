import 'dotenv/config';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema — every env var is validated at startup.
// The process exits immediately with a descriptive error if any value is
// missing or fails validation so misconfiguration is caught early, not at
// first use of the broken value.
// ---------------------------------------------------------------------------
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  SERVICE_NAME: z.string().default('auth-service'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis — client not yet initialised; validated here so misconfiguration
  // is caught at startup rather than at first use in Phase 5.
  REDIS_URL: z.string().url(),

  // RabbitMQ — client not yet initialised; validated here for the same reason.
  // Phase 6 will instantiate the AMQP connection using this value.
  RABBITMQ_URL: z.string().url(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Bcrypt — number of salt rounds used when hashing passwords.
  // 10 is the practical minimum; 12 is the recommended default (~250 ms/hash).
  // Increase in production if hardware allows; do not go below 10.
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(20).default(12),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS — comma-separated list of allowed origins (e.g. "https://app.payflow.io,https://admin.payflow.io")
  CORS_ALLOWED_ORIGINS: z.string().default(''),

  // Rate limiting for auth endpoints
  // Max requests per window (default 10 for auth routes)
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  // Window duration in milliseconds (default 15 minutes)
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
