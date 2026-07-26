// ---------------------------------------------------------------------------
// services/wallet.ts — typed API wrappers for all wallet endpoints.
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type { Wallet } from '@/types';

/** GET /api/v1/wallets/balance → Wallet */
export async function getBalance(): Promise<Wallet> {
  const { data } = await apiClient.get<Wallet>('/api/v1/wallets/balance');
  return data;
}

/** POST /api/v1/wallets/credit → Wallet */
export async function credit(amount: number): Promise<Wallet> {
  const { data } = await apiClient.post<Wallet>('/api/v1/wallets/credit', { amount });
  return data;
}
