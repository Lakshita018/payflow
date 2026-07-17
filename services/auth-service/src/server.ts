import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { disconnectPrisma } from './config/prisma';

// ---------------------------------------------------------------------------
// Entry point — create the HTTP server, bind to the configured port, and
// wire graceful shutdown for SIGTERM and SIGINT.
//
// Separation of concerns:
//   app.ts     — Express configuration, middleware, routes (testable without a port)
//   server.ts  — Binds the app to a port, manages process lifecycle
// ---------------------------------------------------------------------------

const app = createApp();
const server = http.createServer(app);

// ── Start ────────────────────────────────────────────────────────────────────
server.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      service: config.SERVICE_NAME,
    },
    `Auth Service listening on port ${config.PORT}`,
  );
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// On SIGTERM / SIGINT: stop accepting new connections, drain in-flight
// requests (up to SHUTDOWN_TIMEOUT_MS), then close dependencies cleanly.
// This ensures zero-downtime rolling deploys and clean container stops.

const SHUTDOWN_TIMEOUT_MS = 10_000;

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutdown signal received — draining connections');

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while closing HTTP server');
      process.exit(1);
    }

    // Disconnect Prisma client and drain the pg.Pool before exiting.
    // Redis and RabbitMQ teardown will be added in Phases 5 and 6.
    disconnectPrisma()
      .then(() => {
        logger.info('HTTP server and database connections closed — exiting');
        process.exit(0);
      })
      .catch((disconnectErr: unknown) => {
        logger.error({ err: disconnectErr }, 'Error closing database connections');
        process.exit(1);
      });
  });

  // Force-exit if drain takes too long — don't hang a container forever.
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled rejections / exceptions ────────────────────────────────────────
// Log and exit — let the process supervisor (Docker / PM2) restart the service.
// Swallowing these silently is a common source of subtle production bugs.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
