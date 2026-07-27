// ---------------------------------------------------------------------------
// resetPassword.ts — HTML + plain-text email templates for password reset.
//
// Returns both representations so Nodemailer can send multipart/alternative
// messages that work in every mail client (HTML with a plain-text fallback).
// ---------------------------------------------------------------------------

export interface ResetPasswordTemplateData {
  /** The recipient's display name (e.g. "alice1234" from their payflowId) */
  displayName: string;
  /** The full, ready-to-use reset URL including the token query parameter */
  resetUrl: string;
  /** Token expiry in human-readable form (e.g. "15 minutes") */
  expiresIn: string;
}

// ---------------------------------------------------------------------------
// HTML version — clean, single-column layout that renders well in webmail
// and desktop clients.  No external resources — all CSS is inlined.
// ---------------------------------------------------------------------------
export function buildResetPasswordHtml(data: ResetPasswordTemplateData): string {
  const { displayName, resetUrl, expiresIn } = data;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your PayFlow password</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95 0%,#6d28d9 100%);padding:32px 40px;text-align:center;">
              <span style="display:inline-block;width:48px;height:48px;line-height:48px;background:rgba(255,255,255,0.15);border-radius:14px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">P</span>
              <p style="margin:12px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">PayFlow</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1f2328;letter-spacing:-0.3px;">Reset your password</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#57606a;">Hi <strong>${escapeHtml(displayName)}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#57606a;">
                We received a request to reset your PayFlow password. Click the button below to choose a new one.
                This link will expire in <strong>${escapeHtml(expiresIn)}</strong>.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 50%,#4f46e5 100%);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;letter-spacing:-0.1px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 8px;font-size:13px;color:#57606a;">
                If the button doesn&rsquo;t work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#6d28d9;">${resetUrl}</a>
              </p>

              <hr style="margin:0 0 24px;border:none;border-top:1px solid #e5e7eb;" />

              <!-- Security notice -->
              <p style="margin:0;font-size:13px;line-height:1.6;color:#57606a;">
                If you didn&rsquo;t request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#57606a;">
                Regards,<br /><strong>PayFlow Team</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Plain-text fallback — used by clients that cannot render HTML.
// ---------------------------------------------------------------------------
export function buildResetPasswordText(data: ResetPasswordTemplateData): string {
  const { displayName, resetUrl, expiresIn } = data;
  return `Hi ${displayName},

We received a request to reset your PayFlow password.

Click the link below to reset it:

${resetUrl}

This link expires in ${expiresIn}.

If you didn't request this, simply ignore this email. Your password will remain unchanged.

Regards,
PayFlow Team`;
}

// ---------------------------------------------------------------------------
// Minimal HTML-escaping for values interpolated into the HTML template.
// Only the fields that originate from user data need escaping; resetUrl is
// generated internally and is safe.
// ---------------------------------------------------------------------------
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
