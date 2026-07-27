// ---------------------------------------------------------------------------
// EmailService — transactional email sender via Resend HTTP API.
//
// Why Resend instead of Nodemailer/SMTP?
// Render's free tier blocks outbound TCP on SMTP ports (465/587).
// Resend sends over HTTPS (port 443) which is always open.
//
// If RESEND_API_KEY is absent the service logs a warning and skips sending
// rather than crashing the auth flow (same behaviour as before).
// ---------------------------------------------------------------------------
import { Resend } from 'resend';
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
// EmailService
// ---------------------------------------------------------------------------
export class EmailService {
  private resend: Resend | null = null;

  private getClient(): Resend | null {
    if (this.resend !== null) return this.resend;

    const apiKey = config.RESEND_API_KEY;
    if (!apiKey) {
      logger.warn(
        '[EmailService] RESEND_API_KEY not configured — password reset emails will NOT be sent.',
      );
      return null;
    }

    this.resend = new Resend(apiKey);
    return this.resend;
  }

  async sendPasswordReset(options: SendPasswordResetOptions): Promise<void> {
    const client = this.getClient();
    if (!client) {
      logger.info(
        { resetUrl: options.resetUrl },
        `[EmailService] Email sending disabled — password reset URL for ${options.to}`,
      );
      return;
    }

    const EXPIRES_IN = '15 minutes';

    const { data, error } = await client.emails.send({
      from: config.EMAIL_FROM,
      to: options.to,
      subject: 'Reset your PayFlow password',
      text: buildResetPasswordText({
        displayName: options.displayName,
        resetUrl: options.resetUrl,
        expiresIn: EXPIRES_IN,
      }),
      html: buildResetPasswordHtml({
        displayName: options.displayName,
        resetUrl: options.resetUrl,
        expiresIn: EXPIRES_IN,
      }),
    });

    if (error) {
      logger.error({ err: error, to: options.to }, '[EmailService] Failed to send password reset email');
      throw new Error(error.message);
    }

    logger.info({ messageId: data?.id, to: options.to }, '[EmailService] Password reset email sent');
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton — instantiated once per process.
// ---------------------------------------------------------------------------
export const emailService = new EmailService();
