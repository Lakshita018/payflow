// ---------------------------------------------------------------------------
// Auth validators — Zod schemas for request input validation.
//
// These schemas are used by the service layer to validate inputs before any
// business logic runs. Zod throws a ZodError on failure; the global error
// middleware in app.ts converts ZodError → 400 Bad Request automatically.
//
// Constraints are chosen to match common security guidance:
//   email   — standard RFC 5322 format enforced by Zod's built-in .email()
//   password — min 8 (NIST SP 800-63B floor), max 128 (bcrypt input limit
//              is 72 bytes; 128-char cap keeps inputs well within that and
//              prevents DoS via deliberately huge hash inputs)
// ---------------------------------------------------------------------------
import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(),  // normalise before storage so foo@Bar.com and foo@bar.com are the same identity
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Forgot password — accepts only a valid, normalised email address.
// ---------------------------------------------------------------------------
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase(),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Reset password — validates the raw token (hex string from URL) plus the
// new password with the same constraints as registration.
// ---------------------------------------------------------------------------
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
