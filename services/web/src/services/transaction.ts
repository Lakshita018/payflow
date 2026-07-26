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
}

/** POST /api/v1/transactions/transfer → TransferResult */
export async function transfer(payload: TransferRequest): Promise<TransferResult> {
  const { data } = await apiClient.post<TransferResult>('/api/v1/transactions/transfer', payload);
  return data;
}
