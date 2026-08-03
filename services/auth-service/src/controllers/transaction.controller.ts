// ---------------------------------------------------------------------------
// TransactionController — HTTP layer for transaction endpoints.
//
// All endpoints are protected by authMiddleware. The authenticated user's id
// is read from req.user.id — never from req.body.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TransactionService } from '../services/transaction.service';
import { UnauthorizedError } from '../utils/errors';

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {
    this.transfer = this.transfer.bind(this);
    this.getById = this.getById.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getDashboard = this.getDashboard.bind(this);
  }

  // POST /api/v1/transactions/transfer
  // Headers: Idempotency-Key: <uuid>  (strongly recommended; omitting it disables protection)
  // Body: { receiverPayflowId, amount, note? }
  // 200 OK → { transactionId, senderBalance, receiverBalance, receiverName, receiverPayflowId }
  // 200 OK (replay) → same response as the original request
  // 409 Conflict → same Idempotency-Key used with a different payload
  async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }

      // Extract idempotency key from the standard header.
      const idempotencyKey = typeof req.headers['idempotency-key'] === 'string'
        ? req.headers['idempotency-key']
        : undefined;

      const transferInput: {
        senderUserId: string;
        receiverPayflowId: string;
        amount: number;
        note?: string;
        idempotencyKey?: string;
      } = {
        senderUserId: req.user.id,
        receiverPayflowId: req.body.receiverPayflowId as string,
        amount: req.body.amount as number,
      };
      if (typeof req.body.note === 'string') {
        transferInput.note = req.body.note;
      }
      if (idempotencyKey !== undefined) {
        transferInput.idempotencyKey = idempotencyKey;
      }
      const result = await this.transactionService.transferMoney(transferInput);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/transactions/:id
  // 200 OK → TransactionHistoryItem
  // 403    → requesting user is neither sender nor receiver
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.transactionService.getById(
        req.params.id as string,
        req.user.id,
      );
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/transactions/history
  // 200 OK → TransactionHistoryItem[]
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.transactionService.getHistory(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/transactions/dashboard
  // 200 OK → DashboardResult
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.transactionService.getDashboard(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}
