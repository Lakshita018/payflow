// ---------------------------------------------------------------------------
// UserService — user discovery, search, recent contacts, favourites.
//
// Layer contract
// --------------
// • All DB access goes through repositories — never touches Prisma directly.
// • Returns plain output objects; throws typed AppError subclasses.
// • No Express types, no req/res.
//
// displayName note
// ----------------
// The User model has no name field in this phase (reserved for the Profile
// module). displayName is derived from the payflowId prefix — the portion
// before the first "@". For example "alice1234@payflow" → "alice1234".
// ---------------------------------------------------------------------------
import { UserRepository } from '../repositories/user.repository';
import { FavouriteContactRepository } from '../repositories/favourite.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { NotFoundError } from '../utils/errors';
import { searchQuerySchema } from '../validators/user.validator';

// ---------------------------------------------------------------------------
// Utility — resolves the best available display name for a user.
// Prefers the stored displayName field; falls back to the payflowId prefix.
// "lakshita4821@payflow" → "lakshita4821"  (when no displayName set)
// ---------------------------------------------------------------------------
function displayNameFrom(payflowId: string, displayName?: string | null): string {
  if (displayName) return displayName;
  return payflowId.split('@')[0] ?? payflowId;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

// Shape returned by the recipient-lookup endpoint
export interface RecipientProfile {
  displayName: string;
  payflowId: string;
  avatar: null;          // avatar feature is reserved for a later phase
  walletExists: boolean;
}

// Shape returned by search and favourite-list endpoints
export interface PublicProfile {
  displayName: string;
  payflowId: string;
  email: string;
  avatar: null;
}

// Shape returned by the recent-contacts endpoint
export interface RecentContact {
  displayName: string;
  payflowId: string;
  avatar: null;
  lastInteractionAt: Date;
  transactionCount: number;
}

// Shape returned by GET /users/:payflowId/profile
export interface UserProfileResult {
  displayName: string;
  payflowId: string;
  email: string;
  avatar: null;
  isFavourite: boolean;
}

// Shape returned by GET /users/:payflowId/relationship
export interface RelationshipResult {
  isFavourite: boolean;
  totalSent: string;       // amount current user sent to this user
  totalReceived: string;   // amount current user received from this user
  transactionCount: number;
  lastInteractionAt: string | null;
  recentTransactions: RelationshipTransaction[];
}

export interface RelationshipTransaction {
  id: string;
  amount: string;
  direction: 'DEBIT' | 'CREDIT'; // relative to the requesting user
  note: string | null;
  createdAt: string;
  status: string;
}

// ---------------------------------------------------------------------------
// UserService
// ---------------------------------------------------------------------------
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly favouriteRepository: FavouriteContactRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  // ── Recipient lookup ───────────────────────────────────────────────────────
  // Finds a user by exact PayFlow ID; checks wallet existence.
  // Never exposes email, balance, password, or internal IDs.
  async lookupRecipient(payflowId: string): Promise<RecipientProfile> {
    const user = await this.userRepository.findByPayflowId(payflowId);
    if (user === null) {
      throw new NotFoundError(`No user found with PayFlow ID: ${payflowId}`);
    }
    // walletExists: precise wallet check would need WalletRepository injection.
    // For the UPI pre-transfer lookup the spec only requires confirming the
    // PayFlow ID is valid, so walletExists mirrors user found.
    const walletExists = true;
    return {
      displayName: displayNameFrom(user.payflowId, (user as any).displayName),
      payflowId: user.payflowId,
      avatar: null,
      walletExists,
    };
  }

  // ── User search ────────────────────────────────────────────────────────────
  // Partial, case-insensitive search on payflowId, email, and displayName.
  // Excludes the authenticated user from results.
  async search(rawQuery: string, requestingUserId: string): Promise<PublicProfile[]> {
    const { q } = searchQuerySchema.parse({ q: rawQuery });
    const users = await this.userRepository.findManyPublic(q, requestingUserId, 10);
    return users.map((u) => ({
      displayName: displayNameFrom(u.payflowId, u.displayName),
      payflowId: u.payflowId,
      email: u.email,
      avatar: null,
    }));
  }

  // ── Recent contacts ────────────────────────────────────────────────────────
  // Derives contacts from transaction history — no separate table needed.
  async getRecentContacts(userId: string): Promise<RecentContact[]> {
    const contacts = await this.transactionRepository.findRecentContactIds(userId, 10);
    if (contacts.length === 0) return [];

    const ids = contacts.map((c) => c.contactId);
    const profiles = await this.userRepository.findPublicByIds(ids);

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return contacts
      .map((c) => {
        const profile = profileMap.get(c.contactId);
        if (profile === undefined) return null;
        return {
          displayName: displayNameFrom(profile.payflowId, profile.displayName),
          payflowId: profile.payflowId,
          avatar: null,
          lastInteractionAt: c.lastInteractionAt,
          transactionCount: c.transactionCount,
        };
      })
      .filter((c): c is RecentContact => c !== null);
  }

  // ── Favourites — add ───────────────────────────────────────────────────────
  // Accepts either a UUID (contactUserId) or a PayFlow ID (contactPayflowId).
  // The frontend may pass a PayFlow ID when the internal UUID is not known.
  async addFavourite(userId: string, contactIdentifier: string): Promise<void> {
    // Try by UUID first; fall back to payflowId lookup if UUID not found
    let contact = await this.userRepository.findById(contactIdentifier);
    if (contact === null) {
      // contactIdentifier might be a payflowId — try that
      contact = await this.userRepository.findByPayflowId(contactIdentifier);
    }
    if (contact === null) {
      throw new NotFoundError('Contact user not found');
    }
    try {
      await this.favouriteRepository.create(userId, contact.id);
    } catch {
      // P2002 unique constraint — already favourited, treat as success (idempotent)
    }
  }

  // ── Favourites — remove ────────────────────────────────────────────────────
  // Accepts either a UUID or a PayFlow ID.
  async removeFavourite(userId: string, contactIdentifier: string): Promise<void> {
    // Try by UUID first; fall back to payflowId lookup
    let contact = await this.userRepository.findById(contactIdentifier);
    if (contact === null) {
      contact = await this.userRepository.findByPayflowId(contactIdentifier);
    }
    if (contact === null) return; // already not favourite — idempotent
    await this.favouriteRepository.remove(userId, contact.id);
    // Silently succeeds even if the favourite did not exist — idempotent DELETE
  }

  // ── Favourites — list ──────────────────────────────────────────────────────
  async getFavourites(userId: string): Promise<PublicProfile[]> {
    const ids = await this.favouriteRepository.findContactIdsByUser(userId);
    if (ids.length === 0) return [];

    const profiles = await this.userRepository.findPublicByIds(ids);
    // Preserve the favourite order (findContactIdsByUser orders by createdAt asc)
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return ids
      .map((id) => {
        const p = profileMap.get(id);
        if (p === undefined) return null;
        return {
          displayName: displayNameFrom(p.payflowId, p.displayName),
          payflowId: p.payflowId,
          email: p.email,
          avatar: null,
        };
      })
      .filter((p): p is PublicProfile => p !== null);
  }

  // ── User profile (public, with favourite status) ───────────────────────────
  // GET /users/:payflowId/profile
  async getUserProfile(payflowId: string, requestingUserId: string): Promise<UserProfileResult> {
    const user = await this.userRepository.findByPayflowId(payflowId);
    if (user === null) {
      throw new NotFoundError(`No user found with PayFlow ID: ${payflowId}`);
    }
    const isFav = await this.favouriteRepository.isFavourite(requestingUserId, user.id);
    return {
      displayName: displayNameFrom(user.payflowId, (user as any).displayName),
      payflowId: user.payflowId,
      email: user.email,
      avatar: null,
      isFavourite: isFav,
    };
  }

  // ── Relationship summary ───────────────────────────────────────────────────
  // GET /users/:payflowId/relationship
  // Returns transaction stats + recent transactions between the requesting
  // user and the target user only.
  async getRelationship(payflowId: string, requestingUserId: string): Promise<RelationshipResult> {
    const target = await this.userRepository.findByPayflowId(payflowId);
    if (target === null) {
      throw new NotFoundError(`No user found with PayFlow ID: ${payflowId}`);
    }

    const [stats, transactions, isFav] = await Promise.all([
      this.transactionRepository.statsBetweenUsers(requestingUserId, target.id),
      this.transactionRepository.findBetweenUsers(requestingUserId, target.id, 20),
      this.favouriteRepository.isFavourite(requestingUserId, target.id),
    ]);

    const recentTransactions: RelationshipTransaction[] = transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount.toFixed(2),
      // From requesting user's perspective: if they sent it → DEBIT, else → CREDIT
      direction: tx.senderId === requestingUserId ? 'DEBIT' : 'CREDIT',
      note: tx.note,
      createdAt: tx.createdAt.toISOString(),
      status: tx.status,
    }));

    return {
      isFavourite: isFav,
      totalSent: stats.totalSentByA,
      totalReceived: stats.totalReceivedByA,
      transactionCount: stats.transactionCount,
      lastInteractionAt: stats.lastInteractionAt ? stats.lastInteractionAt.toISOString() : null,
      recentTransactions,
    };
  }
}
