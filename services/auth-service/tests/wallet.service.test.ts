// ---------------------------------------------------------------------------
// WalletService unit tests
//
// Strategy: WalletRepository fully mocked — no DB, no Prisma.
//
// Prisma.Decimal cannot be imported directly in Jest because the Prisma 7
// generated client imports from '@prisma/client/runtime/client' which is an
// ESM-only path not resolvable by Jest's CJS resolver.
//
// Instead, we use a lightweight test double that satisfies the interface
// WalletService cares about: the Decimal returned by findByUserId needs
// .lessThan() and .toString(). The actual Decimal class used in production
// comes from the Prisma runtime — this double mirrors its behaviour exactly
// for the numeric scenarios tested here.
// ---------------------------------------------------------------------------
import { WalletService } from '../src/services/wallet.service';
import { WalletRepository } from '../src/repositories/wallet.repository';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '../src/utils/errors';
import { ZodError } from 'zod';

// ── Decimal test double ───────────────────────────────────────────────────────
// Matches the subset of the Prisma Decimal API used in WalletService:
//   .lessThan(other)   — used by the debit insufficient-balance guard
//   .toString()        — used by toResult() serialisation
class TestDecimal {
  private readonly value: number;
  constructor(v: string | number) {
    this.value = Number(v);
  }
  lessThan(other: TestDecimal): boolean {
    return this.value < other.value;
  }
  toString(): string {
    // Match Prisma Decimal.toString() — drops trailing zeros.
    return String(this.value);
  }
  // Expose for Jest assertions
  get d(): number[] { return [this.value]; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRepo(): jest.Mocked<WalletRepository> {
  return {
    create: jest.fn(),
    findByUserId: jest.fn(),
    credit: jest.fn(),
    debit: jest.fn(),
  } as unknown as jest.Mocked<WalletRepository>;
}

function makeWallet(balance = '100.00', userId = 'user-1'): {
  id: string;
  userId: string;
  balance: TestDecimal;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'wallet-uuid-1',
    userId,
    balance: new TestDecimal(balance),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createWallet
// ─────────────────────────────────────────────────────────────────────────────

describe('WalletService.createWallet()', () => {
  let repo: jest.Mocked<WalletRepository>;
  let service: WalletService;

  beforeEach(() => {
    repo = makeRepo();
    service = new WalletService(repo);
  });

  it('creates a wallet and returns result with balance as string', async () => {
    repo.findByUserId.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeWallet('0') as never);

    const result = await service.createWallet('user-1');

    expect(repo.findByUserId).toHaveBeenCalledWith('user-1');
    expect(repo.create).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result.balance).toBe('0');
  });

  it('serialises balance as a string (not an object)', async () => {
    repo.findByUserId.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeWallet('0') as never);

    const result = await service.createWallet('user-1');

    expect(typeof result.balance).toBe('string');
  });

  it('throws ConflictError when wallet already exists', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.createWallet('user-1')).rejects.toBeInstanceOf(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getBalance
// ─────────────────────────────────────────────────────────────────────────────

describe('WalletService.getBalance()', () => {
  let repo: jest.Mocked<WalletRepository>;
  let service: WalletService;

  beforeEach(() => {
    repo = makeRepo();
    service = new WalletService(repo);
  });

  it('returns wallet data with balance as string', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('250.5') as never);

    const result = await service.getBalance('user-1');

    expect(result.balance).toBe('250.5');
    expect(result.userId).toBe('user-1');
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    repo.findByUserId.mockResolvedValue(null);

    await expect(service.getBalance('ghost')).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// credit
// ─────────────────────────────────────────────────────────────────────────────

describe('WalletService.credit()', () => {
  let repo: jest.Mocked<WalletRepository>;
  let service: WalletService;

  beforeEach(() => {
    repo = makeRepo();
    service = new WalletService(repo);
  });

  it('credits the wallet and returns updated balance', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('100.00') as never);
    repo.credit.mockResolvedValue(makeWallet('150.00') as never);

    const result = await service.credit('user-1', 50);

    expect(repo.credit).toHaveBeenCalledWith('user-1', expect.anything());
    expect(result.balance).toBe('150');
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    repo.findByUserId.mockResolvedValue(null);

    await expect(service.credit('ghost', 10)).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.credit).not.toHaveBeenCalled();
  });

  it('throws ZodError for zero amount', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.credit('user-1', 0)).rejects.toBeInstanceOf(ZodError);
  });

  it('throws ZodError for negative amount', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.credit('user-1', -5)).rejects.toBeInstanceOf(ZodError);
  });

  it('throws ZodError for more than 2 decimal places', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.credit('user-1', 10.001)).rejects.toBeInstanceOf(ZodError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// debit
// ─────────────────────────────────────────────────────────────────────────────

describe('WalletService.debit()', () => {
  let repo: jest.Mocked<WalletRepository>;
  let service: WalletService;

  beforeEach(() => {
    repo = makeRepo();
    service = new WalletService(repo);
  });

  it('debits the wallet and returns updated balance', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('200.00') as never);
    repo.debit.mockResolvedValue(makeWallet('150.00') as never);

    const result = await service.debit('user-1', 50);

    expect(repo.debit).toHaveBeenCalledWith('user-1', expect.anything());
    expect(result.balance).toBe('150');
  });

  it('allows exact-balance debit (boundary: balance === amount)', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('50.00') as never);
    repo.debit.mockResolvedValue(makeWallet('0') as never);

    const result = await service.debit('user-1', 50);

    expect(repo.debit).toHaveBeenCalled();
    expect(result.balance).toBe('0');
  });

  it('throws UnprocessableEntityError when balance is insufficient', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('30.00') as never);

    await expect(service.debit('user-1', 50)).rejects.toBeInstanceOf(UnprocessableEntityError);
    expect(repo.debit).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityError when balance is exactly zero', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet('0.00') as never);

    await expect(service.debit('user-1', 0.01)).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it('throws NotFoundError when wallet does not exist', async () => {
    repo.findByUserId.mockResolvedValue(null);

    await expect(service.debit('ghost', 10)).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.debit).not.toHaveBeenCalled();
  });

  it('throws ZodError for zero amount', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.debit('user-1', 0)).rejects.toBeInstanceOf(ZodError);
  });

  it('throws ZodError for negative amount', async () => {
    repo.findByUserId.mockResolvedValue(makeWallet() as never);

    await expect(service.debit('user-1', -10)).rejects.toBeInstanceOf(ZodError);
  });
});
