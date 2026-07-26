// ---------------------------------------------------------------------------
// services/user.ts — typed API wrappers for user/contact endpoints.
// ---------------------------------------------------------------------------
import { apiClient } from '@/lib';
import type { PublicProfile, RecipientProfile, RecentContact } from '@/types';

/** GET /api/v1/users/payflow/:payflowId → RecipientProfile */
export async function lookupRecipient(payflowId: string): Promise<RecipientProfile> {
  const { data } = await apiClient.get<RecipientProfile>(`/api/v1/users/payflow/${payflowId}`);
  return data;
}

/** GET /api/v1/users/search?q=<query> → PublicProfile[] */
export async function search(q: string): Promise<PublicProfile[]> {
  const { data } = await apiClient.get<PublicProfile[]>('/api/v1/users/search', { params: { q } });
  return data;
}

/** GET /api/v1/users/recent → RecentContact[] */
export async function getRecentContacts(): Promise<RecentContact[]> {
  const { data } = await apiClient.get<RecentContact[]>('/api/v1/users/recent');
  return data;
}

/** GET /api/v1/users/favourites → PublicProfile[] */
export async function getFavourites(): Promise<PublicProfile[]> {
  const { data } = await apiClient.get<PublicProfile[]>('/api/v1/users/favourites');
  return data;
}

/** POST /api/v1/users/favourites/:contactUserId → 204 */
export async function addFavourite(contactPayflowId: string): Promise<void> {
  // The backend endpoint takes the contact's userId (internal UUID), not payflowId.
  // We first look up the user to get their internal userId, then add as favourite.
  // This is done by looking up via /payflow/:payflowId and then passing the id.
  // The API endpoint actually takes contactUserId (internal UUID).
  await apiClient.post(`/api/v1/users/favourites/${contactPayflowId}`);
}

/** DELETE /api/v1/users/favourites/:contactUserId → 204 */
export async function removeFavourite(contactPayflowId: string): Promise<void> {
  await apiClient.delete(`/api/v1/users/favourites/${contactPayflowId}`);
}
