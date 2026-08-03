// ---------------------------------------------------------------------------
// IdempotencyService — production-grade idempotency for money transfers.
//
// Design
// ------
// • The client generates a UUID per transfer attempt (Idempotency-Key header).
// • The backend stores (userId, idempotencyKey, requestHash, response) once
//   the transfer succeeds.
// • On any retry the service:
//     1. Looks up the existing record.
//     2. Compares requestHash — throws 409 ConflictError on mismatch.
//     3. Returns the cached response unchanged (no second transfer).
// • The idempotency record and the transfer itself are committed atomically
//   inside the same Prisma $transaction block.
// • Keys expire after IDEMPOTENCY_TTL_MS (default 24 h); a scheduled purge
//   removes them.
//
// requestHash = SHA-256( JSON.stringify({ receiverPayflowId, amount, note }) )
// — the canonical, sorted serialisation so field-order does not matter.
// ---------------------------------------------------------------------------
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { IdempotencyRepository } from '../repositories/idempotency.repository';
import { ConflictError } from '../utils/errors';
import { TransferResult } from './transaction.service';
import type { PrismaClient } from '../generated/prisma/client';

/** 24 hours in milliseconds — default TTL for idempotency keys. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Canonical payload hashed to produce requestHash. */
export interface IdempotencyPayload {
  receiverPayflowId: string;
  amount: number;
  note?: string | undefined;
}

/** Result of checkOrReserve — either a cached response or a new record id. */
export type IdempotencyCheckResult =
  | { hit: true; response: TransferResult }
  | { hit: false; recordId: string; requestHash: string; expiresAt: Date };

// ---------------------------------------------------------------------------
// IdempotencyService
// ---------------------------------------------------------------------------
export class IdempotencyService {
  constructor(
    private readonly idempotencyRepository: IdempotencyRepository,
  ) {}

  // ── Hash a canonical payload ───────────────────────────────────────────────
  hashPayload(payload: IdempotencyPayload): string {
    // Deterministic serialisation: sort keys so field-order never matters.
    const canonical = JSON.stringify({
      receiverPayflowId: payload.receiverPayflowId,
      amount:            payload.amount,
      note:              payload.note ?? null,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  // ── Check for an existing key or prepare a new record id ─────────────────
  // Returns { hit: true, response } if a valid cached record exists.
  // Returns { hit: false, recordId, requestHash, expiresAt } if we should proceed.
  // Throws ConflictError (409) if the key exists but the payload differs.
  async checkOrPrepare(
    userId: string,
    idempotencyKey: string,
    payload: IdempotencyPayload,
  ): Promise<IdempotencyCheckResult> {
    const incomingHash = this.hashPayload(payload);
    const existing = await this.idempotencyRepository.findByUserAndKey(userId, idempotencyKey);

    if (existing !== null) {
      // Key expired — treat as if it doesn't exist (allow re-use).
      if (existing.expiresAt < new Date()) {
        // Fall through to generate a fresh record id below.
      } else if (existing.requestHash !== incomingHash) {
        // Same key, different payload → 409 Conflict.
        throw new ConflictError(
          'Idempotency key already used with a different request payload. ' +
          'Use a new key for a different transfer.',
        );
      } else {
        // Cache hit — return the original response.
        return {
          hit: true,
          response: JSON.parse(existing.response) as TransferResult,
        };
      }
    }

    // New key (or expired) — prepare ids for the atomic write.
    return {
      hit:         false,
      recordId:    randomUUID(),
      requestHash: incomingHash,
      expiresAt:   new Date(Date.now() + IDEMPOTENCY_TTL_MS),
    };
  }

  // ── Persist the idempotency record inside a Prisma $transaction ──────────
  // The caller passes the tx client so the write is part of the same
  // atomic block as the money-transfer writes.
  async persistInTransaction(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    recordId: string,
    userId: string,
    idempotencyKey: string,
    requestHash: string,
    response: TransferResult,
    expiresAt: Date,
  ): Promise<void> {
    await this.idempotencyRepository.create(
      {
        id:             recordId,
        idempotencyKey,
        userId,
        requestHash,
        response:       JSON.stringify(response),
        expiresAt,
      },
      tx,
    );
  }

  // ── Purge expired keys ────────────────────────────────────────────────────
  async purgeExpired(): Promise<number> {
    return this.idempotencyRepository.deleteExpired();
  }
}
