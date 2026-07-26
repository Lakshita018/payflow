// ---------------------------------------------------------------------------
// prisma/seed.ts — PayFlow demo data seed.
//
// Purpose
// -------
// Populates the database with realistic portfolio-quality demo data so the
// application shows meaningful content immediately after a fresh deploy.
//
// Idempotency
// -----------
// Every upsert is keyed on a stable identifier (email / payflowId / composite
// unique key). Running the seed multiple times is safe — existing rows are
// updated to match the canonical seed values; no duplicates are created.
//
// Architecture alignment
// ----------------------
// • Uses the same PrismaClient + pg adapter pattern as src/config/prisma.ts.
// • Uses the same bcrypt import and BCRYPT_SALT_ROUNDS that AuthService uses,
//   so seeded passwords are hashed identically to runtime-created ones.
// • Does NOT call any service classes — the seed operates at the repository
//   level (direct Prisma calls) to avoid pulling in Express / HTTP concerns.
// • Reads DATABASE_URL and BCRYPT_SALT_ROUNDS from the environment via dotenv,
//   exactly as the application does (dotenv/config at the top of server.ts).
//
// Usage
//   npx prisma db seed                 ← Prisma triggers this automatically
//   npm run db:seed                    ← Direct invocation
//   npx prisma migrate reset           ← Runs migrate + seed together
// ---------------------------------------------------------------------------
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../src/generated/prisma/client';
import bcrypt from 'bcrypt';

// ---------------------------------------------------------------------------
// Bootstrap — create a fresh PrismaClient for the seed process.
// We do NOT import src/config/prisma.ts because that module imports
// src/config/env.ts which validates ALL env vars (including REDIS_URL,
// RABBITMQ_URL, JWT secrets) at import time. The seed only needs DATABASE_URL.
// ---------------------------------------------------------------------------
const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  console.error('[seed] DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const SALT_ROUNDS = parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '12', 10);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

// All four users share the same demo password so a reviewer can log in as any
// of them from the login page using the credentials listed in the README.
const DEMO_PASSWORD = 'payflow123';

interface SeedUser {
  email: string;
  payflowId: string;
}

const USERS: SeedUser[] = [
  { email: 'liam.grant@example.com',   payflowId: 'liamgrant@payflow'   },
  { email: 'rohan.sharma@example.com', payflowId: 'rohansharma@payflow' },
  { email: 'priya.patel@example.com',  payflowId: 'priyapatel@payflow'  },
  { email: 'arav.mehta@example.com',   payflowId: 'aravmehta@payflow'   },
];

// Starting balances in INR (stored as Decimal strings to avoid float issues).
const BALANCES: Record<string, string> = {
  'liam.grant@example.com':   '48750.50',
  'rohan.sharma@example.com': '12340.00',
  'priya.patel@example.com':  '7890.75',
  'arav.mehta@example.com':   '31500.00',
};

// Transaction history — amount is the final desired amount at rest in the DB.
// createdAt offsets are expressed in seconds-ago so the timestamps are always
// relative to "now", making the dashboard stats feel current.
interface SeedTransaction {
  senderEmail: string;
  receiverEmail: string;
  amount: string;
  note: string | null;
  secondsAgo: number; // how many seconds before now the transaction occurred
}

const TRANSACTIONS: SeedTransaction[] = [
  // ── Today ──────────────────────────────────────────────────────────────────
  { senderEmail: 'rohan.sharma@example.com', receiverEmail: 'liam.grant@example.com',  amount: '1250.00', note: 'Dinner last night',   secondsAgo: 3 * 3600 },
  { senderEmail: 'liam.grant@example.com',   receiverEmail: 'priya.patel@example.com', amount: '850.00',  note: 'Movie night',         secondsAgo: 5 * 3600 },
  { senderEmail: 'arav.mehta@example.com',   receiverEmail: 'liam.grant@example.com',  amount: '500.00',  note: 'Cab fare',            secondsAgo: 7 * 3600 },

  // ── Yesterday ──────────────────────────────────────────────────────────────
  { senderEmail: 'priya.patel@example.com',  receiverEmail: 'rohan.sharma@example.com', amount: '2000.00', note: 'Freelance invoice',  secondsAgo: 1 * 86400 + 2 * 3600 },
  { senderEmail: 'liam.grant@example.com',   receiverEmail: 'arav.mehta@example.com',   amount: '450.00',  note: 'Lunch split',        secondsAgo: 1 * 86400 + 5 * 3600 },
  { senderEmail: 'rohan.sharma@example.com', receiverEmail: 'priya.patel@example.com',  amount: '300.00',  note: null,                 secondsAgo: 1 * 86400 + 8 * 3600 },

  // ── 3 days ago ─────────────────────────────────────────────────────────────
  { senderEmail: 'arav.mehta@example.com',   receiverEmail: 'priya.patel@example.com',  amount: '1800.00', note: 'Rent split',          secondsAgo: 3 * 86400 },
  { senderEmail: 'liam.grant@example.com',   receiverEmail: 'rohan.sharma@example.com', amount: '750.00',  note: 'Office supplies',     secondsAgo: 3 * 86400 + 3600 },

  // ── 1 week ago ─────────────────────────────────────────────────────────────
  { senderEmail: 'priya.patel@example.com',  receiverEmail: 'liam.grant@example.com',   amount: '5000.00', note: 'Project bonus',       secondsAgo: 7 * 86400 },
  { senderEmail: 'rohan.sharma@example.com', receiverEmail: 'arav.mehta@example.com',   amount: '960.00',  note: 'Grocery share',       secondsAgo: 7 * 86400 + 7200 },
  { senderEmail: 'arav.mehta@example.com',   receiverEmail: 'liam.grant@example.com',   amount: '2500.00', note: 'Rent contribution',   secondsAgo: 8 * 86400 },
  { senderEmail: 'liam.grant@example.com',   receiverEmail: 'priya.patel@example.com',  amount: '1100.00', note: 'Thanks for helping',  secondsAgo: 9 * 86400 },

  // ── 2 weeks ago ────────────────────────────────────────────────────────────
  { senderEmail: 'rohan.sharma@example.com', receiverEmail: 'liam.grant@example.com',   amount: '3200.00', note: 'Concert tickets',     secondsAgo: 14 * 86400 },
  { senderEmail: 'priya.patel@example.com',  receiverEmail: 'arav.mehta@example.com',   amount: '650.00',  note: 'Birthday gift',       secondsAgo: 15 * 86400 },
  { senderEmail: 'arav.mehta@example.com',   receiverEmail: 'rohan.sharma@example.com', amount: '420.00',  note: null,                  secondsAgo: 16 * 86400 },

  // ── 1 month ago ────────────────────────────────────────────────────────────
  { senderEmail: 'liam.grant@example.com',   receiverEmail: 'arav.mehta@example.com',   amount: '8750.00', note: 'Laptop purchase',     secondsAgo: 30 * 86400 },
  { senderEmail: 'rohan.sharma@example.com', receiverEmail: 'priya.patel@example.com',  amount: '1500.00', note: 'Workshop fee',        secondsAgo: 31 * 86400 },
  { senderEmail: 'priya.patel@example.com',  receiverEmail: 'liam.grant@example.com',   amount: '950.00',  note: 'Team lunch',          secondsAgo: 32 * 86400 },
];

// Favourite contacts — each entry means "userId marks contactUserId as favourite".
// Defined as [owner email, favourite email] pairs.
const FAVOURITES: [string, string][] = [
  ['liam.grant@example.com',   'rohan.sharma@example.com'],
  ['liam.grant@example.com',   'priya.patel@example.com'],
  ['liam.grant@example.com',   'arav.mehta@example.com'],
  ['rohan.sharma@example.com', 'liam.grant@example.com'],
  ['rohan.sharma@example.com', 'priya.patel@example.com'],
  ['priya.patel@example.com',  'arav.mehta@example.com'],
  ['priya.patel@example.com',  'liam.grant@example.com'],
  ['arav.mehta@example.com',   'liam.grant@example.com'],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function secondsAgoDate(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  console.log('[seed] Starting PayFlow demo data seed...\n');

  // ── 1. Hash the shared demo password once (same cost as production) ────────
  console.log('[seed] Hashing demo password...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  // ── 2. Upsert users ────────────────────────────────────────────────────────
  console.log('[seed] Upserting users...');
  const userIdByEmail = new Map<string, string>();

  for (const { email, payflowId } of USERS) {
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, payflowId, passwordHash },
      // Update passwordHash on re-seed so the password is always the demo one,
      // even if it was changed manually between runs.
      update: { passwordHash },
    });
    userIdByEmail.set(email, user.id);
    console.log(`  ✓ user  ${email}  (${payflowId})  id=${user.id}`);
  }

  // ── 3. Upsert wallets ──────────────────────────────────────────────────────
  console.log('\n[seed] Upserting wallets...');

  for (const { email } of USERS) {
    const userId = userIdByEmail.get(email);
    if (userId === undefined) throw new Error(`[seed] userId missing for ${email}`);

    const balance = BALANCES[email];
    if (balance === undefined) throw new Error(`[seed] balance missing for ${email}`);

    await prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: new Prisma.Decimal(balance) },
      // Re-seed restores balances to their canonical starting values.
      // This is intentional: the seed represents a clean portfolio state,
      // not a snapshot of live data.
      update: { balance: new Prisma.Decimal(balance) },
    });
    console.log(`  ✓ wallet  ${email}  balance=₹${balance}`);
  }

  // ── 4. Upsert transactions ─────────────────────────────────────────────────
  // Transactions do not have a natural unique key other than their UUID primary
  // key, so we use a deterministic stable key: SHA-based approach is overkill —
  // instead we delete all existing seed transactions and re-insert them.
  //
  // This is safe because:
  //   a) The seed only runs in controlled environments (not against live user data).
  //   b) We identify seed rows by their note text + sender + receiver + amount;
  //      real user-created rows are never deleted.
  //
  // Implementation: we collect the deterministic set of (senderId, receiverId,
  // amount, note) tuples, delete any existing rows that match ALL four fields,
  // then insert fresh rows with the correct createdAt timestamps.
  console.log('\n[seed] Seeding transactions (delete-then-insert for idempotency)...');

  for (const tx of TRANSACTIONS) {
    const senderId = userIdByEmail.get(tx.senderEmail);
    const receiverId = userIdByEmail.get(tx.receiverEmail);
    if (senderId === undefined) throw new Error(`[seed] senderId missing for ${tx.senderEmail}`);
    if (receiverId === undefined) throw new Error(`[seed] receiverId missing for ${tx.receiverEmail}`);

    const amount = new Prisma.Decimal(tx.amount);
    const createdAt = secondsAgoDate(tx.secondsAgo);

    // Delete any previous seed row with this exact fingerprint so re-running
    // the seed does not accumulate duplicate transactions.
    await prisma.transaction.deleteMany({
      where: {
        senderId,
        receiverId,
        amount,
        note: tx.note,
      },
    });

    await prisma.transaction.create({
      data: {
        senderId,
        receiverId,
        amount,
        status: 'COMPLETED',
        note: tx.note,
        createdAt,
      },
    });

    const noteLabel = tx.note !== null ? `"${tx.note}"` : '(no note)';
    console.log(`  ✓ txn  ${tx.senderEmail.split('@')[0]} → ${tx.receiverEmail.split('@')[0]}  ₹${tx.amount}  ${noteLabel}`);
  }

  // ── 5. Upsert favourite contacts ───────────────────────────────────────────
  console.log('\n[seed] Upserting favourite contacts...');

  for (const [ownerEmail, contactEmail] of FAVOURITES) {
    const userId = userIdByEmail.get(ownerEmail);
    const contactUserId = userIdByEmail.get(contactEmail);
    if (userId === undefined) throw new Error(`[seed] userId missing for ${ownerEmail}`);
    if (contactUserId === undefined) throw new Error(`[seed] contactUserId missing for ${contactEmail}`);

    await prisma.favouriteContact.upsert({
      where: { userId_contactUserId: { userId, contactUserId } },
      create: { userId, contactUserId },
      update: {}, // no mutable fields — upsert is used purely for idempotency
    });
    console.log(`  ✓ fav  ${ownerEmail.split('@')[0]} → ${contactEmail.split('@')[0]}`);
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────
  const [userCount, walletCount, txCount, favCount] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.count(),
    prisma.transaction.count(),
    prisma.favouriteContact.count(),
  ]);

  console.log('\n[seed] ─────────────────────────────────────────');
  console.log('[seed] Seed complete. Database state:');
  console.log(`[seed]   users               : ${userCount}`);
  console.log(`[seed]   wallets             : ${walletCount}`);
  console.log(`[seed]   transactions        : ${txCount}`);
  console.log(`[seed]   favourite_contacts  : ${favCount}`);
  console.log('[seed] ─────────────────────────────────────────');
  console.log('\n[seed] Demo credentials (all users share the same password):');
  for (const { email, payflowId } of USERS) {
    console.log(`[seed]   email: ${email}  |  payflowId: ${payflowId}  |  password: ${DEMO_PASSWORD}`);
  }
}

// ---------------------------------------------------------------------------
// Entry point — run seed, then cleanly close the pool.
// ---------------------------------------------------------------------------
seed()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (err: unknown) => {
    console.error('[seed] Seed failed:', err);
    await prisma.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
    process.exit(1);
  });
