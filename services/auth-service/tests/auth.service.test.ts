// ---------------------------------------------------------------------------
// AuthService unit tests
//
// Strategy
// --------
// • UserRepository is fully mocked — no database, no Prisma.
// • bcrypt is mocked — hash/compare return predictable values synchronously.
// • JWT utilities are mocked — generation returns fixed strings; verification
//   returns a controlled payload or throws on demand.
// • config is NOT mocked — it reads real env vars at module load time.
//   BCRYPT_SALT_ROUNDS defaults to 12 in the Zod schema so no .env needed.
//
// Each test group is isolated: jest.clearAllMocks() runs before every test
// via the jest.config.js `clearMocks: true` option.
// ---------------------------------------------------------------------------

import { ZodError } from 'zod';
import { AuthService } from '../src/services/auth.service';
import { UserRepository } from '../src/repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../src/utils/errors';

// ── Module mocks (hoisted by Jest before imports) ────────────────────────────

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../src/utils/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

// Import the mocked modules so we can type-cast them for assertions
import bcrypt from 'bcrypt';
import * as jwtUtils from '../src/utils/jwt';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwtUtils as jest.Mocked<typeof jwtUtils>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Builds a mock UserRepository with all methods as jest.fn(). */
function makeRepo(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByPayflowId: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    clearRefreshTokenHash: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

/** Returns a minimal User-shaped object for use in mock resolutions. */
function makeUser(overrides: Partial<{
  id: string;
  email: string;
  payflowId: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 'user-uuid-1',
    email: 'alice@example.com',
    payflowId: 'alice1234@payflow',
    passwordHash: 'hashed-password',
    refreshTokenHash: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService.register()', () => {
  let repo: jest.Mocked<UserRepository>;
  let service: AuthService;

  beforeEach(() => {
    repo = makeRepo();
    service = new AuthService(repo);
    mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
    // findByPayflowId must return null so the uniqueness loop always finds a free ID
    repo.findByPayflowId.mockResolvedValue(null);
  });

  it('creates a user and returns id, email, createdAt — no passwordHash', async () => {
    const user = makeUser();
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(user);

    const result = await service.register({ email: 'alice@example.com', password: 'password123' });

    expect(repo.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      }),
    );

    expect(result).toEqual({ id: user.id, email: user.email, payflowId: user.payflowId, createdAt: user.createdAt });
    // passwordHash must never appear in the result
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('normalises email to lowercase before lookup and storage', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeUser({ email: 'alice@example.com' }));

    await service.register({ email: 'Alice@Example.COM', password: 'password123' });

    expect(repo.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com' }),
    );
  });

  it('throws ConflictError when email is already registered', async () => {
    repo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      service.register({ email: 'alice@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws ZodError for invalid email', async () => {
    await expect(
      service.register({ email: 'not-an-email', password: 'password123' }),
    ).rejects.toBeInstanceOf(ZodError);

    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it('throws ZodError when password is shorter than 8 characters', async () => {
    await expect(
      service.register({ email: 'alice@example.com', password: 'short' }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('throws ZodError when password exceeds 128 characters', async () => {
    await expect(
      service.register({ email: 'alice@example.com', password: 'a'.repeat(129) }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService.login()', () => {
  let repo: jest.Mocked<UserRepository>;
  let service: AuthService;

  beforeEach(() => {
    repo = makeRepo();
    service = new AuthService(repo);
    mockJwt.generateAccessToken.mockReturnValue('access-token');
    mockJwt.generateRefreshToken.mockReturnValue('refresh-token');
    mockBcrypt.hash.mockResolvedValue('hashed-refresh-token' as never);
    repo.updateRefreshTokenHash.mockResolvedValue(makeUser());
  });

  it('returns accessToken and refreshToken on valid credentials', async () => {
    const user = makeUser({ passwordHash: 'hashed-password' });
    repo.findByEmail.mockResolvedValue(user);
    mockBcrypt.compare.mockResolvedValue(true as never);

    const result = await service.login({ email: 'alice@example.com', password: 'password123' });

    expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(mockJwt.generateAccessToken).toHaveBeenCalledWith(user.id);
    expect(mockJwt.generateRefreshToken).toHaveBeenCalledWith(user.id);
  });

  it('hashes the refresh token and persists it — raw token never stored', async () => {
    repo.findByEmail.mockResolvedValue(makeUser());
    mockBcrypt.compare.mockResolvedValue(true as never);

    await service.login({ email: 'alice@example.com', password: 'password123' });

    // bcrypt.hash is called with the raw refresh token (not the access token)
    expect(mockBcrypt.hash).toHaveBeenCalledWith('refresh-token', expect.any(Number));
    // The hash is persisted, not the raw token
    expect(repo.updateRefreshTokenHash).toHaveBeenCalledWith('user-uuid-1', 'hashed-refresh-token');
  });

  it('throws UnauthorizedError when email does not exist', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(mockBcrypt.compare).not.toHaveBeenCalled();
  });

  it('uses the same error message for missing email and wrong password (enumeration defence)', async () => {
    repo.findByEmail.mockResolvedValue(null);
    let msgNoUser = '';
    await service
      .login({ email: 'ghost@example.com', password: 'password123' })
      .catch((e: unknown) => { msgNoUser = (e as Error).message; });

    repo.findByEmail.mockResolvedValue(makeUser());
    mockBcrypt.compare.mockResolvedValue(false as never);
    let msgBadPass = '';
    await service
      .login({ email: 'alice@example.com', password: 'wrongpassword' })
      .catch((e: unknown) => { msgBadPass = (e as Error).message; });

    expect(msgNoUser).toBe('Invalid email or password');
    expect(msgBadPass).toBe('Invalid email or password');
  });

  it('throws UnauthorizedError when password is incorrect', async () => {
    repo.findByEmail.mockResolvedValue(makeUser());
    mockBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.login({ email: 'alice@example.com', password: 'wrongpassword' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(repo.updateRefreshTokenHash).not.toHaveBeenCalled();
  });

  it('throws ZodError for invalid email format', async () => {
    await expect(
      service.login({ email: 'bad-email', password: 'password123' }),
    ).rejects.toBeInstanceOf(ZodError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService.refreshToken()', () => {
  let repo: jest.Mocked<UserRepository>;
  let service: AuthService;

  const STORED_HASH = 'stored-refresh-hash';

  beforeEach(() => {
    repo = makeRepo();
    service = new AuthService(repo);
    mockJwt.verifyRefreshToken.mockReturnValue({ sub: 'user-uuid-1', type: 'refresh' });
    mockJwt.generateAccessToken.mockReturnValue('new-access-token');
    mockJwt.generateRefreshToken.mockReturnValue('new-refresh-token');
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockBcrypt.hash.mockResolvedValue('new-hashed-refresh-token' as never);
    repo.updateRefreshTokenHash.mockResolvedValue(makeUser());
  });

  it('returns a new token pair on valid refresh token', async () => {
    repo.findById.mockResolvedValue(makeUser({ refreshTokenHash: STORED_HASH }));

    const result = await service.refreshToken({ refreshToken: 'valid-refresh-token' });

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('rotates the token — persists a new hash, not the old one', async () => {
    repo.findById.mockResolvedValue(makeUser({ refreshTokenHash: STORED_HASH }));

    await service.refreshToken({ refreshToken: 'valid-refresh-token' });

    expect(mockBcrypt.hash).toHaveBeenCalledWith('new-refresh-token', expect.any(Number));
    expect(repo.updateRefreshTokenHash).toHaveBeenCalledWith('user-uuid-1', 'new-hashed-refresh-token');
  });

  it('throws when verifyRefreshToken rejects the JWT', async () => {
    mockJwt.verifyRefreshToken.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await expect(
      service.refreshToken({ refreshToken: 'bad-token' }),
    ).rejects.toThrow('jwt malformed');

    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when user no longer exists', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.refreshToken({ refreshToken: 'valid-refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when refreshTokenHash is null (logged out)', async () => {
    repo.findById.mockResolvedValue(makeUser({ refreshTokenHash: null }));

    await expect(
      service.refreshToken({ refreshToken: 'valid-refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(mockBcrypt.compare).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when hash comparison fails (token reuse / rotated)', async () => {
    repo.findById.mockResolvedValue(makeUser({ refreshTokenHash: STORED_HASH }));
    mockBcrypt.compare.mockResolvedValue(false as never);

    await expect(
      service.refreshToken({ refreshToken: 'stale-refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(repo.updateRefreshTokenHash).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService.logout()', () => {
  let repo: jest.Mocked<UserRepository>;
  let service: AuthService;

  beforeEach(() => {
    repo = makeRepo();
    service = new AuthService(repo);
    repo.clearRefreshTokenHash.mockResolvedValue(makeUser());
  });

  it('calls clearRefreshTokenHash and returns void on success', async () => {
    repo.findById.mockResolvedValue(makeUser());

    const result = await service.logout({ userId: 'user-uuid-1' });

    expect(repo.findById).toHaveBeenCalledWith('user-uuid-1');
    expect(repo.clearRefreshTokenHash).toHaveBeenCalledWith('user-uuid-1');
    expect(result).toBeUndefined();
  });

  it('throws UnauthorizedError when user does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.logout({ userId: 'non-existent' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(repo.clearRefreshTokenHash).not.toHaveBeenCalled();
  });
});
