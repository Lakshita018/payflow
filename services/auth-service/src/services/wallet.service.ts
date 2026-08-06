// ---------------------------------------------------------------------------
// WalletService — business logic for wallet operations.
//
// Layer contract
// --------------
// • All DB access goes through repositories — never touches Prisma directly.
// • Returns plain output objects; throws typed AppError subclasses.
// • No Express types, no req/res.
// ---------------------------------------------------------------------------
import { Prisma } from '../generated/prisma/client';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { NotificationService, NotificationType } from './notification.service';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '../utils/errors';
import { creditSchema, debitSchema } from '../validators/wallet.validator';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface WalletResult {
  id: string;
  userId: string;
  balance: string;   // serialised as string to avoid JSON precision loss
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// WalletService
// ---------------------------------------------------------------------------
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository?: TransactionRepository,
    private readonly notificationService?: NotificationService,
  ) {}

  // ── Serialise ─────────────────────────────────────────────────────────────
  // Convert the Prisma Decimal to a string before leaving the service layer.
  // JSON.stringify(Decimal) drops precision; toString() preserves it exactly.
  private toResult(wallet: {
    id: string;
    userId: string;
    balance: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }): WalletResult {
    return {
      id: wallet.id,
      userId: wallet.userId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      balance: wallet.balance.toString(),
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  // ── Create wallet ─────────────────────────────────────────────────────────
  async createWallet(userId: string): Promise<WalletResult> {
    const existing = await this.walletRepository.findByUserId(userId);
    if (existing !== null) {
      throw new ConflictError('Wallet already exists for this user');
    }
    const wallet = await this.walletRepository.create({ userId });
    return this.toResult(wallet);
  }

  // ── Get balance ───────────────────────────────────────────────────────────
  // Auto-creates a wallet (₹0) for users who registered before wallet
  // auto-creation was added, so legacy accounts are never broken.
  async getBalance(userId: string): Promise<WalletResult> {
    let wallet = await this.walletRepository.findByUserId(userId);
    if (wallet === null) {
      wallet = await this.walletRepository.create({ userId });
    }
    return this.toResult(wallet);
  }

  // ── Credit ────────────────────────────────────────────────────────────────
  async credit(userId: string, amount: number): Promise<WalletResult> {
    const { amount: validated } = creditSchema.parse({ amount });

    let wallet = await this.walletRepository.findByUserId(userId);
    if (wallet === null) {
      // Auto-create wallet for legacy users who registered before auto-creation
      wallet = await this.walletRepository.create({ userId });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const decimal = new Prisma.Decimal(validated);
    const updated = await this.walletRepository.credit(userId, decimal);

    let topUpTransactionId: string | undefined;

    // Record an ADD_MONEY transaction (sender = receiver = userId, CREDIT direction)
    if (this.transactionRepository) {
      const topUpTransaction = await this.transactionRepository.create({
        senderId: userId,
        receiverId: userId,
        amount: decimal,
        status: 'COMPLETED',
        type: 'ADD_MONEY',
        direction: 'CREDIT',
        note: 'Added to wallet',
      });
      topUpTransactionId = topUpTransaction.id;
    }

    // Fire-and-forget wallet top-up notification (via NotificationService so SSE push fires)
    if (this.notificationService) {
      const input = topUpTransactionId !== undefined
        ? { userId, type: NotificationType.WALLET_TOPPED_UP, title: 'Wallet Topped Up', body: `₹${validated.toFixed(2)} has been added to your PayFlow wallet.`, refId: topUpTransactionId }
        : { userId, type: NotificationType.WALLET_TOPPED_UP, title: 'Wallet Topped Up', body: `₹${validated.toFixed(2)} has been added to your PayFlow wallet.` };
      void this.notificationService.create(input);
    }

    return this.toResult(updated);
  }

  // ── Debit ─────────────────────────────────────────────────────────────────
  async debit(userId: string, amount: number): Promise<WalletResult> {
    const { amount: validated } = debitSchema.parse({ amount });

    const wallet = await this.walletRepository.findByUserId(userId);
    if (wallet === null) {
      throw new NotFoundError('Wallet not found');
    }

    // Insufficient-balance guard — checked before the DB write so the error is
    // a clean 422 rather than a DB constraint violation or a negative balance.
    // Both sides are constructed as Prisma.Decimal so the comparison is
    // type-homogeneous: avoids a TypeError when wallet.balance is a test double
    // whose .lessThan() cannot introspect a real Decimal's internal structure.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const decimal = new Prisma.Decimal(validated);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const balance = new Prisma.Decimal(wallet.balance.toString());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (balance.lessThan(decimal)) {
      throw new UnprocessableEntityError('Insufficient balance');
    }

    const updated = await this.walletRepository.debit(userId, decimal);
    return this.toResult(updated);
  }
}
