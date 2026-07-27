// ---------------------------------------------------------------------------
// EmailService — reusable, provider-agnostic transactional email sender.
//
// Design
// ------
// • Wraps Nodemailer behind a thin interface so the SMTP provider can be
//   swapped (Gmail → SendGrid, Mailgun, SES, etc.) by changing env vars only.
// • The transporter is created lazily on first use and cached for the process
//   lifetime — avoids creating a new connection pool on every request.
// • If SMTP credentials are absent (local dev without mail server) the service
//   logs a warning and skips sending rather than crashing the auth flow.
// • All public methods are async and return void — callers should await them
//   but should never let a mail failure block the HTTP response (the auth
//   service catches email errors in AuthService and continues).
//
// Usage
// -----
//   const emailService = new EmailService();
//   await emailService.sendPasswordReset({ to, displayName, resetUrl });
// ---------------------------------------------------------------------------
import nodemailer, { type Transporter } from 'nodemailer';
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
  /** Lazily initialised Nodemailer transporter — null when SMTP is not configured */
  private transporter: Transporter | null = null;

  // ── Transporter factory ──────────────────────────────────────────────────
  // Creates (once) and returns the Nodemailer transporter.
  // Returns null when SMTP credentials are absent so callers can skip sending.
  private getTransporter(): Transporter | null {
    // Already initialised
    if (this.transporter !== null) return this.transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = config;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      logger.warn(
        '[EmailService] SMTP credentials not configured — password reset emails will NOT be sent. ' +
        'Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to enable email delivery.',
      );
      return null;
    }

    // Use SMTPS (port 465) with TLS, or STARTTLS for other ports.
    // secure:true  → wraps the connection in TLS from the start (port 465)
    // secure:false → upgrades via STARTTLS (port 587 / 25)
    const secure = SMTP_PORT === 465;

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      // Reasonable defaults for transient network failures
      connectionTimeout: 10_000,  // 10 s
      greetingTimeout:  10_000,
      socketTimeout:    30_000,
    });

    return this.transporter;
  }

  // ── sendPasswordReset ────────────────────────────────────────────────────
  /**
   * Sends a password-reset email containing a styled HTML body and a
   * plain-text fallback.
   *
   * The method is intentionally fire-and-forget-safe: if SMTP is not
   * configured it logs a warning and resolves without throwing, so the
   * forgot-password endpoint can still return its generic 200 response.
   */
  async sendPasswordReset(options: SendPasswordResetOptions): Promise<void> {
    const transport = this.getTransporter();
    if (!transport) {
      // SMTP not configured — log the reset URL so devs can test locally
      logger.info(
        { resetUrl: options.resetUrl },
        `[EmailService] SMTP not configured — password reset URL for ${options.to}`,
      );
      return;
    }

    const EXPIRES_IN = '15 minutes';

    const mailOptions = {
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
    };

    try {
      const info = await transport.sendMail(mailOptions);
      logger.info({ messageId: info.messageId, to: options.to }, '[EmailService] Password reset email sent');
    } catch (err) {
      // Log the error but re-throw so AuthService can decide how to handle it.
      // AuthService catches this and still returns a generic success response
      // (email enumeration defence) while logging the underlying SMTP failure.
      logger.error({ err, to: options.to }, '[EmailService] Failed to send password reset email');
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton — instantiated once per process.
// Inject via constructor in tests so the transport can be mocked.
// ---------------------------------------------------------------------------
export const emailService = new EmailService();
