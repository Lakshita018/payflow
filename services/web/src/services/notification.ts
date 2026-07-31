// ---------------------------------------------------------------------------
// services/notification.ts — typed API wrappers for notification endpoints.
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type { NotificationListResult } from '@/types';

/** GET /api/v1/notifications?cursor=<id> → NotificationListResult */
export async function list(cursor?: string): Promise<NotificationListResult> {
  const params = cursor ? { cursor } : {};
  const { data } = await apiClient.get<NotificationListResult>('/api/v1/notifications', { params });
  return data;
}

/** GET /api/v1/notifications/unread-count → { unreadCount } */
export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  const { data } = await apiClient.get<{ unreadCount: number }>('/api/v1/notifications/unread-count');
  return data;
}

/** PATCH /api/v1/notifications/:id/read → 204 */
export async function markRead(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/notifications/${id}/read`);
}

/** PATCH /api/v1/notifications/read-all → 204 */
export async function markAllRead(): Promise<void> {
  await apiClient.patch('/api/v1/notifications/read-all');
}
