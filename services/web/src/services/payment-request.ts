// ---------------------------------------------------------------------------
// services/payment-request.ts — typed API wrappers for payment-request endpoints.
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type {
  PaymentRequestItem,
  CreatePaymentRequestPayload,
  AcceptPaymentRequestResult,
} from '@/types';

/** POST /api/v1/payment-requests → PaymentRequestItem */
export async function createRequest(payload: CreatePaymentRequestPayload): Promise<PaymentRequestItem> {
  const { data } = await apiClient.post<PaymentRequestItem>('/api/v1/payment-requests', payload);
  return data;
}

/** GET /api/v1/payment-requests/incoming → PaymentRequestItem[] */
export async function getIncoming(): Promise<PaymentRequestItem[]> {
  const { data } = await apiClient.get<PaymentRequestItem[]>('/api/v1/payment-requests/incoming');
  return data;
}

/** GET /api/v1/payment-requests/outgoing → PaymentRequestItem[] */
export async function getOutgoing(): Promise<PaymentRequestItem[]> {
  const { data } = await apiClient.get<PaymentRequestItem[]>('/api/v1/payment-requests/outgoing');
  return data;
}

/** POST /api/v1/payment-requests/:id/accept → AcceptPaymentRequestResult */
export async function acceptRequest(id: string): Promise<AcceptPaymentRequestResult> {
  const { data } = await apiClient.post<AcceptPaymentRequestResult>(`/api/v1/payment-requests/${id}/accept`);
  return data;
}

/** POST /api/v1/payment-requests/:id/reject → 204 */
export async function rejectRequest(id: string): Promise<void> {
  await apiClient.post(`/api/v1/payment-requests/${id}/reject`);
}

/** DELETE /api/v1/payment-requests/:id → 204 */
export async function cancelRequest(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/payment-requests/${id}`);
}
