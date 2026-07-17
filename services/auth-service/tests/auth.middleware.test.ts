// ---------------------------------------------------------------------------
// authMiddleware unit tests
//
// Strategy
// --------
// • createAuthMiddleware() is called with a mock UserRepository.
// • verifyAccessToken from src/utils/jwt is mocked via jest.mock.
// • The Express req / res / next triple is created as lightweight stubs.
// • No database, no HTTP server.
// ---------------------------------------------------------------------------
import { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../src/middlewares/auth.middleware';
import { UserRepository } from '../src/repositories/user.repository';
import { UnauthorizedError } from '../src/utils/errors';

// ── Mock jwt utils ────────────────────────────────────────────────────────────
jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

import * as jwtUtils from '../src/utils/jwt';
const mockVerify = jwtUtils.verifyAccessToken as jest.MockedFunction<typeof jwtUtils.verifyAccessToken>;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    user: undefined,
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

function makeNext(): jest.MockedFunction<NextFunction> {
  return jest.fn();
}

function makeUser() {
  return {
    id: 'user-uuid-1',
    email: 'alice@example.com',
    payflowId: 'alice1234@payflow',
    passwordHash: 'hash',
    refreshTokenHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('authMiddleware', () => {
  let repo: jest.Mocked<UserRepository>;
  let middleware: ReturnType<typeof createAuthMiddleware>;

  beforeEach(() => {
    repo = makeRepo();
    middleware = createAuthMiddleware(repo);
  });

  it('calls next(UnauthorizedError) when Authorization header is missing', async () => {
    const req = makeReq();
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next(UnauthorizedError) when header is not Bearer format', async () => {
    const req = makeReq('Basic abc123');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next(UnauthorizedError) when Bearer token is missing', async () => {
    const req = makeReq('Bearer ');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('calls next(error) when verifyAccessToken throws (invalid JWT)', async () => {
    mockVerify.mockImplementation(() => { throw new Error('jwt malformed'); });
    const req = makeReq('Bearer bad.token.here');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((next.mock.calls[0]?.[0] as unknown as Error).message).toBe('jwt malformed');
  });

  it('calls next(error) when verifyAccessToken throws (expired JWT)', async () => {
    mockVerify.mockImplementation(() => { throw new Error('jwt expired'); });
    const req = makeReq('Bearer expired.token');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((next.mock.calls[0]?.[0] as unknown as Error).message).toBe('jwt expired');
  });

  it('calls next(UnauthorizedError) when user no longer exists in DB', async () => {
    mockVerify.mockReturnValue({ sub: 'ghost-id', type: 'access' });
    repo.findById.mockResolvedValue(null);
    const req = makeReq('Bearer valid.token');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  });

  it('attaches req.user and calls next() with no arguments on valid token', async () => {
    const user = makeUser();
    mockVerify.mockReturnValue({ sub: user.id, type: 'access' });
    repo.findById.mockResolvedValue(user);
    const req = makeReq('Bearer valid.token');
    const next = makeNext();

    await middleware(req, makeRes(), next);

    expect(next).toHaveBeenCalledWith();           // called with no error
    expect(req.user).toEqual({ id: user.id, email: user.email });
  });

  it('req.user.id matches the sub claim in the token', async () => {
    const user = makeUser();
    mockVerify.mockReturnValue({ sub: user.id, type: 'access' });
    repo.findById.mockResolvedValue(user);
    const req = makeReq('Bearer some.access.token');

    await middleware(req, makeRes(), makeNext());

    expect(req.user?.id).toBe(user.id);
    expect(repo.findById).toHaveBeenCalledWith(user.id);
  });
});
