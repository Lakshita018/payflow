// prisma.config.ts — Prisma 7 configuration file.
// This is the single place Prisma reads the database connection string for
// migrations and the query engine. Application code uses src/config/prisma.ts.
//
// Works with both:
//   • Local PostgreSQL via Docker  (postgresql://user:pass@localhost:5432/db)
//   • Neon serverless Postgres     (postgresql://user:pass@host.neon.tech/db?sslmode=require)
//
// Two connection strings are used:
//   DATABASE_URL — pooled connection (Neon PgBouncer). Used by the runtime
//                  adapter (all app queries). Fast, efficient, but does not
//                  support session-level advisory locks.
//   DIRECT_URL   — direct (non-pooled) connection. Used by the migration
//                  engine only (prisma migrate deploy/dev). Required because
//                  advisory locking (pg_advisory_lock) needs a stable session
//                  which PgBouncer in transaction mode cannot provide.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Appends connect_timeout=30 to the DIRECT_URL so the TCP handshake waits up
 * to 30 s for Neon's compute to wake from cold-start before the advisory-lock
 * acquisition is even attempted.  Without this, Neon's ~5–15 s cold-start
 * races against Prisma's hard-coded 10 s advisory-lock timeout and loses.
 *
 * Only applied to the migration URL — the pooled DATABASE_URL used at runtime
 * is unchanged because PgBouncer keeps the compute warm during normal traffic.
 */
function withConnectTimeout(url: string | undefined, seconds = 30): string | undefined {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  // Avoid duplicating the param if it is already present
  if (url.includes('connect_timeout=')) return url;
  return `${url}${separator}connect_timeout=${seconds}`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // url — used by the Prisma migration engine (prisma migrate dev/deploy).
    // DIRECT_URL = non-pooled Neon endpoint (no -pooler in hostname).
    // connect_timeout=30 gives Neon's compute enough time to wake from cold-start
    // before the advisory lock attempt, preventing the P1002 timeout.
    url: withConnectTimeout(process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']),
    // adapter — used by the generated PrismaClient at runtime for query execution.
    // Keeps using DATABASE_URL (pooled) — no change to runtime behaviour.
    adapter: () => {
      const connectionString = process.env['DATABASE_URL'];
      if (!connectionString) {
        throw new Error('[prisma.config] DATABASE_URL environment variable is not set');
      }
      const pool = new Pool({ connectionString });
      return new PrismaPg(pool);
    },
  },
});
