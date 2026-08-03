-- CreateTable: idempotency_keys
-- Stores one record per (userId, idempotencyKey) pair.
-- The unique constraint on (userId, idempotencyKey) is the idempotency fence.
-- requestHash lets us detect mismatched payloads (→ 409).
-- response stores the original JSON response so we can replay it.
-- expiresAt enables server-side cleanup of old keys (default 24 h).
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
    "id"             TEXT         NOT NULL,
    "idempotencyKey" TEXT         NOT NULL,
    "userId"         TEXT         NOT NULL,
    "requestHash"    TEXT         NOT NULL,
    "response"       TEXT         NOT NULL,
    "status"         TEXT         NOT NULL DEFAULT 'COMPLETED',
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- Unique fence: one key per user
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_userId_idempotencyKey_key"
    ON "idempotency_keys"("userId", "idempotencyKey");

-- Fast lookup by expiry for cleanup jobs
CREATE INDEX IF NOT EXISTS "idempotency_keys_expiresAt_idx"
    ON "idempotency_keys"("expiresAt");

-- Foreign key to users (cascade delete when user is removed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_userId_fkey'
  ) THEN
    ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
