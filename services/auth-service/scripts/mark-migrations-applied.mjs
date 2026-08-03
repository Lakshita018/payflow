/**
 * mark-migrations-applied.mjs
 *
 * Drop-in replacement for `prisma migrate deploy` on Neon serverless Postgres.
 *
 * WHY: Prisma's migration engine acquires a session-level advisory lock
 * (pg_advisory_lock) before running migrations.  Neon's PgBouncer pooler does
 * not support session-level locks, and the direct (non-pooled) connection races
 * against Neon's compute cold-start — the 10 s lock timeout expires before the
 * compute is fully awake, producing error P1002.
 *
 * WHAT THIS DOES:
 *   1. Reads every migration folder under prisma/migrations/ in chronological order.
 *   2. Connects to the DB using DIRECT_URL (falling back to DATABASE_URL).
 *   3. Ensures the _prisma_migrations table exists.
 *   4. For each migration not yet recorded → runs the SQL + inserts the history row.
 *   5. Already-applied migrations are skipped (idempotent).
 *
 * SAFETY: This is the same logic Prisma uses internally, minus the advisory lock.
 * It is safe to run multiple times.
 *
 * Usage (from services/auth-service):
 *   node scripts/mark-migrations-applied.mjs
 *   npm run db:migrate-deploy
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../prisma/migrations');

// ---------------------------------------------------------------------------
// Read migration folders in chronological order (folder names are timestamps)
// ---------------------------------------------------------------------------
function readMigrations() {
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d{14}_/.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => {
      const sqlPath = path.join(MIGRATIONS_DIR, e.name, 'migration.sql');
      const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf8') : '';
      return { migrationName: e.name, sql };
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: Neither DIRECT_URL nor DATABASE_URL is set in .env');
  process.exit(1);
}

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('Connected to database.\n');

  // Ensure migration history table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id"                  VARCHAR(36)  NOT NULL PRIMARY KEY,
      "checksum"            VARCHAR(64)  NOT NULL,
      "finished_at"         TIMESTAMPTZ,
      "migration_name"      VARCHAR(255) NOT NULL,
      "logs"                TEXT,
      "rolled_back_at"      TIMESTAMPTZ,
      "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      "applied_steps_count" INTEGER      NOT NULL DEFAULT 0
    )
  `);

  const migrations = readMigrations();
  let applied = 0;
  let skipped = 0;

  for (const { migrationName, sql } of migrations) {
    // Check if already recorded
    const { rows } = await client.query(
      'SELECT id FROM "_prisma_migrations" WHERE migration_name = $1',
      [migrationName],
    );

    if (rows.length > 0) {
      console.log(`  ✓ already applied:  ${migrationName}`);
      skipped++;
      continue;
    }

    // Run the migration SQL (skip empty migration.sql files)
    if (sql.trim()) {
      await client.query(sql);
    }

    // Record in migration history
    const checksum = crypto.createHash('sha256').update(sql).digest('hex');
    await client.query(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES ($1, $2, NOW(), $3, NULL, NULL, NOW(), 1)`,
      [crypto.randomUUID(), checksum, migrationName],
    );
    console.log(`  ✔ applied:           ${migrationName}`);
    applied++;
  }

  console.log(`\n${applied} migration(s) applied, ${skipped} already up to date.`);
} catch (err) {
  console.error('\nERROR applying migrations:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
