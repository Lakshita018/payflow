// ---------------------------------------------------------------------------
// purge-idempotency-keys.ts — scheduled cleanup script for expired keys.
//
// Run this on a schedule (e.g. cron, Render cron job) to keep the
// idempotency_keys table from growing unbounded.
//
// Usage (standalone):
//   npx tsx src/scripts/purge-idempotency-keys.ts
//
// Or import and call purgeExpiredIdempotencyKeys() from a server-side scheduler.
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { IdempotencyRepository } from '../repositories/idempotency.repository';

export async function purgeExpiredIdempotencyKeys(): Promise<void> {
  const repo = new IdempotencyRepository(prisma);
  const count = await repo.deleteExpired();
  logger.info({ count }, 'Purged expired idempotency keys');
}

// Run directly if invoked as a script.
if (require.main === module) {
  void purgeExpiredIdempotencyKeys()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Failed to purge idempotency keys');
      process.exit(1);
    });
}
