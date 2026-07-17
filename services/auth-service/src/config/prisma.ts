// ---------------------------------------------------------------------------
// Prisma Client singleton — src/config/prisma.ts
//
// Prisma 7 requires a driver adapter for all connections. We use
// @prisma/adapter-pg (node-postgres), which works identically with:
//   • Local PostgreSQL (Docker Compose)
//   • Neon serverless Postgres (pass ?sslmode=require in DATABASE_URL)
//
// Singleton pattern
// -----------------
// Production  — one module-level instance per process; Node module cache
//               ensures it is never recreated.
// Development — both pool and client stored on globalThis so ts-node-dev /
//               Jest module reloads reuse the same pg.Pool instead of opening
//               a new one each time, which would exhaust the connection limit.
//
// Shutdown
// --------
// Call disconnectPrisma() during graceful shutdown (SIGTERM / SIGINT) to
// drain in-flight queries and close all pg pool connections cleanly.
// server.ts calls this after the HTTP server stops accepting connections.
//
// Usage
// -----
//   import { prisma } from '../config/prisma';
//   const user = await prisma.user.findUnique({ where: { id } });
// ---------------------------------------------------------------------------
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { config } from './env';

// ---------------------------------------------------------------------------
// Internal container — keeps pool and client co-located so they are always
// closed together. Never exported; callers only need `prisma`.
// ---------------------------------------------------------------------------
interface PrismaContainer {
  pool: Pool;
  client: PrismaClient;
}

function createContainer(): PrismaContainer {
  // One Pool per process. pg.Pool manages its own internal connection
  // recycling; we do not need to tune pool size here — defaults (max: 10)
  // are appropriate for a service handling ~100 req/s at p95 < 200 ms.
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  return { pool, client };
}

// ---------------------------------------------------------------------------
// Global declaration — TypeScript-safe globalThis cache for dev/test reloads.
// ---------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __prismaContainer: PrismaContainer | undefined;
}

const container: PrismaContainer =
  global.__prismaContainer ?? createContainer();

if (config.NODE_ENV !== 'production') {
  // Persist across ts-node-dev / Jest hot-reloads so the same Pool instance
  // is reused. In production the module cache handles this automatically.
  global.__prismaContainer = container;
}

// ---------------------------------------------------------------------------
// Public API — only the client is exported. The pool is an implementation
// detail; callers must never interact with it directly.
// ---------------------------------------------------------------------------
export const prisma: PrismaClient = container.client;

// ---------------------------------------------------------------------------
// disconnectPrisma — call once during graceful shutdown.
// Prisma does not automatically close the underlying pg.Pool on process exit,
// so this must be called explicitly to avoid connection leaks.
// ---------------------------------------------------------------------------
export async function disconnectPrisma(): Promise<void> {
  await container.client.$disconnect();
  await container.pool.end();
}
