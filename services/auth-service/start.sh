#!/bin/sh
# ---------------------------------------------------------------------------
# start.sh — Production entrypoint for the auth-service container.
#
# Runs on every Render deploy (and every Docker container start).
# Steps:
#   1. Apply any pending Prisma migrations — idempotent, safe to run every time.
#      If the migration fails (e.g. bad DATABASE_URL), the script exits non-zero
#      and Render marks the deploy as failed before the server ever starts,
#      preventing a broken schema from serving traffic.
#   2. Start the compiled Node server.
#
# Why not run migrations at build time?
#   The build image does not have network access to the live database.
#   Migrations must run at container-start time when DATABASE_URL is available.
# ---------------------------------------------------------------------------
set -e   # exit immediately on any error

echo "[start.sh] Running Prisma migrations..."
npx prisma migrate deploy

echo "[start.sh] Migrations complete. Starting server..."
exec node dist/server.js
