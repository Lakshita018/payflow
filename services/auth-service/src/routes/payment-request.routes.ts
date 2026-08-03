// ---------------------------------------------------------------------------
// Payment-request routes — composition root for the Request Money feature.
//   prisma → PaymentRequestRepository + UserRepository + WalletRepository
//          → PaymentRequestService → PaymentRequestController
// Mounted at /api/v1/payment-requests in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { PaymentRequestRepository } from '../repositories/payment-request.repository';
import { PaymentRequestService } from '../services/payment-request.service';
import { PaymentRequestController } from '../controllers/payment-request.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const userRepository            = new UserRepository(prisma);
const walletRepository          = new WalletRepository(prisma);
const notificationRepository    = new NotificationRepository(prisma);
const paymentRequestRepository  = new PaymentRequestRepository(prisma);
const paymentRequestService     = new PaymentRequestService(
  prisma,
  paymentRequestRepository,
  userRepository,
  walletRepository,
  notificationRepository,
);
const paymentRequestController  = new PaymentRequestController(paymentRequestService);

const auth = createAuthMiddleware(userRepository);

export const paymentRequestRouter = Router();

// POST /api/v1/payment-requests
paymentRequestRouter.post('/', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.create(req, res, next);
});

// GET /api/v1/payment-requests/incoming
paymentRequestRouter.get('/incoming', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.getIncoming(req, res, next);
});

// GET /api/v1/payment-requests/outgoing
paymentRequestRouter.get('/outgoing', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.getOutgoing(req, res, next);
});

// POST /api/v1/payment-requests/:id/accept
paymentRequestRouter.post('/:id/accept', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.acceptRequest(req, res, next);
});

// POST /api/v1/payment-requests/:id/reject
paymentRequestRouter.post('/:id/reject', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.rejectRequest(req, res, next);
});

// DELETE /api/v1/payment-requests/:id  (cancel — requester only)
paymentRequestRouter.delete('/:id', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void paymentRequestController.cancelRequest(req, res, next);
});
