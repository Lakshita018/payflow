/**
 * jest.setup.ts — runs before each test file (configured via setupFiles).
 *
 * Sets the minimum environment variables required by src/config/env.ts so
 * the Zod schema passes validation without needing a real .env file.
 * Values are test-only placeholders — they are never used for real auth.
 */

process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['SERVICE_NAME'] = 'auth-service';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';
process.env['REDIS_URL'] = 'redis://localhost:6379';
process.env['RABBITMQ_URL'] = 'amqp://guest:guest@localhost:5672';
process.env['JWT_ACCESS_SECRET'] = 'test-access-secret-minimum-32-characters!!';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-minimum-32-characters!';
process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['BCRYPT_SALT_ROUNDS'] = '10';
process.env['LOG_LEVEL'] = 'fatal';
