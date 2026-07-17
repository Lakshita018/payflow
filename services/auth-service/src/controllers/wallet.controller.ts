// ---------------------------------------------------------------------------
// WalletController — HTTP layer for wallet endpoints.
//
// All endpoints are protected by authMiddleware. The authenticated user's id
// is read from req.user.id — never from req.body or req.params.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { WalletService } from '../services/wallet.service';
import { UnauthorizedError } from '../utils/errors';

export class WalletController {
  constructor(private readonly walletService: WalletService) {
    this.createWallet  = this.createWallet.bind(this);
    this.getBalance    = this.getBalance.bind(this);
    this.credit        = this.credit.bind(this);
    this.debit         = this.debit.bind(this);
  }

  // POST /api/v1/wallets  →  201  { id, userId, balance, createdAt, updatedAt }
  async createWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.walletService.createWallet(req.user.id);
      res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/wallets/balance  →  200  { id, userId, balance, ... }
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.walletService.getBalance(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/wallets/credit  →  200  { updated wallet }
  async credit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.walletService.credit(
        req.user.id,
        req.body.amount as number,
      );
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/wallets/debit  →  200  { updated wallet }
  async debit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.walletService.debit(
        req.user.id,
        req.body.amount as number,
      );
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }
}
