// ---------------------------------------------------------------------------
// Notification routes — composition root for the notification feature.
//   shared.ts → notificationService + sseService (singletons)
//             → NotificationController
// Mounted at /api/v1/notifications in app.ts.
// ---------------------------------------------------------------------------
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { UserRepository } from '../repositories/user.repository';
import { sseService, notificationService } from '../services/shared';
import { NotificationController } from '../controllers/notification.controller';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const userRepository         = new UserRepository(prisma);
const notificationController = new NotificationController(notificationService, sseService);

const auth = createAuthMiddleware(userRepository);

export const notificationRouter = Router();

// GET    /api/v1/notifications/stream
// Server-Sent Events endpoint for real-time notifications.
// Must be before other routes to avoid conflicts.
notificationRouter.get('/stream', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void notificationController.stream(req, res, next);
});

// GET    /api/v1/notifications/unread-count
// Static path must be registered before the parameterised :id route.
notificationRouter.get('/unread-count', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void notificationController.unreadCount(req, res, next);
});

// PATCH  /api/v1/notifications/read-all
// Static path — must be before /:id
notificationRouter.patch('/read-all', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void notificationController.markAllRead(req, res, next);
});

// GET    /api/v1/notifications?cursor=<id>
notificationRouter.get('/', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void notificationController.list(req, res, next);
});

// PATCH  /api/v1/notifications/:id/read
notificationRouter.patch('/:id/read', (req, res, next) => { void auth(req, res, next); }, (req, res, next) => {
  void notificationController.markRead(req, res, next);
});
