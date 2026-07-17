// ---------------------------------------------------------------------------
// Wallet validators — Zod schemas for wallet request input.
// ---------------------------------------------------------------------------
import { z } from 'zod';

// ── Amount ────────────────────────────────────────────────────────────────
// Shared base for credit / debit requests.
// • Must be a positive number with at most 2 decimal places.
// • Upper bound is enforced by the @db.Decimal(18,2) column constraint.
const amountSchema = z
  .number({ required_error: 'amount is required' })
  .positive('amount must be positive')
  .multipleOf(0.01, 'amount must have at most 2 decimal places');

export const creditSchema = z.object({ amount: amountSchema });
export const debitSchema  = z.object({ amount: amountSchema });

export type CreditSchema = z.infer<typeof creditSchema>;
export type DebitSchema  = z.infer<typeof debitSchema>;
