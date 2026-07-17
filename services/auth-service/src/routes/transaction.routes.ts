// ---------------------------------------------------------------------------
// Transaction routes — composition root for the transfer + history features.
//   prisma → UserRepository + WalletRepository + TransactionRepository
//          → TransactionService → TransactionController
// Mounted at /api/v1/transactions in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { TransactionService } from '../services/transaction.service';
import { TransactionController } from '../controllers/transaction.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const userRepository        = new UserRepository(prisma);
const walletRepository      = new WalletRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);
const transactionService    = new TransactionService(
  prisma,
  userRepository,
  walletRepository,
  transactionRepository,
);
const transactionController = new TransactionController(transactionService);

const auth = createAuthMiddleware(userRepository);

export const transactionRouter = Router();

// POST /api/v1/transactions/transfer
transactionRouter.post('/transfer', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void transactionController.transfer(req, res, next);
});

// GET /api/v1/transactions/history
transactionRouter.get('/history', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void transactionController.getHistory(req, res, next);
});

// GET /api/v1/transactions/dashboard
transactionRouter.get('/dashboard', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void transactionController.getDashboard(req, res, next);
});

// GET /api/v1/transactions/:id
// Must be registered after all static paths so /history and /dashboard match first.
transactionRouter.get('/:id', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void transactionController.getById(req, res, next);
});
