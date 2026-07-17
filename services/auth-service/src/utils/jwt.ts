// ---------------------------------------------------------------------------
// JWT utilities — token generation and verification.
//
// Design decisions
// ----------------
// • Two separate token types with separate secrets so that a compromised
//   access token cannot be used to forge a refresh token and vice versa.
// • Access token  — short-lived (default 15 m), stateless, verified at the
//   API Gateway / middleware. Carries only what is needed: userId + type.
// • Refresh token — long-lived (default 7 d), opaque from the client's
//   perspective. A bcrypt hash is stored in the DB; every use is checked
//   against that hash (see AuthService.refreshToken).
// • Token type is embedded in the payload so that an access token cannot be
//   presented as a refresh token and vice versa (type confusion attack).
// • verify* functions return a typed payload or throw — callers decide how to
//   handle the error (the middleware layer converts it to 401).
//
// No side-effects — this file only imports config and jsonwebtoken; it never
// touches the database or the request/response cycle.
// ---------------------------------------------------------------------------
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
  sub: string;        // user id — standard JWT subject claim
  type: 'access';
  iat?: number;       // issued at  — set automatically by jsonwebtoken
  exp?: number;       // expiry     — set automatically by jsonwebtoken
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

/**
 * Issues a signed access token for the given user.
 * The token is valid for JWT_ACCESS_EXPIRES_IN (default: 15 m).
 */
export function generateAccessToken(userId: string): string {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'access',
  };
  // Cast to `string` satisfies the `StringValue` constraint at runtime;
  // `exactOptionalPropertyTypes` prevents us from using the optional property
  // type directly, so we pass expiresIn as a positionally-typed Record.
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES_IN as string & {},
  } as SignOptions);
}

/**
 * Issues a signed refresh token for the given user.
 * The token is valid for JWT_REFRESH_EXPIRES_IN (default: 7 d).
 */
export function generateRefreshToken(userId: string): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    type: 'refresh',
  };
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as string & {},
  } as SignOptions);
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

/**
 * Verifies an access token signature and expiry.
 * Throws jsonwebtoken.JsonWebTokenError / TokenExpiredError on failure.
 * Throws a plain Error if the token type claim is wrong (type confusion guard).
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }
  return decoded;
}

/**
 * Verifies a refresh token signature and expiry.
 * Throws jsonwebtoken.JsonWebTokenError / TokenExpiredError on failure.
 * Throws a plain Error if the token type claim is wrong (type confusion guard).
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }
  return decoded;
}
