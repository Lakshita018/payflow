// prisma.config.ts — Prisma 7 configuration file.
// This is the single place Prisma reads the database connection string for
// migrations and the query engine. Application code uses src/config/prisma.ts.
//
// Works with both:
//   • Local PostgreSQL via Docker  (postgresql://user:pass@localhost:5432/db)
//   • Neon serverless Postgres     (postgresql://user:pass@host.neon.tech/db?sslmode=require)
// No schema or code changes needed — only DATABASE_URL differs between environments.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // url — used by the Prisma migration engine (prisma migrate dev/deploy).
    url: process.env['DATABASE_URL'],
    // adapter — used by the generated PrismaClient at runtime for query execution.
    // Both point to the same DATABASE_URL; the adapter wraps it in a pg.Pool.
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
