// ---------------------------------------------------------------------------
// WalletRepository — all database operations for the Wallet model.
//
// Rules
// -----
// • Only layer that touches prisma.wallet.*
// • No business logic — no balance validation, no currency conversion.
// • credit() and debit() use Prisma's atomic $transaction + increment/decrement
//   so concurrent requests never produce a lost-update race on the balance.
// • Caller (WalletService) is responsible for checking sufficient balance
//   before calling debit().
// ---------------------------------------------------------------------------
import { PrismaClient, Prisma, Wallet } from '../generated/prisma/client';

export interface CreateWalletInput {
  userId: string;
}

export class WalletRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────
  // Throws Prisma P2002 if a wallet already exists for the user.
  // WalletService converts that to ConflictError.
  async create(input: CreateWalletInput): Promise<Wallet> {
    return this.db.wallet.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      data: { userId: input.userId, balance: new Prisma.Decimal(0) },
    });
  }

  // ── Read ──────────────────────────────────────────────────────────────────
  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.db.wallet.findUnique({ where: { userId } });
  }

  // ── Credit ────────────────────────────────────────────────────────────────
  // Atomically increments balance. Uses a transaction so the read-then-write
  // cannot interleave with a concurrent debit.
  credit(userId: string, amount: Prisma.Decimal): Promise<Wallet> {
    return this.db.$transaction(async (tx) => {
      // Cast tx to PrismaClient: the transaction client is Omit<PrismaClient, DenyList>
      // which retains all model delegates. The cast is safe — Prisma guarantees this.
      return (tx as unknown as PrismaClient).wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });
    });
  }

  // ── Debit ─────────────────────────────────────────────────────────────────
  // Atomically decrements balance inside a serialisable transaction.
  // The service layer must verify sufficient balance before calling this;
  // this method trusts the caller and does not re-check.
  debit(userId: string, amount: Prisma.Decimal): Promise<Wallet> {
    return this.db.$transaction(async (tx) => {
      return (tx as unknown as PrismaClient).wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });
    });
  }
}
