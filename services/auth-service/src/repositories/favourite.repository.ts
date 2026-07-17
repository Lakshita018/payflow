// ---------------------------------------------------------------------------
// FavouriteContactRepository — database operations for FavouriteContact.
//
// Rules
// -----
// • Only layer that touches prisma.favouriteContact.*
// • No business logic — no duplicate guards here (DB @@unique handles that).
// ---------------------------------------------------------------------------
import { PrismaClient, FavouriteContact } from '../generated/prisma/client';

export class FavouriteContactRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Create ────────────────────────────────────────────────────────────────
  // Prisma throws P2002 on duplicate (userId, contactUserId).
  // UserService converts that to ConflictError.
  async create(userId: string, contactUserId: string): Promise<FavouriteContact> {
    return this.db.favouriteContact.create({
      data: { userId, contactUserId },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  // Returns the deleted record, or null if it did not exist.
  async remove(userId: string, contactUserId: string): Promise<FavouriteContact | null> {
    return this.db.favouriteContact.delete({
      where: { userId_contactUserId: { userId, contactUserId } },
    }).catch(() => null);
  }

  // ── Read ──────────────────────────────────────────────────────────────────
  // Returns all contactUserIds favourited by userId.
  async findContactIdsByUser(userId: string): Promise<string[]> {
    const rows = await this.db.favouriteContact.findMany({
      where: { userId },
      select: { contactUserId: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.contactUserId);
  }
}
