#!/bin/sh
# ---------------------------------------------------------------------------
# start.sh — Production entrypoint for the auth-service container.
#
# Runs on every Render deploy (and every Docker container start).
# Steps:
#   1. Apply any pending Prisma migrations — idempotent, safe to run every time.
#      Uses the custom migration runner instead of `prisma migrate deploy`
#      because Render/Neon can time out on Prisma's advisory lock acquisition.
#      If migration application fails, the script exits non-zero and Render marks
#      the deploy as failed before the server ever starts.
#   2. Start the compiled Node server.
#
# Why not run migrations at build time?
#   The build image does not have network access to the live database.
#   Migrations must run at container-start time when DATABASE_URL is available.
# ---------------------------------------------------------------------------
set -e   # exit immediately on any error

echo "[start.sh] Running Prisma migrations..."
node scripts/mark-migrations-applied.mjs

echo "[start.sh] Migrations complete. Starting server..."
exec node dist/server.js
