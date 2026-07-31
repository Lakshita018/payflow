// ---------------------------------------------------------------------------
// AuthService — business logic for authentication operations.
//
// Layer contract
// --------------
// • Receives plain input objects from controllers (added in a later phase).
// • Delegates ALL database access to UserRepository — never touches Prisma directly.
// • Returns plain output objects or throws typed errors — never touches Express.
// • No HTTP status codes, no req/res, no framework coupling.
//
// Dependency injection
// --------------------
// The constructor accepts UserRepository instead of instantiating it internally.
// This keeps the service unit-testable: tests inject a mock repository and
// assert on service behaviour without touching a real database.
// ---------------------------------------------------------------------------
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationType } from './notification.service';
import { ConflictError, InternalServerError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { config } from '../config/env';
import { generatePayflowId } from '../utils/payflow-id';
import { emailService } from './email/email.service';
import { logger } from '../config/logger';

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  id: string;
  email: string;
  payflowId: string;
  createdAt: Date;
}

export interface MeResult {
  id: string;
  email: string;
  payflowId: string;
  createdAt: Date;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface LogoutInput {
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordResult {
  message: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ResetPasswordResult {
  message: string;
}

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly walletRepository?: WalletRepository,
    private readonly notificationRepository?: NotificationRepository,
  ) {}

  // ── Register ──────────────────────────────────────────────────────────────
  async register(input: RegisterInput): Promise<RegisterResult> {
    // 1. Validate — throws ZodError on invalid input (→ 400 via error middleware)
    const { email, password } = registerSchema.parse(input);

    // 2. Duplicate check — done here so the error is always a clean ConflictError
    //    rather than a raw Prisma P2002 that leaks implementation detail.
    const existing = await this.userRepository.findByEmail(email);
    if (existing !== null) {
      throw new ConflictError('Email already registered');
    }

    // 3. Hash — plain-text password is never stored or returned
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

    // 4. Find a unique payflowId — generate a candidate and check the DB;
    //    retry up to 5 times to handle the (unlikely) collision case.
    let payflowId: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generatePayflowId(email);
      const taken = await this.userRepository.findByPayflowId(candidate);
      if (taken === null) {
        payflowId = candidate;
        break;
      }
    }
    if (payflowId === null) {
      throw new InternalServerError('Could not generate a unique PayFlow ID. Please try again.');
    }

    // 5. Persist
    const user = await this.userRepository.create({ email, payflowId, passwordHash });

    // 6. Auto-create wallet so the user starts with ₹0 balance
    if (this.walletRepository) {
      try {
        await this.walletRepository.create({ userId: user.id });
      } catch {
        // Wallet already exists (shouldn't happen on first register) — ignore
      }
    }

    // 7. Return — passwordHash intentionally excluded from the result shape
    return {
      id: user.id,
      email: user.email,
      payflowId: user.payflowId,
      createdAt: user.createdAt,
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(input: LoginInput): Promise<AuthTokens> {
    // 1. Validate
    const { email, password } = loginSchema.parse(input);

    // 2. Look up user — generic error so the response never reveals whether
    //    a given email exists in the system (email enumeration defence).
    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. Verify password — bcrypt.compare is timing-safe.
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 4. Issue tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 5. Hash the refresh token before persisting.
    //    The raw token is kept only in memory and returned to the client;
    //    only the bcrypt hash is stored — mirrors how passwords are handled.
    //    Single hash per user enforces the single-session-per-user design
    //    (see docs/adr/004-jwt-refresh-tokens-vs-sessions.md).
    const refreshTokenHash = await bcrypt.hash(refreshToken, config.BCRYPT_SALT_ROUNDS);
    await this.userRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

    // 6. Return both tokens — never return the hash
    return { accessToken, refreshToken };
  }

  // ── Refresh token ─────────────────────────────────────────────────────────
  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    // 1. Verify JWT signature and expiry — throws JsonWebTokenError /
    //    TokenExpiredError on failure, which the error middleware maps to 401.
    const payload = verifyRefreshToken(input.refreshToken);
    const userId = payload.sub;

    // 2. Load user
    const user = await this.userRepository.findById(userId);
    if (user === null) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 3. Guard: no stored hash means the user has logged out or never logged in
    if (user.refreshTokenHash === null || user.refreshTokenHash === undefined) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 4. Compare incoming token against the stored hash — defends against token
    //    reuse after logout and detects if the hash was rotated by a concurrent
    //    login (single-session enforcement).
    const tokenMatch = await bcrypt.compare(input.refreshToken, user.refreshTokenHash);
    if (!tokenMatch) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 5. Rotate — issue new token pair so each refresh token is single-use.
    //    Rotation limits the window of exposure if a refresh token is leaked.
    const accessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    // 6. Persist the new hash, invalidating the old token
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, config.BCRYPT_SALT_ROUNDS);
    await this.userRepository.updateRefreshTokenHash(userId, newRefreshTokenHash);

    // 7. Return — raw tokens only, never the hash
    return { accessToken, refreshToken: newRefreshToken };
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  // Clears the stored refresh token hash, invalidating the refresh token.
  // The access token is stateless (signed JWT) and expires naturally —
  // server-side revocation would require a token blocklist, which is
  // deliberately out of scope (see docs/adr/004-jwt-refresh-tokens-vs-sessions.md).
  async logout(input: LogoutInput): Promise<void> {
    // 1. Confirm the user exists before attempting to clear
    const user = await this.userRepository.findById(input.userId);
    if (user === null) {
      throw new UnauthorizedError('Invalid user');
    }

    // 2. Clear the refresh token hash — any subsequent refresh attempt will
    //    fail at the "hash is null" guard in refreshToken().
    await this.userRepository.clearRefreshTokenHash(user.id);
  }

  // ── Forgot Password ───────────────────────────────────────────────────────
  // Security: Always returns the same generic message regardless of whether
  // the email exists — this prevents email enumeration attacks.
  async forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    // 1. Validate input format
    const { email } = forgotPasswordSchema.parse(input);

    // 2. Generic message used for all cases (email found or not found)
    const GENERIC_RESPONSE: ForgotPasswordResult = {
      message: "If an account exists for this email, a password reset link has been sent.",
    };

    // 3. Look up user — if not found, return the generic response immediately
    //    without revealing that no account exists.
    const user = await this.userRepository.findByEmail(email);
    if (user === null) {
      return GENERIC_RESPONSE;
    }

    // 4. Generate a cryptographically secure 32-byte random token.
    //    The raw token (hex string) is sent in the email link.
    //    Only its SHA-256 hash is stored in the database — never the raw value.
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 5. Compute expiry — 15 minutes from now.
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // 6. Persist the hash + expiry, overwriting any previous reset request.
    //    A new request always invalidates the prior token.
    await this.userRepository.setPasswordResetToken(user.id, tokenHash, expiry);

    // 7. Build the reset URL — points the user to the frontend reset-password page.
    const resetUrl = `${config.FRONTEND_URL}/reset-pwd?token=${rawToken}`;

    // 8. Derive a friendly display name from the payflowId
    //    (e.g. "alice1234@payflow" → "alice1234").
    const displayName = user.payflowId.split('@')[0] ?? user.payflowId;

    // 9. Send the email.  We catch SMTP failures here so that they do not
    //    prevent the generic 200 response from being returned — but we do log
    //    the error so it can be investigated.
    try {
      await emailService.sendPasswordReset({ to: user.email, displayName, resetUrl });
    } catch (err) {
      logger.error(
        { err, userId: user.id },
        '[AuthService] forgotPassword — email delivery failed; token was still persisted',
      );
      // Intentionally NOT re-throwing — the token is valid; the user can
      // request another link or the admin can investigate the SMTP failure.
    }

    return GENERIC_RESPONSE;
  }

  // ── Reset Password ────────────────────────────────────────────────────────
  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    // 1. Validate input
    const { token, password } = resetPasswordSchema.parse(input);

    // 2. Hash the incoming raw token and compare against the stored hash.
    //    We never store or compare the raw token — only its SHA-256 digest.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 3. Find a user with a matching, non-expired token via the repository.
    const user = await this.userRepository.findByValidResetToken(tokenHash);

    // 4. Invalid or expired token — use a generic error to avoid leaking info.
    if (user === null) {
      throw new BadRequestError('This password reset link is invalid or has expired.');
    }

    // 5. Hash the new password
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

    // 6. Update the password AND clear the refresh token hash in a single DB
    //    write.  Clearing the refresh token hash forces all active sessions to
    //    re-authenticate — this is the session-invalidation step.
    await this.userRepository.updatePassword(user.id, passwordHash);

    // 7. Clear the reset token + expiry so the link cannot be used again.
    //    Performed AFTER the password update so a crash between the two steps
    //    does not leave the user with a new password but a still-valid token.
    await this.userRepository.clearPasswordResetToken(user.id);

    // Fire-and-forget password-changed notification
    if (this.notificationRepository) {
      void this.notificationRepository.create({
        userId: user.id,
        type:   NotificationType.PASSWORD_CHANGED,
        title:  'Password Changed',
        body:   'Your PayFlow password was changed successfully. If this wasn\'t you, contact support immediately.',
      });
    }

    return { message: 'Your password has been reset successfully. Please log in with your new password.' };
  }

  // ── Get current user (me) ─────────────────────────────────────────────────
  // Returns the authenticated user's public profile including payflowId.
  async getMe(userId: string): Promise<MeResult> {
    const user = await this.userRepository.findById(userId);
    if (user === null) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      payflowId: user.payflowId,
      createdAt: user.createdAt,
    };
  }
}
