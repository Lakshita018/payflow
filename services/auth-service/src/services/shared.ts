// ---------------------------------------------------------------------------
// shared.ts — application-wide service singletons.
//
// Importing this module from any route file guarantees that every part of the
// app shares the SAME SSEService and NotificationService instance.  The
// previous problem was that transaction.routes.ts created its own
// NotificationRepository and bypassed NotificationService entirely, so
// SSEService.broadcast() was never called after a transfer.
//
// Rule: nothing outside this file may call `new SSEService()` or
// `new NotificationService()`.
// ---------------------------------------------------------------------------
import { prisma } from '../config/prisma';
import { NotificationRepository } from '../repositories/notification.repository';
import { SSEService } from './sse.service';
import { NotificationService } from './notification.service';

export const sseService          = new SSEService();
export const notificationService = new NotificationService(
  new NotificationRepository(prisma),
  sseService,
);
