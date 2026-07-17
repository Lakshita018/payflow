// ---------------------------------------------------------------------------
// authMiddleware — JWT Bearer token authentication.
//
// Responsibilities
// ----------------
// • Reads the Authorization header.
// • Validates the "Bearer <token>" format.
// • Verifies the access token using the existing verifyAccessToken() utility.
// • Attaches { id, email } to req.user on success.
// • Calls next(err) with an UnauthorizedError on any failure so the global
//   error middleware handles the response — no direct res.json() here.
//
// JWT verification is NOT duplicated. verifyAccessToken() in src/utils/jwt.ts
// is the single source of truth for signature + expiry + type checking.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { UserRepository } from '../repositories/user.repository';

// ---------------------------------------------------------------------------
// authMiddleware factory — accepts a UserRepository so the authenticated
// user's email can be attached to req.user without coupling to the singleton.
// ---------------------------------------------------------------------------
export function createAuthMiddleware(userRepository: UserRepository) {
  return async function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // 1. Read and validate Authorization header format
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('Missing Authorization header');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
        throw new UnauthorizedError('Authorization header must be "Bearer <token>"');
      }

      const token = parts[1];

      // 2. Verify JWT — throws JsonWebTokenError / TokenExpiredError on failure
      const payload = verifyAccessToken(token);

      // 3. Load the user to confirm they still exist and get their email
      const user = await userRepository.findById(payload.sub);
      if (user === null) {
        throw new UnauthorizedError('User not found');
      }

      // 4. Attach to req.user — downstream handlers read req.user.id
      req.user = { id: user.id, email: user.email };

      next();
    } catch (err) {
      next(err);
    }
  };
}
