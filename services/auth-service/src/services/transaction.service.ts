// ---------------------------------------------------------------------------
// TransactionService — business logic for money transfers, history, dashboard.
//
// Layer contract
// --------------
// • All DB access goes through repositories — never touches Prisma directly
//   except for the atomic $transaction block.
// • Returns plain output objects; throws typed AppError subclasses.
// • No Express types, no req/res.
// ---------------------------------------------------------------------------
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository, TransactionWithDetails } from '../repositories/transaction.repository';
import { NotFoundError, UnprocessableEntityError, ConflictError, ForbiddenError } from '../utils/errors';
import { transferSchema } from '../validators/transaction.validator';

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface TransferInput {
  senderUserId: string;
  receiverPayflowId: string;
  amount: number;
  note?: string | undefined;
}

export interface TransferResult {
  transactionId: string;
  senderBalance: string;
  receiverBalance: string;
  receiverName: string;
  receiverPayflowId: string;
}

export interface TransactionHistoryItem {
  id: string;
  amount: string;
  status: string;
  note: string | null;
  createdAt: Date;
  senderPayflowId: string;
  receiverPayflowId: string;
  senderEmail: string;
  receiverEmail: string;
}

export interface DashboardResult {
  balance: string;
  totalSent: string;
  totalReceived: string;
  recentTransactions: TransactionHistoryItem[];
  // Extended statistics
  monthlySpending: string;
  moneyReceivedThisMonth: string;
  moneySentToday: string;
  largestTransaction: TransactionHistoryItem | null;
  transactionCount: number;
}

// ---------------------------------------------------------------------------
// TransactionService
// ---------------------------------------------------------------------------
export class TransactionService {
  constructor(
    private readonly db: PrismaClient,
    private readonly userRepository: UserRepository,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  // ── Serialise a TransactionWithDetails row ─────────────────────────────────
  private toHistoryItem(tx: TransactionWithDetails): TransactionHistoryItem {
    return {
      id: tx.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      amount: tx.amount.toString(),
      status: tx.status,
      note: tx.note,
      createdAt: tx.createdAt,
      senderPayflowId: tx.sender.payflowId,
      receiverPayflowId: tx.receiver.payflowId,
      senderEmail: tx.sender.email,
      receiverEmail: tx.receiver.email,
    };
  }

  // ── Transfer money ────────────────────────────────────────────────────────
  async transferMoney(input: TransferInput): Promise<TransferResult> {
    // 1. Validate input
    const { receiverPayflowId, amount, note } = transferSchema.parse({
      receiverPayflowId: input.receiverPayflowId,
      amount: input.amount,
      note: input.note,
    });

    // 2. Find sender
    const sender = await this.userRepository.findById(input.senderUserId);
    if (sender === null) {
      throw new NotFoundError('Sender not found');
    }

    // 3. Find receiver by payflowId
    const receiver = await this.userRepository.findByPayflowId(receiverPayflowId);
    if (receiver === null) {
      throw new NotFoundError(`No user found with PayFlow ID: ${receiverPayflowId}`);
    }

    // 4. Reject self-transfer
    if (sender.id === receiver.id) {
      throw new ConflictError('Cannot transfer money to yourself');
    }

    // 5. Check sender has a wallet with sufficient balance
    const senderWallet = await this.walletRepository.findByUserId(sender.id);
    if (senderWallet === null) {
      throw new NotFoundError('Sender wallet not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const decimalAmount = new Prisma.Decimal(amount);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (senderWallet.balance.lessThan(decimalAmount)) {
      throw new UnprocessableEntityError('Insufficient balance');
    }

    // 6. Check receiver has a wallet
    const receiverWallet = await this.walletRepository.findByUserId(receiver.id);
    if (receiverWallet === null) {
      throw new NotFoundError('Receiver wallet not found');
    }

    // 7. Run ONE atomic Prisma transaction:
    //    - debit sender wallet
    //    - credit receiver wallet
    //    - create transaction record
    const result = await this.db.$transaction(async (tx) => {
      const txClient = tx as unknown as PrismaClient;

      const updatedSenderWallet = await txClient.wallet.update({
        where: { userId: sender.id },
        data: { balance: { decrement: decimalAmount } },
      });

      const updatedReceiverWallet = await txClient.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: decimalAmount } },
      });

      const txRecord = await txClient.transaction.create({
        data: {
          senderId: sender.id,
          receiverId: receiver.id,
          amount: decimalAmount,
          status: 'COMPLETED',
          note: note ?? null,
        },
      });

      return { updatedSenderWallet, updatedReceiverWallet, txRecord };
    });

    // 8. Return result
    return {
      transactionId: result.txRecord.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      senderBalance: result.updatedSenderWallet.balance.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      receiverBalance: result.updatedReceiverWallet.balance.toString(),
      receiverName: receiver.email,
      receiverPayflowId: receiver.payflowId,
    };
  }

  // ── Get single transaction by id ──────────────────────────────────────────
  // Only the sender or receiver may access a transaction record.
  // Throws NotFoundError if the id does not exist.
  // Throws ForbiddenError if the requesting user is neither party.
  async getById(transactionId: string, requestingUserId: string): Promise<TransactionHistoryItem> {
    const tx = await this.transactionRepository.findByIdWithDetails(transactionId);
    if (tx === null) {
      throw new NotFoundError('Transaction not found');
    }
    if (tx.senderId !== requestingUserId && tx.receiverId !== requestingUserId) {
      throw new ForbiddenError('You do not have access to this transaction');
    }
    return this.toHistoryItem(tx);
  }

  // ── Transaction history ────────────────────────────────────────────────────
  // Returns all transactions for the user (sent + received), newest first.
  async getHistory(userId: string): Promise<TransactionHistoryItem[]> {
    const rows = await this.transactionRepository.findByUserWithDetails(userId);
    return rows.map((r) => this.toHistoryItem(r));
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  // Aggregates balance + totals + stats + recent 5 transactions in parallel.
  async getDashboard(userId: string): Promise<DashboardResult> {
    const [
      wallet,
      totalSentDecimal,
      totalReceivedDecimal,
      monthlySendingDecimal,
      monthlyReceivedDecimal,
      sentTodayDecimal,
      largestTx,
      txCount,
      recent,
    ] = await Promise.all([
      this.walletRepository.findByUserId(userId),
      this.transactionRepository.sumSent(userId),
      this.transactionRepository.sumReceived(userId),
      this.transactionRepository.sumSentThisMonth(userId),
      this.transactionRepository.sumReceivedThisMonth(userId),
      this.transactionRepository.sumSentToday(userId),
      this.transactionRepository.findLargest(userId),
      this.transactionRepository.countByUser(userId),
      this.transactionRepository.findByUserWithDetails(userId, 5),
    ]);

    if (wallet === null) {
      throw new NotFoundError('Wallet not found');
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      balance: wallet.balance.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      totalSent: totalSentDecimal.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      totalReceived: totalReceivedDecimal.toString(),
      recentTransactions: recent.map((r) => this.toHistoryItem(r)),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      monthlySpending: monthlySendingDecimal.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      moneyReceivedThisMonth: monthlyReceivedDecimal.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      moneySentToday: sentTodayDecimal.toString(),
      largestTransaction: largestTx !== null ? this.toHistoryItem(largestTx) : null,
      transactionCount: txCount,
    };
  }
}
