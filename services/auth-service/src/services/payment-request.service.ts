// ---------------------------------------------------------------------------
// PaymentRequestService — business logic for the Request Money feature.
//
// Layer contract
// --------------
// • All DB access goes through repositories — never touches Prisma directly
//   except for the atomic $transaction block in acceptRequest().
// • Returns plain output objects; throws typed AppError subclasses.
// • No Express types, no req/res.
// ---------------------------------------------------------------------------
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { PaymentRequestRepository, PaymentRequestWithDetails } from '../repositories/payment-request.repository';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from './notification.service';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
} from '../utils/errors';
import { createPaymentRequestSchema } from '../validators/payment-request.validator';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------
export interface PaymentRequestItem {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterPayflowId: string;
  requesterDisplayName: string;
  requesterEmail: string;
  receiverPayflowId: string;
  receiverDisplayName: string;
  receiverEmail: string;
  amount: string;
  note: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequestInput {
  requesterUserId: string;
  receiverPayflowId: string;
  amount: number;
  note?: string | undefined;
  expiresInHours?: number | undefined;
}

export interface AcceptPaymentRequestResult {
  requestId: string;
  transactionId: string;
  newReceiverBalance: string;
}

// ---------------------------------------------------------------------------
// PaymentRequestService
// ---------------------------------------------------------------------------
export class PaymentRequestService {
  constructor(
    private readonly db: PrismaClient,
    private readonly paymentRequestRepository: PaymentRequestRepository,
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly notificationRepository?: NotificationRepository,
  ) {}

  // ── Internal helper ───────────────────────────────────────────────────────
  private notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    refId?: string,
  ): void {
    if (!this.notificationRepository) return;
    const input = refId !== undefined
      ? { userId, type, title, body, refId }
      : { userId, type, title, body };
    void this.notificationRepository.create(input);
  }

  private toItem(pr: PaymentRequestWithDetails): PaymentRequestItem {
    const requesterName =
      pr.requester.displayName ?? pr.requester.payflowId.split('@')[0] ?? pr.requester.payflowId;
    const receiverName =
      pr.receiver.displayName ?? pr.receiver.payflowId.split('@')[0] ?? pr.receiver.payflowId;

    return {
      id:                   pr.id,
      requesterId:          pr.requesterId,
      receiverId:           pr.receiverId,
      requesterPayflowId:   pr.requester.payflowId,
      requesterDisplayName: requesterName,
      requesterEmail:       pr.requester.email,
      receiverPayflowId:    pr.receiver.payflowId,
      receiverDisplayName:  receiverName,
      receiverEmail:        pr.receiver.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      amount:    pr.amount.toString(),
      note:      pr.note,
      status:    pr.status,
      expiresAt: pr.expiresAt?.toISOString() ?? null,
      createdAt: pr.createdAt.toISOString(),
      updatedAt: pr.updatedAt.toISOString(),
    };
  }

  // ── Helper: check if a request is expired ────────────────────────────────
  private isExpired(pr: PaymentRequestWithDetails): boolean {
    if (pr.expiresAt === null) return false;
    return pr.expiresAt < new Date();
  }

  // ── Create a payment request ──────────────────────────────────────────────
  async createRequest(input: CreatePaymentRequestInput): Promise<PaymentRequestItem> {
    const { receiverPayflowId, amount, note, expiresInHours } = createPaymentRequestSchema.parse({
      receiverPayflowId: input.receiverPayflowId,
      amount: input.amount,
      note: input.note,
      expiresInHours: input.expiresInHours,
    });

    // 1. Find requester
    const requester = await this.userRepository.findById(input.requesterUserId);
    if (requester === null) throw new NotFoundError('Requester not found');

    // 2. Find receiver by payflowId
    const receiver = await this.userRepository.findByPayflowId(receiverPayflowId);
    if (receiver === null) throw new NotFoundError(`No user found with PayFlow ID: ${receiverPayflowId}`);

    // 3. Reject self-request
    if (requester.id === receiver.id) {
      throw new ConflictError('Cannot request money from yourself');
    }

    // 4. Compute optional expiry
    let expiresAt: Date | null = null;
    if (expiresInHours !== undefined) {
      expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    // 5. Persist
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const decimalAmount = new Prisma.Decimal(amount);
    const pr = await this.paymentRequestRepository.create({
      requesterId: requester.id,
      receiverId:  receiver.id,
      amount:      decimalAmount,
      note:        note ?? null,
      expiresAt,
    });

    // 6. Notify both parties
    const requesterName =
      requester.displayName ?? requester.payflowId.split('@')[0] ?? requester.payflowId;
    const receiverName =
      receiver.displayName ?? receiver.payflowId.split('@')[0] ?? receiver.payflowId;
    const amtStr = amount.toFixed(2);

    // Receiver (payer): "Lakshita requested ₹500 from you."
    this.notify(
      receiver.id,
      NotificationType.MONEY_RECEIVED,
      'Payment Request',
      `${requesterName} requested ₹${amtStr} from you.`,
      pr.id,
    );

    // Requester: confirmation that their request was sent
    this.notify(
      requester.id,
      NotificationType.MONEY_SENT,
      'Request Sent',
      `You requested ₹${amtStr} from ${receiverName}.`,
      pr.id,
    );

    return this.toItem(pr);
  }

  // ── Get incoming requests ─────────────────────────────────────────────────
  async getIncoming(userId: string): Promise<PaymentRequestItem[]> {
    const rows = await this.paymentRequestRepository.findIncoming(userId);
    // Auto-expire rows past their deadline
    return rows.map((r) => {
      if (r.status === 'PENDING' && this.isExpired(r)) {
        return this.toItem({ ...r, status: 'EXPIRED' });
      }
      return this.toItem(r);
    });
  }

  // ── Get outgoing requests ─────────────────────────────────────────────────
  async getOutgoing(userId: string): Promise<PaymentRequestItem[]> {
    const rows = await this.paymentRequestRepository.findOutgoing(userId);
    return rows.map((r) => {
      if (r.status === 'PENDING' && this.isExpired(r)) {
        return this.toItem({ ...r, status: 'EXPIRED' });
      }
      return this.toItem(r);
    });
  }

  // ── Accept a payment request ──────────────────────────────────────────────
  // Only the receiver can accept. Atomic: debit receiver, credit requester,
  // create transactions, mark request ACCEPTED, send notifications.
  async acceptRequest(requestId: string, acceptingUserId: string): Promise<AcceptPaymentRequestResult> {
    const pr = await this.paymentRequestRepository.findByIdWithDetails(requestId);
    if (pr === null) throw new NotFoundError('Payment request not found');
    if (pr.receiverId !== acceptingUserId) throw new ForbiddenError('Only the receiver can accept this request');
    if (pr.status !== 'PENDING') throw new ConflictError(`Request is already ${pr.status.toLowerCase()}`);
    if (this.isExpired(pr)) throw new UnprocessableEntityError('This payment request has expired');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const decimalAmount = new Prisma.Decimal(pr.amount.toString());

    // Check receiver (the one paying) has sufficient balance
    let receiverWallet = await this.walletRepository.findByUserId(acceptingUserId);
    if (receiverWallet === null) {
      receiverWallet = await this.walletRepository.create({ userId: acceptingUserId });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (receiverWallet.balance.lessThan(decimalAmount)) {
      throw new UnprocessableEntityError('Insufficient balance');
    }

    // Ensure requester wallet exists
    let requesterWallet = await this.walletRepository.findByUserId(pr.requesterId);
    if (requesterWallet === null) {
      requesterWallet = await this.walletRepository.create({ userId: pr.requesterId });
    }

    // Atomic transaction block
    const result = await this.db.$transaction(async (tx) => {
      const txClient = tx as unknown as PrismaClient;

      // Debit payer (receiver of the request)
      const updatedPayerWallet = await txClient.wallet.update({
        where: { userId: acceptingUserId },
        data:  { balance: { decrement: decimalAmount } },
      });

      // Credit requester
      await txClient.wallet.update({
        where: { userId: pr.requesterId },
        data:  { balance: { increment: decimalAmount } },
      });

      // Sender's view (payer = DEBIT)
      const debitRecord = await txClient.transaction.create({
        data: {
          senderId:   acceptingUserId,
          receiverId: pr.requesterId,
          amount:     decimalAmount,
          status:     'COMPLETED',
          type:       'TRANSFER',
          direction:  'DEBIT',
          note:       pr.note ?? null,
        },
      });

      // Receiver's view (requester = CREDIT)
      await txClient.transaction.create({
        data: {
          senderId:   acceptingUserId,
          receiverId: pr.requesterId,
          amount:     decimalAmount,
          status:     'COMPLETED',
          type:       'TRANSFER',
          direction:  'CREDIT',
          note:       pr.note ?? null,
        },
      });

      // Mark request as ACCEPTED
      await txClient.paymentRequest.update({
        where: { id: requestId },
        data:  { status: 'ACCEPTED' },
      });

      return { updatedPayerWallet, debitTransactionId: debitRecord.id };
    });

    // Fire-and-forget notifications
    const payerName =
      pr.receiver.displayName ?? pr.receiver.payflowId.split('@')[0] ?? pr.receiver.payflowId;
    const requesterName =
      pr.requester.displayName ?? pr.requester.payflowId.split('@')[0] ?? pr.requester.payflowId;
    const amtStr = pr.amount.toFixed(2);

    // Requester (gets paid): "Rahul paid your request of ₹500."
    this.notify(
      pr.requesterId,
      NotificationType.MONEY_RECEIVED,
      'Payment Received',
      `${payerName} paid your request of ₹${amtStr}.`,
      result.debitTransactionId,
    );

    // Payer (receiver of request): "You paid Lakshita's request of ₹500."
    this.notify(
      acceptingUserId,
      NotificationType.MONEY_SENT,
      'Payment Sent',
      `You paid ${requesterName}'s request of ₹${amtStr}.`,
      result.debitTransactionId,
    );

    return {
      requestId,
      transactionId: result.debitTransactionId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      newReceiverBalance: result.updatedPayerWallet.balance.toString(),
    };
  }

  // ── Reject a payment request ──────────────────────────────────────────────
  // Only the receiver can reject.
  async rejectRequest(requestId: string, rejectingUserId: string): Promise<void> {
    const pr = await this.paymentRequestRepository.findByIdWithDetails(requestId);
    if (pr === null) throw new NotFoundError('Payment request not found');
    if (pr.receiverId !== rejectingUserId) throw new ForbiddenError('Only the receiver can reject this request');
    if (pr.status !== 'PENDING') throw new ConflictError(`Request is already ${pr.status.toLowerCase()}`);

    await this.paymentRequestRepository.updateStatus(requestId, 'REJECTED');

    const rejectorName =
      pr.receiver.displayName ?? pr.receiver.payflowId.split('@')[0] ?? pr.receiver.payflowId;
    const requesterName =
      pr.requester.displayName ?? pr.requester.payflowId.split('@')[0] ?? pr.requester.payflowId;
    const amtStr = pr.amount.toFixed(2);

    // Requester: "Rahul declined your request of ₹500."
    this.notify(
      pr.requesterId,
      NotificationType.MONEY_SENT,
      'Request Declined',
      `${rejectorName} declined your request of ₹${amtStr}.`,
      requestId,
    );

    // Receiver (payer): "You declined Lakshita's request of ₹500."
    this.notify(
      pr.receiverId,
      NotificationType.MONEY_SENT,
      'Request Declined',
      `You declined ${requesterName}'s request of ₹${amtStr}.`,
      requestId,
    );
  }

  // ── Cancel a payment request ──────────────────────────────────────────────
  // Only the requester can cancel.
  async cancelRequest(requestId: string, cancellingUserId: string): Promise<void> {
    const pr = await this.paymentRequestRepository.findByIdWithDetails(requestId);
    if (pr === null) throw new NotFoundError('Payment request not found');
    if (pr.requesterId !== cancellingUserId) throw new ForbiddenError('Only the requester can cancel this request');
    if (pr.status !== 'PENDING') throw new ConflictError(`Request is already ${pr.status.toLowerCase()}`);

    await this.paymentRequestRepository.cancel(requestId);

    const requesterName =
      pr.requester.displayName ?? pr.requester.payflowId.split('@')[0] ?? pr.requester.payflowId;
    const amtStr = pr.amount.toFixed(2);

    // Requester: confirmation "You cancelled your request of ₹500 to Rahul."
    this.notify(
      pr.requesterId,
      NotificationType.MONEY_SENT,
      'Request Cancelled',
      `You cancelled your request of ₹${amtStr} to ${pr.receiver.displayName ?? pr.receiver.payflowId.split('@')[0] ?? pr.receiver.payflowId}.`,
      requestId,
    );

    // Receiver (payer): "Lakshita cancelled their request of ₹500."
    this.notify(
      pr.receiverId,
      NotificationType.MONEY_RECEIVED,
      'Request Cancelled',
      `${requesterName} cancelled their request of ₹${amtStr}.`,
      requestId,
    );
  }
}
