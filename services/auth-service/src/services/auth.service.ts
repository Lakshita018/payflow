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
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { ConflictError, InternalServerError, UnauthorizedError } from '../utils/errors';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { config } from '../config/env';
import { generatePayflowId } from '../utils/payflow-id';

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

// ---------------------------------------------------------------------------
// AuthService
// ---------------------------------------------------------------------------
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

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

    // 6. Return — passwordHash intentionally excluded from the result shape
    return {
      id: user.id,
      email: user.email,
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
}
