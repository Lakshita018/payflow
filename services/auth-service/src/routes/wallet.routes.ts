// ---------------------------------------------------------------------------
// Wallet routes — composition root for the wallet feature.
//   prisma  →  UserRepository  →  auth middleware
//   prisma  →  WalletRepository + TransactionRepository  →  WalletService  →  WalletController
// Mounted at /api/v1/wallets in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { WalletService } from '../services/wallet.service';
import { WalletController } from '../controllers/wallet.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const userRepository         = new UserRepository(prisma);
const walletRepository       = new WalletRepository(prisma);
const transactionRepository  = new TransactionRepository(prisma);
const notificationRepository = new NotificationRepository(prisma);
const walletService          = new WalletService(walletRepository, transactionRepository, notificationRepository);
const walletController      = new WalletController(walletService);

const auth = createAuthMiddleware(userRepository);

export const walletRouter = Router();

// POST   /api/v1/wallets
walletRouter.post('/', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void walletController.createWallet(req, res, next); });

// GET    /api/v1/wallets/balance
walletRouter.get('/balance', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void walletController.getBalance(req, res, next); });

// POST   /api/v1/wallets/credit
walletRouter.post('/credit', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void walletController.credit(req, res, next); });

// POST   /api/v1/wallets/debit
walletRouter.post('/debit', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => { void walletController.debit(req, res, next); });
