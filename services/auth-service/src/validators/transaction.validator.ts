// ---------------------------------------------------------------------------
// Transaction validators — Zod schema for the transfer endpoint.
// ---------------------------------------------------------------------------
import { z } from 'zod';

export const transferSchema = z.object({
  receiverPayflowId: z
    .string({ required_error: 'receiverPayflowId is required' })
    .min(1, 'receiverPayflowId must not be empty'),

  amount: z
    .number({ required_error: 'amount is required' })
    .positive('amount must be positive')
    .multipleOf(0.01, 'amount must have at most 2 decimal places'),

  note: z.string().optional(),
});

export type TransferSchema = z.infer<typeof transferSchema>;
