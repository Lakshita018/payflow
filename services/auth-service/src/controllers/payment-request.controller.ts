// ---------------------------------------------------------------------------
// PaymentRequestController — HTTP layer for payment-request endpoints.
//
// All endpoints are protected by authMiddleware. req.user.id is the
// authenticated user's id — never read from the request body.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { PaymentRequestService } from '../services/payment-request.service';
import { UnauthorizedError } from '../utils/errors';

export class PaymentRequestController {
  constructor(private readonly paymentRequestService: PaymentRequestService) {
    this.create        = this.create.bind(this);
    this.getIncoming   = this.getIncoming.bind(this);
    this.getOutgoing   = this.getOutgoing.bind(this);
    this.acceptRequest = this.acceptRequest.bind(this);
    this.rejectRequest = this.rejectRequest.bind(this);
    this.cancelRequest = this.cancelRequest.bind(this);
  }

  // POST /api/v1/payment-requests
  // Body: { receiverPayflowId, amount, note?, expiresInHours? }
  // 201 Created → PaymentRequestItem
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const input: {
        requesterUserId: string;
        receiverPayflowId: string;
        amount: number;
        note?: string;
        expiresInHours?: number;
      } = {
        requesterUserId:   req.user.id,
        receiverPayflowId: req.body.receiverPayflowId as string,
        amount:            req.body.amount as number,
      };
      if (typeof req.body.note === 'string') input.note = req.body.note;
      if (typeof req.body.expiresInHours === 'number') input.expiresInHours = req.body.expiresInHours;
      const result = await this.paymentRequestService.createRequest(input);
      res.status(StatusCodes.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/payment-requests/incoming
  // 200 OK → PaymentRequestItem[]
  async getIncoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await this.paymentRequestService.getIncoming(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/payment-requests/outgoing
  // 200 OK → PaymentRequestItem[]
  async getOutgoing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await this.paymentRequestService.getOutgoing(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/payment-requests/:id/accept
  // 200 OK → { requestId, transactionId, newReceiverBalance }
  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const result = await this.paymentRequestService.acceptRequest(
        req.params.id as string,
        req.user.id,
      );
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/payment-requests/:id/reject
  // 204 No Content
  async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await this.paymentRequestService.rejectRequest(req.params.id as string, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/v1/payment-requests/:id
  // 204 No Content
  async cancelRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await this.paymentRequestService.cancelRequest(req.params.id as string, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}
