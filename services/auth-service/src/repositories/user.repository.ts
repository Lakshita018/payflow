// ---------------------------------------------------------------------------
// UserRepository — database operations for the User model.
//
// This layer is the ONLY place in the auth service that issues Prisma queries.
// It contains zero business logic — no password hashing, no JWT, no HTTP.
//
// Dependency injection
// --------------------
// The constructor accepts a PrismaClient instance rather than importing the
// module-level singleton directly. This allows unit tests to pass a mocked
// client without touching the real database or the global singleton.
//
// Method contracts
// ----------------
//   create()                 — inserts a new user row; throws on duplicate email (P2002)
//   findByEmail()            — returns User | null; never throws on not-found
//   findById()               — returns User | null; never throws on not-found
//   updateRefreshTokenHash() — sets refreshTokenHash to the provided value
//   clearRefreshTokenHash()  — sets refreshTokenHash to null (logout)
// ---------------------------------------------------------------------------
import { PrismaClient, User } from '../generated/prisma/client';

// ---------------------------------------------------------------------------
// Public-safe user shape — excludes all sensitive fields.
// Used by discovery endpoints; never contains password/tokens.
// displayName is derived in the service layer from the payflowId prefix.
// ---------------------------------------------------------------------------
export interface PublicUser {
  payflowId: string;
}

// ---------------------------------------------------------------------------
// Input types — plain objects; no Prisma types leak outside this file.
// Services pass these shapes in; the repository maps them to Prisma calls.
// ---------------------------------------------------------------------------
export interface CreateUserInput {
  email: string;
  payflowId: string;
  passwordHash: string;
}

// ---------------------------------------------------------------------------
// UserRepository
// ---------------------------------------------------------------------------
export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────
  // Prisma throws PrismaClientKnownRequestError with code P2002 if the email
  // is already taken. The service layer is responsible for catching that and
  // converting it to a ConflictError — this repository does not catch it.
  async create(input: CreateUserInput): Promise<User> {
    return this.db.user.create({
      data: {
        email: input.email,
        payflowId: input.payflowId,
        passwordHash: input.passwordHash,
      },
    });
  }

  // ── Reads ─────────────────────────────────────────────────────────────────
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async findByPayflowId(payflowId: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { payflowId } });
  }

  // Returns only safe public fields for a single user by payflowId.
  async findPublicByPayflowId(payflowId: string): Promise<PublicUser | null> {
    return this.db.user.findUnique({
      where: { payflowId },
      select: { payflowId: true },
    });
  }

  // Case-insensitive partial search on payflowId.
  // Excludes the requesting user. Returns at most `limit` results.
  findManyPublic(
    query: string,
    excludeUserId: string,
    limit: number,
  ): Promise<PublicUser[]> {
    return this.db.user.findMany({
      where: {
        id: { not: excludeUserId },
        payflowId: { contains: query, mode: 'insensitive' },
      },
      select: { payflowId: true },
      take: limit,
    });
  }

  // Bulk fetch public profiles by id list — used for recent contacts & favourites.
  findPublicByIds(ids: string[]): Promise<(PublicUser & { id: string })[]> {
    return this.db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, payflowId: true },
    });
  }

  // ── Refresh token management ───────────────────────────────────────────────
  // Called after a successful login — stores the bcrypt hash of the newly
  // issued refresh token. Overwrites any existing hash, which invalidates the
  // previous session (deliberate single-session-per-user design).
  // See docs/adr/004-jwt-refresh-tokens-vs-sessions.md.
  async updateRefreshTokenHash(id: string, refreshTokenHash: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  // Called on logout — sets refreshTokenHash to null so the refresh token
  // can no longer be used to obtain a new access token.
  async clearRefreshTokenHash(id: string): Promise<User> {
    return this.db.user.update({
      where: { id },
      data: { refreshTokenHash: null },
    });
  }
}
