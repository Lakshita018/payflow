// ---------------------------------------------------------------------------
// PaymentRequestRepository — database operations for the PaymentRequest model.
//
// Rules
// -----
// • Only layer that touches prisma.paymentRequest.*
// • No business logic — no balance checks, no validation.
// ---------------------------------------------------------------------------
import { PrismaClient, Prisma } from '../generated/prisma/client';

// ---------------------------------------------------------------------------
// Shape returned by findWithDetails — includes requester/receiver user fields.
// ---------------------------------------------------------------------------
export interface PaymentRequestWithDetails {
  id: string;
  requesterId: string;
  receiverId: string;
  amount: Prisma.Decimal;
  note: string | null;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  requester: { id: string; payflowId: string; email: string; displayName: string | null };
  receiver:  { id: string; payflowId: string; email: string; displayName: string | null };
}

export interface CreatePaymentRequestInput {
  requesterId: string;
  receiverId: string;
  amount: Prisma.Decimal;
  note?: string | null;
  expiresAt?: Date | null;
}

export class PaymentRequestRepository {
  constructor(private readonly db: PrismaClient) {}

  private readonly detailsSelect = {
    id: true,
    requesterId: true,
    receiverId: true,
    amount: true,
    note: true,
    status: true,
    expiresAt: true,
    createdAt: true,
    updatedAt: true,
    requester: { select: { id: true, payflowId: true, email: true, displayName: true } },
    receiver:  { select: { id: true, payflowId: true, email: true, displayName: true } },
  } as const;

  // ── Create ────────────────────────────────────────────────────────────────
  async create(input: CreatePaymentRequestInput): Promise<PaymentRequestWithDetails> {
    return this.db.paymentRequest.create({
      data: {
        requesterId: input.requesterId,
        receiverId:  input.receiverId,
        amount:      input.amount,
        note:        input.note ?? null,
        expiresAt:   input.expiresAt ?? null,
        status:      'PENDING',
      },
      select: this.detailsSelect,
    });
  }

  // ── Find by id with full details ──────────────────────────────────────────
  async findByIdWithDetails(id: string): Promise<PaymentRequestWithDetails | null> {
    return this.db.paymentRequest.findUnique({
      where:  { id },
      select: this.detailsSelect,
    });
  }

  // ── Incoming requests for a user (newest first) ───────────────────────────
  async findIncoming(userId: string): Promise<PaymentRequestWithDetails[]> {
    return this.db.paymentRequest.findMany({
      where:   { receiverId: userId },
      orderBy: { createdAt: 'desc' },
      select:  this.detailsSelect,
    });
  }

  // ── Outgoing requests by a user (newest first) ────────────────────────────
  async findOutgoing(userId: string): Promise<PaymentRequestWithDetails[]> {
    return this.db.paymentRequest.findMany({
      where:   { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      select:  this.detailsSelect,
    });
  }

  // ── Update status ─────────────────────────────────────────────────────────
  async updateStatus(
    id: string,
    status: string,
    tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  ): Promise<PaymentRequestWithDetails> {
    const client = (tx ?? this.db) as PrismaClient;
    return client.paymentRequest.update({
      where:  { id },
      data:   { status },
      select: this.detailsSelect,
    });
  }

  // ── Cancel by requester (sets status to CANCELLED) ────────────────────────
  async cancel(id: string): Promise<PaymentRequestWithDetails> {
    return this.db.paymentRequest.update({
      where:  { id },
      data:   { status: 'CANCELLED' },
      select: this.detailsSelect,
    });
  }
}
