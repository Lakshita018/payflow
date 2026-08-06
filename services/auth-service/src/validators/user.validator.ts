// ---------------------------------------------------------------------------
// User validators — Zod schemas for user-discovery endpoints.
// ---------------------------------------------------------------------------
import { z } from 'zod';

// Used by GET /users/search?q=<query>
export const searchQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(1, 'Search query must not be empty')
    .max(100, 'Search query must be at most 100 characters'),
});

export type SearchQuerySchema = z.infer<typeof searchQuerySchema>;
