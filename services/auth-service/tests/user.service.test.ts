// ---------------------------------------------------------------------------
// UserService — unit tests
//
// Strategy
// --------
// • All repositories fully mocked — no database.
// • Covers: recipient lookup, user search, recent contacts,
//           favourites (add/duplicate/remove/list).
// ---------------------------------------------------------------------------
import {
  UserService,
  RecipientProfile,
  PublicProfile,
  RecentContact,
} from '../src/services/user.service';
import { UserRepository } from '../src/repositories/user.repository';
import { FavouriteContactRepository } from '../src/repositories/favourite.repository';
import { TransactionRepository } from '../src/repositories/transaction.repository';
import { NotFoundError } from '../src/utils/errors';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUserRepo(): jest.Mocked<UserRepository> {
  return {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByPayflowId: jest.fn(),
    findPublicByPayflowId: jest.fn(),
    findManyPublic: jest.fn(),
    findPublicByIds: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    clearRefreshTokenHash: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
}

function makeFavRepo(): jest.Mocked<FavouriteContactRepository> {
  return {
    create: jest.fn(),
    remove: jest.fn(),
    findContactIdsByUser: jest.fn(),
  } as unknown as jest.Mocked<FavouriteContactRepository>;
}

function makeTxRepo(): jest.Mocked<TransactionRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithDetails: jest.fn(),
    findByUser: jest.fn(),
    findByUserWithDetails: jest.fn(),
    findRecentContactIds: jest.fn(),
    sumSent: jest.fn(),
    sumReceived: jest.fn(),
    sumSentThisMonth: jest.fn(),
    sumReceivedThisMonth: jest.fn(),
    sumSentToday: jest.fn(),
    findLargest: jest.fn(),
    countByUser: jest.fn(),
  } as unknown as jest.Mocked<TransactionRepository>;
}

function makeUser(overrides: Partial<{
  id: string; email: string; payflowId: string;
  passwordHash: string; refreshTokenHash: string | null;
  passwordResetToken: string | null; passwordResetExpiry: Date | null;
  createdAt: Date; updatedAt: Date;
}> = {}) {
  return {
    id: 'user-1',
    email: 'alice@example.com',
    payflowId: 'alice1234@payflow',
    passwordHash: 'hash',
    refreshTokenHash: null,
    passwordResetToken: null,
    passwordResetExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeService(
  userRepo: jest.Mocked<UserRepository>,
  favRepo: jest.Mocked<FavouriteContactRepository>,
  txRepo: jest.Mocked<TransactionRepository>,
): UserService {
  return new UserService(userRepo, favRepo, txRepo);
}

// ─────────────────────────────────────────────────────────────────────────────
// lookupRecipient()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.lookupRecipient()', () => {
  it('throws NotFoundError when payflowId does not exist', async () => {
    const userRepo = makeUserRepo();
    userRepo.findByPayflowId.mockResolvedValue(null);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    await expect(service.lookupRecipient('unknown@payflow')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns displayName, payflowId, avatar, walletExists on success', async () => {
    const userRepo = makeUserRepo();
    const user = makeUser();
    userRepo.findByPayflowId.mockResolvedValue(user);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result: RecipientProfile = await service.lookupRecipient('alice1234@payflow');

    expect(result.payflowId).toBe('alice1234@payflow');
    expect(result.displayName).toBe('alice1234');
    expect(result.avatar).toBeNull();
    expect(result.walletExists).toBe(true);
  });

  it('derives displayName from payflowId prefix', async () => {
    const userRepo = makeUserRepo();
    userRepo.findByPayflowId.mockResolvedValue(makeUser({ payflowId: 'lakshita4821@payflow' }));
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result = await service.lookupRecipient('lakshita4821@payflow');

    expect(result.displayName).toBe('lakshita4821');
  });

  it('never exposes email or passwordHash', async () => {
    const userRepo = makeUserRepo();
    const user = makeUser();
    userRepo.findByPayflowId.mockResolvedValue(user);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result = await service.lookupRecipient('alice1234@payflow');

    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('id');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// search()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.search()', () => {
  it('returns matching users as PublicProfile[]', async () => {
    const userRepo = makeUserRepo();
    userRepo.findManyPublic.mockResolvedValue([
      { payflowId: 'alice1234@payflow', email: 'alice@example.com' },
      { payflowId: 'alan9876@payflow',  email: 'alan@example.com' },
    ]);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result: PublicProfile[] = await service.search('al', 'other-user');

    expect(result).toHaveLength(2);
    expect(result[0]?.payflowId).toBe('alice1234@payflow');
  });

  it('derives displayName from payflowId prefix', async () => {
    const userRepo = makeUserRepo();
    userRepo.findManyPublic.mockResolvedValue([{ payflowId: 'harsh5678@payflow', email: 'harsh@example.com' }]);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result = await service.search('har', 'user-1');

    expect(result[0]?.displayName).toBe('harsh5678');
  });

  it('passes excludeUserId and limit=10 to repository', async () => {
    const userRepo = makeUserRepo();
    userRepo.findManyPublic.mockResolvedValue([]);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    await service.search('lak', 'user-99');

    expect(userRepo.findManyPublic).toHaveBeenCalledWith('lak', 'user-99', 10);
  });

  it('returns empty array when no matches found', async () => {
    const userRepo = makeUserRepo();
    userRepo.findManyPublic.mockResolvedValue([] as never);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result = await service.search('zzz', 'user-1');

    expect(result).toEqual([]);
  });

  it('never exposes email in search results', async () => {
    const userRepo = makeUserRepo();
    userRepo.findManyPublic.mockResolvedValue([{ payflowId: 'bob5678@payflow', email: 'bob@example.com' }]);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    const result = await service.search('bob', 'user-1');

    expect(result[0]).not.toHaveProperty('email');
    expect(result[0]).not.toHaveProperty('id');
  });

  it('throws ZodError when query is empty string', async () => {
    const service = makeService(makeUserRepo(), makeFavRepo(), makeTxRepo());
    const { ZodError } = await import('zod');
    await expect(service.search('', 'user-1')).rejects.toBeInstanceOf(ZodError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRecentContacts()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.getRecentContacts()', () => {
  it('returns empty array when user has no transactions', async () => {
    const txRepo = makeTxRepo();
    txRepo.findRecentContactIds.mockResolvedValue([]);
    const service = makeService(makeUserRepo(), makeFavRepo(), txRepo);

    const result = await service.getRecentContacts('user-1');

    expect(result).toEqual([]);
  });

  it('maps contacts with displayName, payflowId, avatar, lastInteractionAt, transactionCount', async () => {
    const txRepo = makeTxRepo();
    const userRepo = makeUserRepo();
    const interactionDate = new Date('2024-06-15');

    txRepo.findRecentContactIds.mockResolvedValue([
      { contactId: 'user-2', lastInteractionAt: interactionDate, transactionCount: 3 },
    ]);
    userRepo.findPublicByIds.mockResolvedValue([
      { id: 'user-2', payflowId: 'bob5678@payflow', email: 'bob@example.com' },
    ]);

    const service = makeService(userRepo, makeFavRepo(), txRepo);

    const result: RecentContact[] = await service.getRecentContacts('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.payflowId).toBe('bob5678@payflow');
    expect(result[0]?.displayName).toBe('bob5678');
    expect(result[0]?.transactionCount).toBe(3);
    expect(result[0]?.lastInteractionAt).toEqual(interactionDate);
    expect(result[0]?.avatar).toBeNull();
  });

  it('passes limit 10 to findRecentContactIds', async () => {
    const txRepo = makeTxRepo();
    txRepo.findRecentContactIds.mockResolvedValue([]);
    const service = makeService(makeUserRepo(), makeFavRepo(), txRepo);

    await service.getRecentContacts('user-1');

    expect(txRepo.findRecentContactIds).toHaveBeenCalledWith('user-1', 10);
  });

  it('preserves order returned by findRecentContactIds', async () => {
    const txRepo = makeTxRepo();
    const userRepo = makeUserRepo();

    txRepo.findRecentContactIds.mockResolvedValue([
      { contactId: 'user-a', lastInteractionAt: new Date('2024-06-20'), transactionCount: 1 },
      { contactId: 'user-b', lastInteractionAt: new Date('2024-06-10'), transactionCount: 2 },
    ]);
    userRepo.findPublicByIds.mockResolvedValue([
      { id: 'user-a', payflowId: 'anna9001@payflow', email: 'anna@example.com' },
      { id: 'user-b', payflowId: 'ben4321@payflow',  email: 'ben@example.com'  },
    ]);

    const service = makeService(userRepo, makeFavRepo(), txRepo);

    const result = await service.getRecentContacts('user-1');

    expect(result[0]?.payflowId).toBe('anna9001@payflow');
    expect(result[1]?.payflowId).toBe('ben4321@payflow');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// addFavourite()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.addFavourite()', () => {
  it('throws NotFoundError when contact user does not exist (neither UUID nor payflowId)', async () => {
    const userRepo = makeUserRepo();
    // Both findById and findByPayflowId return null
    userRepo.findById.mockResolvedValue(null);
    userRepo.findByPayflowId.mockResolvedValue(null);
    const service = makeService(userRepo, makeFavRepo(), makeTxRepo());

    await expect(service.addFavourite('user-1', 'ghost')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('creates the favourite when contact found by UUID', async () => {
    const userRepo = makeUserRepo();
    const favRepo = makeFavRepo();
    userRepo.findById.mockResolvedValue(makeUser({ id: 'user-2' }));
    favRepo.create.mockResolvedValue({
      id: 'fav-1', userId: 'user-1', contactUserId: 'user-2', createdAt: new Date(),
    });
    const service = makeService(userRepo, favRepo, makeTxRepo());

    await service.addFavourite('user-1', 'user-2');

    expect(favRepo.create).toHaveBeenCalledWith('user-1', 'user-2');
  });

  it('is idempotent — silently succeeds when favourite already exists (P2002)', async () => {
    const userRepo = makeUserRepo();
    const favRepo = makeFavRepo();
    userRepo.findById.mockResolvedValue(makeUser({ id: 'user-2' }));
    favRepo.create.mockRejectedValue(new Error('Unique constraint failed'));
    const service = makeService(userRepo, favRepo, makeTxRepo());

    // Should NOT throw — idempotent behaviour
    await expect(service.addFavourite('user-1', 'user-2')).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeFavourite()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.removeFavourite()', () => {
  it('calls repository remove and resolves without error', async () => {
    const userRepo = makeUserRepo();
    const favRepo = makeFavRepo();
    userRepo.findById.mockResolvedValue(makeUser({ id: 'user-2' }));
    favRepo.remove.mockResolvedValue(null);
    const service = makeService(userRepo, favRepo, makeTxRepo());

    await expect(service.removeFavourite('user-1', 'user-2')).resolves.toBeUndefined();
    expect(favRepo.remove).toHaveBeenCalledWith('user-1', 'user-2');
  });

  it('is idempotent — does not throw when user not found', async () => {
    const userRepo = makeUserRepo();
    const favRepo = makeFavRepo();
    userRepo.findById.mockResolvedValue(null);
    userRepo.findByPayflowId.mockResolvedValue(null);
    favRepo.remove.mockResolvedValue(null);
    const service = makeService(userRepo, favRepo, makeTxRepo());

    await expect(service.removeFavourite('user-1', 'nobody')).resolves.toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFavourites()
// ─────────────────────────────────────────────────────────────────────────────

describe('UserService.getFavourites()', () => {
  it('returns empty array when user has no favourites', async () => {
    const favRepo = makeFavRepo();
    favRepo.findContactIdsByUser.mockResolvedValue([]);
    const service = makeService(makeUserRepo(), favRepo, makeTxRepo());

    const result = await service.getFavourites('user-1');

    expect(result).toEqual([]);
  });

  it('returns list of PublicProfiles for each favourite', async () => {
    const favRepo = makeFavRepo();
    const userRepo = makeUserRepo();
    favRepo.findContactIdsByUser.mockResolvedValue(['user-2', 'user-3']);
    userRepo.findPublicByIds.mockResolvedValue([
      { id: 'user-2', payflowId: 'bob5678@payflow',   email: 'bob@example.com'   },
      { id: 'user-3', payflowId: 'carol321@payflow', email: 'carol@example.com' },
    ]);
    const service = makeService(userRepo, favRepo, makeTxRepo());

    const result: PublicProfile[] = await service.getFavourites('user-1');

    expect(result).toHaveLength(2);
    expect(result[0]?.payflowId).toBe('bob5678@payflow');
    expect(result[0]?.displayName).toBe('bob5678');
    expect(result[1]?.payflowId).toBe('carol321@payflow');
  });

  it('never exposes email or id in favourites list', async () => {
    const favRepo = makeFavRepo();
    const userRepo = makeUserRepo();
    favRepo.findContactIdsByUser.mockResolvedValue(['user-2']);
    userRepo.findPublicByIds.mockResolvedValue([
      { id: 'user-2', payflowId: 'bob5678@payflow', email: 'bob@example.com' },
    ]);
    const service = makeService(userRepo, favRepo, makeTxRepo());

    const result = await service.getFavourites('user-1');

    expect(result[0]).not.toHaveProperty('email');
    expect(result[0]).not.toHaveProperty('id');
  });
});
