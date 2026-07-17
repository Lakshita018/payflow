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
  status: string;
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
  findByUserWithDetails(
    userId: string,
    limit?: number,
  ): Promise<TransactionWithDetails[]> {
    return this.db.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      ...(limit !== undefined ? { take: limit } : {}),
      select: {
        id: true,
        amount: true,
        status: true,
        note: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        sender: { select: { email: true, payflowId: true } },
        receiver: { select: { email: true, payflowId: true } },
      },
    });
  }

  // Returns total sum of amounts for transactions where userId is the sender.
  // Used by dashboard aggregate.
  async sumSent(userId: string): Promise<Prisma.Decimal> {
    const result = await this.db.transaction.aggregate({
      where: { senderId: userId, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns total sum of amounts for transactions where userId is the receiver.
  async sumReceived(userId: string): Promise<Prisma.Decimal> {
    const result = await this.db.transaction.aggregate({
      where: { receiverId: userId, status: 'COMPLETED' },
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
      where: { senderId: userId, status: 'COMPLETED', createdAt: { gte: start } },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns sum received in the current calendar month.
  async sumReceivedThisMonth(userId: string): Promise<Prisma.Decimal> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const result = await this.db.transaction.aggregate({
      where: { receiverId: userId, status: 'COMPLETED', createdAt: { gte: start } },
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
      where: { senderId: userId, status: 'COMPLETED', createdAt: { gte: start } },
      _sum: { amount: true },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return result._sum.amount ?? new Prisma.Decimal(0);
  }

  // Returns the single largest transaction (by amount) involving userId.
  async findLargest(userId: string): Promise<TransactionWithDetails | null> {
    const rows = await this.db.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: 'COMPLETED',
      },
      orderBy: { amount: 'desc' },
      take: 1,
      select: {
        id: true,
        amount: true,
        status: true,
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

  // Returns total count of transactions involving userId.
  async countByUser(userId: string): Promise<number> {
    return this.db.transaction.count({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
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
    // Fetch all transactions involving the user (newest first).
    // We need to de-duplicate contacts client-side because Prisma does not
    // support GROUP BY in findMany. The list is bounded by limit * 10 to avoid
    // pulling the entire table while still allowing enough data to find `limit`
    // unique contacts.
    const rows = await this.db.transaction.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
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
