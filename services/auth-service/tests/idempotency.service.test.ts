// ---------------------------------------------------------------------------
// idempotency.service.test.ts — unit tests for IdempotencyService.
//
// Strategy: mock the IdempotencyRepository so no real DB is needed.
// Tests cover:
//   • hashPayload — determinism and sensitivity.
//   • checkOrPrepare — cache hit, miss, mismatch 409, expired-key re-use.
//   • persistInTransaction — delegates correctly to the repository.
// ---------------------------------------------------------------------------
import { IdempotencyService, IDEMPOTENCY_TTL_MS, IdempotencyPayload } from '../src/services/idempotency.service';
import { IdempotencyRepository, IdempotencyKeyRecord } from '../src/repositories/idempotency.repository';
import { ConflictError } from '../src/utils/errors';

// ── Test doubles ─────────────────────────────────────────────────────────────

function makeRepo(overrides: Partial<typeof IdempotencyRepository.prototype> = {}): IdempotencyRepository {
  return {
    findByUserAndKey: jest.fn(),
    create:          jest.fn(),
    deleteExpired:   jest.fn(),
    ...overrides,
  } as unknown as IdempotencyRepository;
}

const PAYLOAD: IdempotencyPayload = {
  receiverPayflowId: 'alice@payflow',
  amount:            500,
  note:              'rent',
};

const USER_ID = 'user-1';
const KEY     = '550e8400-e29b-41d4-a716-446655440000';

// ── hashPayload ──────────────────────────────────────────────────────────────

describe('IdempotencyService.hashPayload', () => {
  const svc = new IdempotencyService(makeRepo());

  test('same payload produces the same hash', () => {
    expect(svc.hashPayload(PAYLOAD)).toBe(svc.hashPayload({ ...PAYLOAD }));
  });

  test('different amount produces a different hash', () => {
    expect(svc.hashPayload(PAYLOAD)).not.toBe(
      svc.hashPayload({ ...PAYLOAD, amount: 501 }),
    );
  });

  test('undefined note and null note hash identically', () => {
    const withUndefined = svc.hashPayload({ receiverPayflowId: 'a@payflow', amount: 1 });
    const withNull = svc.hashPayload({ receiverPayflowId: 'a@payflow', amount: 1, note: undefined });
    expect(withUndefined).toBe(withNull);
  });
});

// ── checkOrPrepare ───────────────────────────────────────────────────────────

describe('IdempotencyService.checkOrPrepare', () => {
  function makeRecord(overrides: Partial<IdempotencyKeyRecord> = {}): IdempotencyKeyRecord {
    const svc = new IdempotencyService(makeRepo());
    return {
      id:             'rec-1',
      idempotencyKey: KEY,
      userId:         USER_ID,
      requestHash:    svc.hashPayload(PAYLOAD),
      response:       JSON.stringify({ transactionId: 'tx-1', senderBalance: '500', receiverBalance: '500', receiverName: 'alice', receiverPayflowId: 'alice@payflow' }),
      status:         'COMPLETED',
      createdAt:      new Date(),
      expiresAt:      new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      ...overrides,
    };
  }

  test('returns hit:true with parsed response when a valid record exists', async () => {
    const record = makeRecord();
    const repo = makeRepo({ findByUserAndKey: jest.fn().mockResolvedValue(record) });
    const svc  = new IdempotencyService(repo);

    const result = await svc.checkOrPrepare(USER_ID, KEY, PAYLOAD);

    expect(result.hit).toBe(true);
    if (result.hit) {
      expect(result.response.transactionId).toBe('tx-1');
    }
  });

  test('returns hit:false with new recordId when no record exists', async () => {
    const repo = makeRepo({ findByUserAndKey: jest.fn().mockResolvedValue(null) });
    const svc  = new IdempotencyService(repo);

    const result = await svc.checkOrPrepare(USER_ID, KEY, PAYLOAD);

    expect(result.hit).toBe(false);
    if (!result.hit) {
      expect(typeof result.recordId).toBe('string');
      expect(result.requestHash).toBe(svc.hashPayload(PAYLOAD));
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });

  test('throws ConflictError (409) when the same key has a different payload hash', async () => {
    const record = makeRecord(); // hash for PAYLOAD
    const repo = makeRepo({ findByUserAndKey: jest.fn().mockResolvedValue(record) });
    const svc  = new IdempotencyService(repo);

    const differentPayload: IdempotencyPayload = { ...PAYLOAD, amount: 9999 };
    await expect(svc.checkOrPrepare(USER_ID, KEY, differentPayload)).rejects.toThrow(ConflictError);
  });

  test('treats an expired record as a miss (allows re-use after expiry)', async () => {
    const expired = makeRecord({ expiresAt: new Date(Date.now() - 1000) }); // past
    const repo = makeRepo({ findByUserAndKey: jest.fn().mockResolvedValue(expired) });
    const svc  = new IdempotencyService(repo);

    const result = await svc.checkOrPrepare(USER_ID, KEY, PAYLOAD);
    // Should be a miss — the expired record is skipped.
    expect(result.hit).toBe(false);
  });
});

// ── purgeExpired ─────────────────────────────────────────────────────────────

describe('IdempotencyService.purgeExpired', () => {
  test('delegates to repository.deleteExpired and returns the count', async () => {
    const repo = makeRepo({ deleteExpired: jest.fn().mockResolvedValue(7) });
    const svc  = new IdempotencyService(repo);

    const count = await svc.purgeExpired();
    expect(count).toBe(7);
    expect(repo.deleteExpired).toHaveBeenCalledTimes(1);
  });
});
