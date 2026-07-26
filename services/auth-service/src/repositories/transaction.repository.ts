// ---------------------------------------------------------------------------
// TransactionRepository — database operations for the Transaction model.
//
// Rules
// -----
// • Only layer that touches prisma.transaction.*
// • No business logic — no balance checks, no validation.
// ---------------------------------------------------------------------------
import { PrismaClient, Prisma, Transaction } from '../generated/prisma/client';

export interface CreateTransactionInput {
  senderId: string;
  receiverId: string;
  amount: Prisma.Decimal;
  /** PENDING | COMPLETED | FAILED */
  status: string;
  /** ADD_MONEY | TRANSFER */
  type: string;
  /** CREDIT | DEBIT */
  direction: string;
  note?: string | null;
}

// ---------------------------------------------------------------------------
// Shape returned by findByUserWithDetails — includes related user fields for
// the history and dashboard endpoints. Defined here so the service layer can
// use it without importing Prisma types directly.
// ---------------------------------------------------------------------------
export interface TransactionWithDetails {
  id: string;
  amount: Prisma.Decimal;
  status: string;
  type: string;
  direction: string;
  note: string | null;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  sender: { email: string; payflowId: string };
  receiver: { email: string; payflowId: string };
}

export class TransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────
  async create(
    input: CreateTransactionInput,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  ): Promise<Transaction> {
    const client = (tx ?? this.db) as PrismaClient;
    return client.transaction.create({
      data: {
        senderId: input.senderId,
        receiverId: input.receiverId,
        amount: input.amount,
        status: input.status,
        type: input.type,
        direction: input.direction,
        note: input.note ?? null,
      },
    });
  }

  // ── Read ──────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Transaction | null> {
    return this.db.transaction.findUnique({ where: { id } });
  }

  // Returns a single transaction with full sender/receiver details.
  // Used by getById in the service layer.
  findByIdWithDetails(id: string): Promise<TransactionWithDetails | null> {
    return this.db.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        direction: true,
        note: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { email: true, payflowId: true } },
        receiver: { select: { email: true, payflowId: true } },
      },
    });
  }

  findByUser(userId: string): Promise<Transaction[]> {
    return this.db.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Returns transactions with related sender/receiver user fields.
  // Used by history and dashboard endpoints.
  // For TRANSFER rows each transfer produces two records (DEBIT for sender,
  // CREDIT for receiver).  We only show each user the record that belongs to
  // them: DEBIT rows are shown to the sender, CREDIT rows to the receiver.
  // ADD_MONEY rows (type = 'ADD_MONEY', direction = 'CREDIT') always belong
  // to the user who added money (senderId = receiverId = that user).
  findByUserWithDetails(
    userId: string,
    limit?: number,
  ): Promise<TransactionWithDetails[]> {
    return this.db.transaction.findMany({
      where: {
        OR: [
          // ADD_MONEY: sender = receiver = the user
          { senderId: userId, type: 'ADD_MONEY' },
          // TRANSFER DEBIT  → shown to sender
          { senderId: userId, type: 'TRANSFER', direction: 'DEBIT' },
          // TRANSFER CREDIT → shown to receiver
          { receiverId: userId, type: 'TRANSFER', direction: 'CREDIT' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      ...(limit !== undefined ? { take: limit } : {}),
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        direction: true,
        note: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { email: true, payflowId: true } },
        receiver: { select: { email: true, payflowId: true } },
      },
    });
  }

  // Returns total amount sent by userId (TRANSFER DEBIT, COMPLETED only).
  async sumSent(userId: string): Promise<Prisma.Decimal> {
    const result = await this.db.transaction.aggregate({
      where: { senderId: userId, status: 'COMPLETED', type: 'TRANSFER', direction: 'DEBIT' },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns total amount received by userId (TRANSFER CREDIT + ADD_MONEY CREDIT, COMPLETED).
  async sumReceived(userId: string): Promise<Prisma.Decimal> {
    const result = await this.db.transaction.aggregate({
      where: {
        receiverId: userId,
        status: 'COMPLETED',
        direction: 'CREDIT',
      },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns sum sent in the current calendar month.
  async sumSentThisMonth(userId: string): Promise<Prisma.Decimal> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await this.db.transaction.aggregate({
      where: { senderId: userId, status: 'COMPLETED', type: 'TRANSFER', direction: 'DEBIT', createdAt: { gte: start } },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns sum received in the current calendar month (transfers + top-ups).
  async sumReceivedThisMonth(userId: string): Promise<Prisma.Decimal> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await this.db.transaction.aggregate({
      where: { receiverId: userId, status: 'COMPLETED', direction: 'CREDIT', createdAt: { gte: start } },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns sum sent today (since midnight local time).
  async sumSentToday(userId: string): Promise<Prisma.Decimal> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = await this.db.transaction.aggregate({
      where: { senderId: userId, status: 'COMPLETED', type: 'TRANSFER', direction: 'DEBIT', createdAt: { gte: start } },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns the single largest COMPLETED transaction involving userId
  // (one record per side — picks whichever is largest for this user).
  async findLargest(userId: string): Promise<TransactionWithDetails | null> {
    const rows = await this.db.transaction.findMany({
      where: {
        OR: [
          { senderId: userId, type: 'ADD_MONEY' },
          { senderId: userId, type: 'TRANSFER', direction: 'DEBIT' },
          { receiverId: userId, type: 'TRANSFER', direction: 'CREDIT' },
        ],
        status: 'COMPLETED',
      },
      orderBy: { amount: 'desc' },
      take: 1,
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        direction: true,
        note: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { email: true, payflowId: true } },
        receiver: { select: { email: true, payflowId: true } },
      },
    });
    return rows[0] ?? null;
  }

  // Returns total count of transactions visible to userId
  // (one record per operation per user — avoids double-counting transfers).
  async countByUser(userId: string): Promise<number> {
    return this.db.transaction.count({
      where: {
        OR: [
          { senderId: userId, type: 'ADD_MONEY' },
          { senderId: userId, type: 'TRANSFER', direction: 'DEBIT' },
          { receiverId: userId, type: 'TRANSFER', direction: 'CREDIT' },
        ],
      },
    });
  }

  // Returns the distinct user IDs that have interacted with userId, along with
  // the most recent interaction timestamp and the interaction count.
  // Used to power the Recent Contacts endpoint.
  async findRecentContactIds(
    userId: string,
    limit: number,
  ): Promise<{ contactId: string; lastInteractionAt: Date; transactionCount: number }[]> {
    // Only TRANSFER rows have a distinct counterparty. ADD_MONEY rows are
    // self-referential (senderId = receiverId) so we exclude them here.
    const rows = await this.db.transaction.findMany({
      where: {
        OR: [
          { senderId: userId, type: 'TRANSFER', direction: 'DEBIT' },
          { receiverId: userId, type: 'TRANSFER', direction: 'CREDIT' },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, receiverId: true, createdAt: true },
    });

    // Build a map: contactId → { lastInteractionAt, count }
    const map = new Map<string, { lastInteractionAt: Date; transactionCount: number }>();
    for (const row of rows) {
      const contactId = row.senderId === userId ? row.receiverId : row.senderId;
      const existing = map.get(contactId);
      if (existing === undefined) {
        map.set(contactId, { lastInteractionAt: row.createdAt, transactionCount: 1 });
      } else {
        existing.transactionCount += 1;
        // rows are already newest-first so the first occurrence is the most recent
      }
    }

    return [...map.entries()]
      .slice(0, limit)
      .map(([contactId, data]) => ({ contactId, ...data }));
  }
}
