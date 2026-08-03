// ---------------------------------------------------------------------------
// NotificationController — HTTP layer for notification endpoints.
//
// All endpoints are protected by authMiddleware. req.user.id is the
// authenticated user's id — never read from the request body.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../services/notification.service';
import { SSEService } from '../services/sse.service';
import { UnauthorizedError } from '../utils/errors';

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly sseService: SSEService,
  ) {
    this.list        = this.list.bind(this);
    this.unreadCount = this.unreadCount.bind(this);
    this.markRead    = this.markRead.bind(this);
    this.markAllRead = this.markAllRead.bind(this);
    this.stream      = this.stream.bind(this);
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

  // GET /api/v1/notifications/stream
  // Server-Sent Events endpoint.
  // Establishes a persistent connection that broadcasts new notifications
  // to the authenticated user in real-time.
  // 200 OK → text/event-stream
  stream(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.user) { throw new UnauthorizedError(); }
      const userId = req.user.id;

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Register the connection
      this.sseService.registerConnection(userId, res);

      // Handle client disconnect
      const onDisconnect = () => {
        this.sseService.removeConnection(userId, res);
        res.end();
      };
      res.on('close', onDisconnect);
      res.on('error', onDisconnect);

      // Flush helper — ensures each write is sent immediately over the wire.
      const flush = () => {
        if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
          (res as unknown as { flush: () => void }).flush();
        }
      };

      // Send initial flush so the 200 + headers reach the client right away.
      flush();

      // Send a comment to keep the connection alive (30s ping)
      const keepAliveInterval = setInterval(() => {
        try {
          res.write(': heartbeat\n\n');
          flush();
        } catch {
          clearInterval(keepAliveInterval);
          onDisconnect();
        }
      }, 30000);

      // Cleanup on response end
      res.on('finish', () => {
        clearInterval(keepAliveInterval);
        this.sseService.removeConnection(userId, res);
      });
    } catch (err) {
      next(err);
    }
  }
}
