// ---------------------------------------------------------------------------
// NotificationService — business logic for the notification system.
//
// Notification types
// ------------------
//   MONEY_RECEIVED   — someone sent money to this user
//   MONEY_SENT       — this user sent money to someone
//   WALLET_TOPPED_UP — this user added money to their own wallet
//   PASSWORD_CHANGED — this user changed their password
//   PROFILE_UPDATED  — this user updated their profile
//
// Layer contract
// --------------
// • All DB access goes through NotificationRepository.
// • Returns plain output objects; throws typed AppError subclasses.
// • No Express types, no req/res.
// ---------------------------------------------------------------------------
import { NotificationRepository } from '../repositories/notification.repository';
import { SSEService } from './sse.service';

// ---------------------------------------------------------------------------
// Notification types enum
// ---------------------------------------------------------------------------
export const NotificationType = {
  MONEY_RECEIVED:   'MONEY_RECEIVED',
  MONEY_SENT:       'MONEY_SENT',
  WALLET_TOPPED_UP: 'WALLET_TOPPED_UP',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PROFILE_UPDATED:  'PROFILE_UPDATED',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  refId: string | null;
  createdAt: string; // ISO string
}

export interface NotificationListResult {
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly sseService?: SSEService,
  ) {}

  // ── Internal helper: create a notification (used by other services) ───────
  async create(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    refId?: string;
  }): Promise<void> {
    // Create the notification in the database
    const notification = await this.notificationRepository.create(input);
    console.log('[NOTIFICATION CREATED]', notification.id, notification.userId);

    // Broadcast to SSE listeners (if service available)
    if (this.sseService) {
      console.log('[BROADCASTING]', notification.id);
      await this.sseService.broadcast(input.userId, {
        id:        notification.id,
        type:      notification.type,
        title:     notification.title,
        body:      notification.body,
        isRead:    notification.isRead,
        refId:     notification.refId,
        createdAt: notification.createdAt.toISOString(),
      });
    }
  }

  // ── List notifications (paginated) ────────────────────────────────────────
  async list(userId: string, cursor?: string): Promise<NotificationListResult> {
    const [rows, unreadCount] = await Promise.all([
      this.notificationRepository.findByUser(userId, PAGE_SIZE + 1, cursor),
      this.notificationRepository.countUnread(userId),
    ]);

    const hasMore = rows.length > PAGE_SIZE;
    const items = rows.slice(0, PAGE_SIZE);
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      notifications: items.map((n) => ({
        id:        n.id,
        type:      n.type,
        title:     n.title,
        body:      n.body,
        isRead:    n.isRead,
        refId:     n.refId,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      nextCursor,
    };
  }

  // ── Unread count only (used for badge polling) ────────────────────────────
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepository.countUnread(userId);
    return { unreadCount };
  }

  // ── Mark single notification as read ──────────────────────────────────────
  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.markRead(notificationId, userId);
  }

  // ── Mark all notifications as read ────────────────────────────────────────
  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllRead(userId);
  }
}
