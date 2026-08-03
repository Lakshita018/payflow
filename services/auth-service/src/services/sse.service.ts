// ---------------------------------------------------------------------------
// SSEService — Server-Sent Events connection management.
//
// Responsibilities:
//   • Store active SSE connections per user (Response object only)
//   • Broadcast notifications to all active connections for a user
//   • Clean up connections on disconnect
//   • Enforce one connection per Response (no duplicate sends)
//
// Design notes:
//   • Stores only the Response object per connection (small memory footprint)
//   • Multiple connections per user are allowed (multi-tab support)
//   • Broadcast is synchronous; if send fails, connection is closed and cleaned
//   • No persistence; connections are in-memory only
// ---------------------------------------------------------------------------
import { Response } from 'express';

export interface NotificationMessage {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  refId: string | null;
  createdAt: string;
}

export class SSEService {
  // Map<userId, Set<Response>>
  private connections: Map<string, Set<Response>> = new Map();

  // ── Register a new SSE connection ──────────────────────────────────────────
  registerConnection(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
    console.log('[SSE REGISTERED] Connected user:', userId, '| Total connections for user:', this.connections.get(userId)!.size);
  }

  // ── Remove a connection (called on disconnect) ──────────────────────────────
  removeConnection(userId: string, res: Response): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    userConnections.delete(res);
    if (userConnections.size === 0) {
      this.connections.delete(userId);
    }
  }

  // ── Broadcast a notification to all active connections for a user ──────────
  async broadcast(userId: string, notification: NotificationMessage): Promise<void> {
    const userConnections = this.connections.get(userId);
    console.log('[ACTIVE CONNECTIONS]', userId, userConnections?.size ?? 0);
    if (!userConnections || userConnections.size === 0) {
      return;
    }

    const message = `data: ${JSON.stringify(notification)}\n\n`;
    const failedConnections: Response[] = [];

    for (const res of userConnections) {
      try {
        console.log('[WRITING EVENT]', notification.id);
        res.write(message);
        // Flush the write immediately so the event reaches the client without
        // waiting for Node's internal socket buffer to drain on its own.
        if (typeof (res as unknown as { flush?: () => void }).flush === 'function') {
          (res as unknown as { flush: () => void }).flush();
        }
        console.log('[EVENT WRITTEN]');
      } catch {
        // If write fails, mark for removal
        failedConnections.push(res);
      }
    }

    // Clean up failed connections
    for (const res of failedConnections) {
      this.removeConnection(userId, res);
      try {
        res.end();
      } catch {
        // Already closed
      }
    }
  }

  // ── Get connection count for a user (for monitoring) ────────────────────────
  getConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size ?? 0;
  }

  // ── Get total active connections (for monitoring) ─────────────────────────
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }
}

// Singleton instance
export const sseService = new SSEService();
