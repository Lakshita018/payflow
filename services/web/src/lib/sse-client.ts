// ---------------------------------------------------------------------------
// sse-client.ts — Client-side SSE connection manager with reconnection logic.
//
// Responsibilities:
//   • Establish and maintain SSE connection to /api/v1/notifications/stream
//   • Handle automatic reconnection with exponential backoff
//   • Invoke callback when new notifications arrive
//   • Clean up on disconnect
//   • Support auth token injection and refresh
//
// Design notes:
//   • Uses fetch + ReadableStream instead of EventSource for auth header support
//   • Singleton per browser context
//   • Automatic reconnect on disconnect (unless explicitly closed)
//   • Exponential backoff: 1s → 2s → 4s → 8s → 30s (max)
//   • Max 10 retry attempts
//   • Preserves auth token during reconnects
// ---------------------------------------------------------------------------

export interface NotificationMessage {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  refId: string | null;
  createdAt: string;
}

export type NotificationCallback = (notification: NotificationMessage) => void;

class SimpleLogger {
  info(msg: string, data?: Record<string, unknown>): void {
    console.log(`[SSE] ${msg}`, data);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    console.warn(`[SSE] ${msg}`, data);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    console.error(`[SSE] ${msg}`, data);
  }
}

const logger = new SimpleLogger();

// Import auth store getter to retrieve token
// Using a getter function to delay import (avoid circular deps)
let getAuthToken: (() => string | null) | null = null;

export function setAuthTokenGetter(getter: () => string | null): void {
  getAuthToken = getter;
}

// Read VITE_API_BASE_URL at module evaluation time so the SSE client
// uses the same backend URL as the axios client in production.
// Falls back to the Vite dev-proxy path ('/api/v1') for local development.
const DEFAULT_BASE_URL =
  ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '') + '/api/v1';

export class SSEClient {
  private abortController: AbortController | null = null;
  private callback: NotificationCallback | null = null;
  private retries = 0;
  private maxRetries = 10;
  private baseDelay = 1000; // 1s
  private maxDelay = 30000; // 30s
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isClosed = false;
  private baseURL: string;

  constructor(baseURL: string = DEFAULT_BASE_URL) {
    this.baseURL = baseURL;
  }

  // ── Get auth token from injected getter or localStorage ──────────────────
  private getAuthTokenValue(): string | null {
    // First, try using the injected auth token getter
    if (getAuthToken) {
      try {
        const token = getAuthToken();
        if (token) return token;
      } catch {
        // fallback below
      }
    }

    // Fallback: check both storages — auth store uses localStorage for
    // "remember me" sessions and sessionStorage for session-only logins.
    try {
      return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  // ── Connect to SSE stream ────────────────────────────────────────────────
  async connect(callback: NotificationCallback): Promise<void> {
    this.callback = callback;
    this.isClosed = false;
    this.retries = 0;

    try {
      const token = this.getAuthTokenValue();
      if (!token) {
        logger.error('No auth token available');
        return;
      }

      this.abortController = new AbortController();

      const response = await fetch(`${this.baseURL}/notifications/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('SSE authentication failed (401)');
          return;
        }
        throw new Error(`SSE stream returned ${response.status}`);
      }

      if (!response.body) {
        throw new Error('SSE stream has no body');
      }

      logger.info('SSE connection established');
      this.retries = 0;

      await this.readStream(response.body);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Deliberate disconnect
        return;
      }
      logger.error('SSE connection error', { error: String(err) });
      this.scheduleReconnect();
    }
  }

  // ── Read stream line by line ─────────────────────────────────────────────
  private async readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          this.processLine(line);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ── Process a single SSE line ────────────────────────────────────────────
  private processLine(line: string): void {
    line = line.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith(':')) {
      return;
    }

    // Parse "data: {json}" format
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6);
      try {
        const notification: NotificationMessage = JSON.parse(dataStr);
        logger.info('Received SSE notification', { id: notification.id, type: notification.type });
        if (this.callback) {
          this.callback(notification);
        }
      } catch (err) {
        logger.error('Failed to parse SSE message', { error: String(err), data: line });
      }
    }
  }

  // ── Schedule reconnection with exponential backoff ────────────────────────
  private scheduleReconnect(): void {
    if (this.isClosed || this.retries >= this.maxRetries) {
      logger.warn('SSE reconnection abandoned after max retries');
      return;
    }

    this.retries += 1;
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retries - 1),
      this.maxDelay,
    );

    logger.info(`SSE reconnecting in ${delay}ms (attempt ${this.retries}/${this.maxRetries})`);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isClosed && this.callback) {
        void this.connect(this.callback);
      }
    }, delay);
  }

  // ── Disconnect ───────────────────────────────────────────────────────────
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    logger.info('SSE connection disconnected');
  }

  // ── Close connection permanently ─────────────────────────────────────────
  close(): void {
    this.isClosed = true;
    this.disconnect();
  }

  // ── Check if actively connected ──────────────────────────────────────────
  isConnected(): boolean {
    return this.abortController !== null && !this.abortController.signal.aborted;
  }
}

// Module-level singleton — one connection per browser context.
// resetSSEClient() clears it so a fresh connection is made after logout/re-login.
let sseClient: SSEClient | null = null;

export function createSSEClient(baseURL?: string): SSEClient {
  if (!sseClient) {
    sseClient = new SSEClient(baseURL);
  }
  return sseClient;
}

export function resetSSEClient(): void {
  if (sseClient) {
    sseClient.close();
    sseClient = null;
  }
}

export function getSSEClient(): SSEClient | null {
  return sseClient;
}
