import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

// ---------------------------------------------------------------------------
// Global error-handling middleware.
// Must be the LAST middleware registered on the Express app (after all routes).
// Handles three categories:
//   1. AppError subclasses  — operational domain errors, surfaced to client
//   2. ZodError             — request validation failures → 400
//   3. Everything else      — unexpected bugs → 500, message hidden from client
// ---------------------------------------------------------------------------
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // pino-http attaches a per-request logger and id on req (via http.IncomingMessage augmentation).
  // Include the request id in every error log so operators can correlate errors to requests.
  const reqId = (req as Request & { id?: string | number }).id;
  const reqLog = (req as Request & { log?: typeof logger }).log ?? logger;

  // ── Zod validation error ─────────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(StatusCodes.BAD_REQUEST).json({
      error: 'Validation failed',
      details,
    });
    return;
  }

  // ── Known operational AppError ────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    if (err.statusCode >= 500) {
      reqLog.error({ err, reqId }, err.message);
    } else {
      reqLog.warn({ err, reqId }, err.message);
    }
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // ── Unexpected / programmer error ─────────────────────────────────────────
  // Log with full stack; never leak internal details to the client.
  reqLog.error({ err, reqId }, 'Unhandled error');
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: 'An unexpected error occurred',
  });
}

// ---------------------------------------------------------------------------
// 404 handler — register BEFORE errorMiddleware, AFTER all other routes.
// ---------------------------------------------------------------------------
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
}
