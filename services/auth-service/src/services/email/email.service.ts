// ---------------------------------------------------------------------------
// EmailService — transactional email sender via Brevo HTTP API.
//
// Why Brevo instead of Nodemailer/SMTP?
// Render's free tier blocks outbound TCP on SMTP ports (465/587).
// Brevo's SDK sends over HTTPS (port 443) which is always open.
//
// If BREVO_API_KEY is absent the service logs a warning and skips sending
// rather than crashing the auth flow.
// ---------------------------------------------------------------------------
import { BrevoClient } from '@getbrevo/brevo';
import { config } from '../../config/env';
import { logger } from '../../config/logger';
import {
  buildResetPasswordHtml,
  buildResetPasswordText,
} from './templates/resetPassword';

// ---------------------------------------------------------------------------
// Input type for the password-reset email
// ---------------------------------------------------------------------------
export interface SendPasswordResetOptions {
  /** Recipient email address */
  to: string;
  /** User's display name shown in the greeting (e.g. payflowId prefix) */
  displayName: string;
  /** Full reset URL including the raw token as a query parameter */
  resetUrl: string;
}

// ---------------------------------------------------------------------------
// Parse EMAIL_FROM into a Brevo sender object.
// Accepts:
//   "PayFlow <no-reply@payflow.io>"  →  { name: 'PayFlow', email: 'no-reply@payflow.io' }
//   "no-reply@payflow.io"            →  { name: 'PayFlow', email: 'no-reply@payflow.io' }
// ---------------------------------------------------------------------------
function parseSender(emailFrom: string): { name: string; email: string } {
  const match = emailFrom.match(/^(.+?)\s*<([^>]+)>$/);
  const name  = match?.[1]?.trim();
  const email = match?.[2]?.trim();
  if (name && email) {
    return { name, email };
  }
  return { name: 'PayFlow', email: emailFrom.trim() };
}

// ---------------------------------------------------------------------------
// EmailService
// ---------------------------------------------------------------------------
export class EmailService {
  private client: BrevoClient | null = null;

  private getClient(): BrevoClient | null {
    if (this.client !== null) return this.client;

    const apiKey = config.BREVO_API_KEY;
    if (!apiKey) {
      logger.warn(
        '[EmailService] BREVO_API_KEY not configured — password reset emails will NOT be sent.',
      );
      return null;
    }

    this.client = new BrevoClient({ apiKey });
    return this.client;
  }

  async sendPasswordReset(options: SendPasswordResetOptions): Promise<void> {
    const client = this.getClient();
    if (!client) {
      // No API key — log the reset URL so developers can test locally.
      logger.info(
        { resetUrl: options.resetUrl },
        `[EmailService] Email sending disabled — password reset URL for ${options.to}`,
      );
      return;
    }

    const EXPIRES_IN = '15 minutes';
    const sender = parseSender(config.EMAIL_FROM);

    try {
      const result = await client.transactionalEmails.sendTransacEmail({
        sender,
        to: [{ email: options.to }],
        subject: 'Reset your PayFlow password',
        textContent: buildResetPasswordText({
          displayName: options.displayName,
          resetUrl: options.resetUrl,
          expiresIn: EXPIRES_IN,
        }),
        htmlContent: buildResetPasswordHtml({
          displayName: options.displayName,
          resetUrl: options.resetUrl,
          expiresIn: EXPIRES_IN,
        }),
      });

      logger.info(
        { messageId: result.messageId, to: options.to },
        '[EmailService] Password reset email sent',
      );
    } catch (err) {
      // Log the error and re-throw so AuthService can decide how to handle it.
      // AuthService catches this and still returns a generic success response
      // (email enumeration defence) while logging the underlying API failure.
      logger.error({ err, to: options.to }, '[EmailService] Failed to send password reset email');
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton — instantiated once per process.
// ---------------------------------------------------------------------------
export const emailService = new EmailService();
