// ---------------------------------------------------------------------------
// NotificationController — HTTP layer for notification endpoints.
//
// All endpoints are protected by authMiddleware. req.user.id is the
// authenticated user's id — never read from the request body.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/notification.service';
import { UnauthorizedError } from '../utils/errors';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {
    this.list        = this.list.bind(this);
    this.unreadCount = this.unreadCount.bind(this);
    this.markRead    = this.markRead.bind(this);
    this.markAllRead = this.markAllRead.bind(this);
  }

  // GET /api/v1/notifications?cursor=<id>
  // 200 OK → { notifications, unreadCount, nextCursor }
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const result = await this.notificationService.list(req.user.id, cursor);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/notifications/unread-count
  // 200 OK → { unreadCount: number }
  async unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const result = await this.notificationService.getUnreadCount(req.user.id);
      res.status(StatusCodes.OK).json(result);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/notifications/:id/read
  // 204 No Content
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      await this.notificationService.markRead(req.params.id as string, req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/notifications/read-all
  // 204 No Content
  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      await this.notificationService.markAllRead(req.user.id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }
}
