// ---------------------------------------------------------------------------
// services/transaction.ts — typed API wrappers for transaction endpoints.
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type { Transaction, DashboardData, TransferResult } from '@/types';

/** GET /api/v1/transactions/history → Transaction[] */
export async function getHistory(): Promise<Transaction[]> {
  const { data } = await apiClient.get<Transaction[]>('/api/v1/transactions/history');
  return data;
}

/** GET /api/v1/transactions/dashboard → DashboardData */
export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get<DashboardData>('/api/v1/transactions/dashboard');
  return data;
}

/** GET /api/v1/transactions/:id → Transaction */
export async function getById(id: string): Promise<Transaction> {
  const { data } = await apiClient.get<Transaction>(`/api/v1/transactions/${id}`);
  return data;
}

export interface TransferRequest {
  receiverPayflowId: string;
  amount: number;
  note?: string;
  /**
   * Client-generated UUID that guarantees exactly-once execution.
   * Generate with `crypto.randomUUID()` before the first attempt and
   * reuse the **same key** on every retry for this transfer.
   * When provided, the backend sends it as the `Idempotency-Key` header.
   */
  idempotencyKey?: string;
}

/** POST /api/v1/transactions/transfer → TransferResult */
export async function transfer(payload: TransferRequest): Promise<TransferResult> {
  const { idempotencyKey, ...body } = payload;
  const { data } = await apiClient.post<TransferResult>(
    '/api/v1/transactions/transfer',
    body,
    idempotencyKey
      ? { headers: { 'Idempotency-Key': idempotencyKey } }
      : undefined,
  );
  return data;
}
