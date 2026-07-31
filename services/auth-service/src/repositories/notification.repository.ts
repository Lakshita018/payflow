// ---------------------------------------------------------------------------
// NotificationRepository — database operations for the Notification model.
//
// Rules
// -----
// • Only layer that touches prisma.notification.*
// • No business logic — no validation, no auth.
// ---------------------------------------------------------------------------
import { PrismaClient, Notification } from '../generated/prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  refId?: string;
}

export class NotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────
  async create(input: CreateNotificationInput): Promise<Notification> {
    return this.db.notification.create({
      data: {
        userId: input.userId,
        type:   input.type,
        title:  input.title,
        body:   input.body,
        refId:  input.refId ?? null,
      },
    });
  }

  // ── List (newest-first, paginated) ────────────────────────────────────────
  async findByUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });
  }

  // ── Unread count ──────────────────────────────────────────────────────────
  async countUnread(userId: string): Promise<number> {
    return this.db.notification.count({ where: { userId, isRead: false } });
  }

  // ── Mark single as read ───────────────────────────────────────────────────
  async markRead(id: string, userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { id, userId },
      data:  { isRead: true },
    });
  }

  // ── Mark all as read ──────────────────────────────────────────────────────
  async markAllRead(userId: string): Promise<void> {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });
  }
}
