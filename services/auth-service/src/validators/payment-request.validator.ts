// ---------------------------------------------------------------------------
// payment-request.validator.ts — Zod schemas for payment-request endpoints.
// ---------------------------------------------------------------------------
import { z } from 'zod';

export const createPaymentRequestSchema = z.object({
  receiverPayflowId: z
    .string({ required_error: 'receiverPayflowId is required' })
    .min(1, 'receiverPayflowId must not be empty'),

  amount: z
    .number({ required_error: 'amount is required' })
    .positive('amount must be positive')
    .multipleOf(0.01, 'amount must have at most 2 decimal places'),

  note: z.string().max(200, 'note must be at most 200 characters').optional(),

  expiresInHours: z
    .number()
    .int('expiresInHours must be an integer')
    .min(1, 'expiresInHours must be at least 1')
    .max(720, 'expiresInHours must be at most 720 (30 days)')
    .optional(),
});

export type CreatePaymentRequestSchema = z.infer<typeof createPaymentRequestSchema>;
