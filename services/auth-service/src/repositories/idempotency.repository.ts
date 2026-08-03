// ---------------------------------------------------------------------------
// IdempotencyRepository — database operations for the IdempotencyKey model.
//
// Rules
// -----
// • Only layer that touches prisma.idempotencyKey.*
// • No business logic — just pure CRUD + the atomic upsert used by the service.
// ---------------------------------------------------------------------------
import { PrismaClient } from '../generated/prisma/client';

export interface CreateIdempotencyKeyInput {
  id: string;
  idempotencyKey: string;
  userId: string;
  requestHash: string;
  response: string;
  expiresAt: Date;
}

export interface IdempotencyKeyRecord {
  id: string;
  idempotencyKey: string;
  userId: string;
  requestHash: string;
  response: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
}

export class IdempotencyRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Find by (userId, idempotencyKey) ─────────────────────────────────────
  async findByUserAndKey(
    userId: string,
    idempotencyKey: string,
  ): Promise<IdempotencyKeyRecord | null> {
    return this.db.idempotencyKey.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  // ── Create — inserts a new record (called inside the Prisma $transaction) ─
  async create(
    input: CreateIdempotencyKeyInput,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  ): Promise<IdempotencyKeyRecord> {
    const client = (tx ?? this.db) as PrismaClient;
    return client.idempotencyKey.create({
      data: {
        id:             input.id,
        idempotencyKey: input.idempotencyKey,
        userId:         input.userId,
        requestHash:    input.requestHash,
        response:       input.response,
        status:         'COMPLETED',
        expiresAt:      input.expiresAt,
      },
    });
  }

  // ── Purge expired keys — call from a scheduled job ───────────────────────
  async deleteExpired(): Promise<number> {
    const result = await this.db.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
