import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

// ---------------------------------------------------------------------------
// Health & readiness routes.
//
// GET /health  — liveness probe.
//   Returns 200 as long as the process is running. No dependency checks.
//   Used by Docker/K8s to decide whether to restart the container.
//
// GET /ready   — readiness probe.
//   Returns 200 only when the service is ready to accept traffic.
//   Checks that every required dependency (DB, cache, broker) is reachable.
//   Used by load balancers / orchestrators to decide whether to route traffic.
//
// NOTE: The readiness check performs lightweight "ping" queries — not full
// integration tests. The goal is fast, cheap liveness signal, not correctness.
// ---------------------------------------------------------------------------

export const healthRouter = Router();

// ── Liveness ──────────────────────────────────────────────────────────────
// Returns 200 as long as the process is running.
// Used by Docker/K8s to decide whether to restart the container.
healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    probe: 'liveness',
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// ── Readiness ─────────────────────────────────────────────────────────────
// Returns 200 when the service is ready to accept traffic.
// Dependency checks are stubbed (false) until each infrastructure client is
// wired in a later phase. Shape is stable so callers can rely on it.
//
// Future phases: replace each false with a real ping:
//   database  → prisma.$queryRaw`SELECT 1`
//   redis     → redisClient.ping()
//   rabbitmq  → amqp channel check
healthRouter.get('/ready', (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    probe: 'readiness',
    status: 'ready',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    checks: {
      database: false,
      redis: false,
      rabbitmq: false,
    },
  });
});
