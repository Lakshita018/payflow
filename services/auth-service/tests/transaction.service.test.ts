// ---------------------------------------------------------------------------
// TransactionService — unit tests for getHistory() and getDashboard().
//
// Strategy
// --------
// • All repositories are fully mocked — no database.
// • Prisma is NOT imported; amounts are represented as objects with .toString().
// • Tests cover correct aggregation, serialisation, and error paths.
// ---------------------------------------------------------------------------
import { TransactionService, TransactionHistoryItem } from '../src/services/transaction.service';
import { UserRepository } from '../src/repositories/user.repository';
import { WalletRepository } from '../src/repositories/wallet.repository';
import {
  TransactionRepository,
  TransactionWithDetails,
} from '../src/repositories/transaction.repository';
import { PrismaClient } from '../src/generated/prisma/client';
import { NotFoundError } from '../src/utils/errors';

// ── Decimal test double ───────────────────────────────────────────────────────
class TestDecimal {
  constructor(private readonly v: string | number) {}
  toString(): string { return String(this.v); }
  lessThan(other: TestDecimal): boolean { return Number(this.v) < Number(other.v); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserRepo(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByPayflowId: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    clearRefreshTokenHash: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

function makeWalletRepo(): jest.Mocked<WalletRepository> {
  return {
    create: jest.fn(),
    findByUserId: jest.fn(),
    credit: jest.fn(),
    debit: jest.fn(),
  } as unknown as jest.Mocked<WalletRepository>;
}

function makeTxRepo(): jest.Mocked<TransactionRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByUser: jest.fn(),
    findByUserWithDetails: jest.fn(),
    findRecentContactIds: jest.fn(),
    sumSent: jest.fn(),
    sumReceived: jest.fn(),
    sumSentThisMonth: jest.fn(),
    sumReceivedThisMonth: jest.fn(),
    sumSentToday: jest.fn(),
    findLargest: jest.fn(),
    countByUser: jest.fn(),
  } as unknown as jest.Mocked<TransactionRepository>;
}

function makeWallet(balance = '500.00') {
  return {
    id: 'wallet-1',
    userId: 'user-1',
    balance: new TestDecimal(balance),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
}

function makeTxDetail(overrides: Partial<TransactionWithDetails> = {}): TransactionWithDetails {
  return {
    id: 'tx-1',
    amount: new TestDecimal('200.00') as never,
    status: 'COMPLETED',
    type: 'TRANSFER',
    direction: 'DEBIT',
    note: null,
    createdAt: new Date('2024-06-01'),
    senderId: 'user-1',
    receiverId: 'user-2',
    sender: { email: 'alice@example.com', payflowId: 'alice1234@payflow' },
    receiver: { email: 'bob@example.com', payflowId: 'bob5678@payflow' },
    ...overrides,
  };
}

function makeService(
  walletRepo: jest.Mocked<WalletRepository>,
  txRepo: jest.Mocked<TransactionRepository>,
): TransactionService {
  return new TransactionService(
    {} as PrismaClient,
    makeUserRepo(),
    walletRepo,
    txRepo,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// getHistory()
// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionService.getHistory()', () => {
  it('returns an empty array when user has no transactions', async () => {
    const txRepo = makeTxRepo();
    txRepo.findByUserWithDetails.mockResolvedValue([]);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getHistory('user-1');

    expect(result).toEqual([]);
    expect(txRepo.findByUserWithDetails).toHaveBeenCalledWith('user-1');
  });

  it('maps TransactionWithDetails to TransactionHistoryItem correctly', async () => {
    const txRepo = makeTxRepo();
    txRepo.findByUserWithDetails.mockResolvedValue([makeTxDetail()]);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getHistory('user-1');

    expect(result).toHaveLength(1);
    const item = result[0] as TransactionHistoryItem;
    expect(item.id).toBe('tx-1');
    expect(item.amount).toBe('200.00');
    expect(item.status).toBe('COMPLETED');
    expect(item.note).toBeNull();
    expect(item.senderPayflowId).toBe('alice1234@payflow');
    expect(item.receiverPayflowId).toBe('bob5678@payflow');
    expect(item.senderEmail).toBe('alice@example.com');
    expect(item.receiverEmail).toBe('bob@example.com');
  });

  it('returns multiple transactions in the order provided by the repository', async () => {
    const txRepo = makeTxRepo();
    const tx1 = makeTxDetail({ id: 'tx-newest' });
    const tx2 = makeTxDetail({ id: 'tx-oldest' });
    txRepo.findByUserWithDetails.mockResolvedValue([tx1, tx2]);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getHistory('user-1');

    expect(result[0]?.id).toBe('tx-newest');
    expect(result[1]?.id).toBe('tx-oldest');
  });

  it('preserves note field when present', async () => {
    const txRepo = makeTxRepo();
    txRepo.findByUserWithDetails.mockResolvedValue([makeTxDetail({ note: 'rent payment' })]);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getHistory('user-1');

    expect(result[0]?.note).toBe('rent payment');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDashboard()
// ─────────────────────────────────────────────────────────────────────────────

describe('TransactionService.getDashboard()', () => {
  // Helper: sets all new aggregate mocks to zero / null so tests only
  // need to override the fields they specifically care about.
  function setupBaseTxRepo(txRepo: jest.Mocked<TransactionRepository>) {
    txRepo.sumSent.mockResolvedValue(new TestDecimal('0') as never);
    txRepo.sumReceived.mockResolvedValue(new TestDecimal('0') as never);
    txRepo.sumSentThisMonth.mockResolvedValue(new TestDecimal('0') as never);
    txRepo.sumReceivedThisMonth.mockResolvedValue(new TestDecimal('0') as never);
    txRepo.sumSentToday.mockResolvedValue(new TestDecimal('0') as never);
    txRepo.findLargest.mockResolvedValue(null);
    txRepo.countByUser.mockResolvedValue(0);
    txRepo.findByUserWithDetails.mockResolvedValue([]);
  }

  it('auto-creates wallet and returns ₹0 balance when none exists', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(null);
    walletRepo.create.mockResolvedValue(makeWallet('0') as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);

    const service = makeService(walletRepo, txRepo);

    const result = await service.getDashboard('user-1');

    expect(walletRepo.create).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(result.balance).toBe('0');
  });

  it('returns balance, totalSent, totalReceived, recentTransactions', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(makeWallet('750.50') as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);
    txRepo.sumSent.mockResolvedValue(new TestDecimal('200.00') as never);
    txRepo.sumReceived.mockResolvedValue(new TestDecimal('950.50') as never);
    txRepo.findByUserWithDetails.mockResolvedValue([makeTxDetail()]);

    const service = makeService(walletRepo, txRepo);

    const result = await service.getDashboard('user-1');

    expect(result.balance).toBe('750.50');
    expect(result.totalSent).toBe('200.00');
    expect(result.totalReceived).toBe('950.50');
    expect(result.recentTransactions).toHaveLength(1);
  });

  it('requests only 5 recent transactions', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(makeWallet() as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);

    const service = makeService(walletRepo, txRepo);

    await service.getDashboard('user-1');

    expect(txRepo.findByUserWithDetails).toHaveBeenCalledWith('user-1', 5);
  });

  it('returns empty recentTransactions when no transactions exist', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(makeWallet('0') as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);

    const service = makeService(walletRepo, txRepo);

    const result = await service.getDashboard('user-1');

    expect(result.recentTransactions).toEqual([]);
    expect(result.balance).toBe('0');
    expect(result.totalSent).toBe('0');
    expect(result.totalReceived).toBe('0');
  });

  it('returns extended statistics fields', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(makeWallet('100') as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);
    txRepo.sumSentThisMonth.mockResolvedValue(new TestDecimal('50.00') as never);
    txRepo.sumReceivedThisMonth.mockResolvedValue(new TestDecimal('75.00') as never);
    txRepo.sumSentToday.mockResolvedValue(new TestDecimal('10.00') as never);
    txRepo.countByUser.mockResolvedValue(7);
    txRepo.findLargest.mockResolvedValue(makeTxDetail());

    const service = makeService(walletRepo, txRepo);

    const result = await service.getDashboard('user-1');

    expect(result.monthlySpending).toBe('50.00');
    expect(result.moneyReceivedThisMonth).toBe('75.00');
    expect(result.moneySentToday).toBe('10.00');
    expect(result.transactionCount).toBe(7);
    expect(result.largestTransaction).not.toBeNull();
    expect(result.largestTransaction?.id).toBe('tx-1');
  });

  it('returns largestTransaction as null when no transactions exist', async () => {
    const walletRepo = makeWalletRepo();
    walletRepo.findByUserId.mockResolvedValue(makeWallet('0') as never);

    const txRepo = makeTxRepo();
    setupBaseTxRepo(txRepo);

    const service = makeService(walletRepo, txRepo);

    const result = await service.getDashboard('user-1');

    expect(result.largestTransaction).toBeNull();
    expect(result.transactionCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getById()
// ─────────────────────────────────────────────────────────────────────────────

import { ForbiddenError } from '../src/utils/errors';

describe('TransactionService.getById()', () => {
  it('throws NotFoundError when transaction does not exist', async () => {
    const txRepo = makeTxRepo();
    txRepo.findByIdWithDetails.mockResolvedValue(null);
    const service = makeService(makeWalletRepo(), txRepo);

    await expect(service.getById('no-such-id', 'user-1')).rejects.toBeInstanceOf(NotFoundError);
    expect(txRepo.findByIdWithDetails).toHaveBeenCalledWith('no-such-id');
  });

  it('throws ForbiddenError when requesting user is neither sender nor receiver', async () => {
    const txRepo = makeTxRepo();
    txRepo.findByIdWithDetails.mockResolvedValue(makeTxDetail({
      senderId: 'user-1',
      receiverId: 'user-2',
    }));
    const service = makeService(makeWalletRepo(), txRepo);

    await expect(service.getById('tx-1', 'stranger')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns transaction when requesting user is the sender', async () => {
    const txRepo = makeTxRepo();
    const tx = makeTxDetail({ senderId: 'user-1', receiverId: 'user-2' });
    txRepo.findByIdWithDetails.mockResolvedValue(tx);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getById('tx-1', 'user-1');

    expect(result.id).toBe('tx-1');
    expect(result.senderPayflowId).toBe(tx.sender.payflowId);
    expect(result.receiverPayflowId).toBe(tx.receiver.payflowId);
  });

  it('returns transaction when requesting user is the receiver', async () => {
    const txRepo = makeTxRepo();
    const tx = makeTxDetail({ senderId: 'user-1', receiverId: 'user-2' });
    txRepo.findByIdWithDetails.mockResolvedValue(tx);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getById('tx-1', 'user-2');

    expect(result.id).toBe('tx-1');
  });

  it('response contains all required fields', async () => {
    const txRepo = makeTxRepo();
    const tx = makeTxDetail({ note: 'lunch split' });
    txRepo.findByIdWithDetails.mockResolvedValue(tx);
    const service = makeService(makeWalletRepo(), txRepo);

    const result = await service.getById('tx-1', 'user-1');

    expect(result).toMatchObject({
      id: 'tx-1',
      amount: '200.00',
      status: 'COMPLETED',
      note: 'lunch split',
      senderPayflowId: 'alice1234@payflow',
      receiverPayflowId: 'bob5678@payflow',
      senderEmail: 'alice@example.com',
      receiverEmail: 'bob@example.com',
    });
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});
