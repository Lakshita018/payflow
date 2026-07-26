// ---------------------------------------------------------------------------
// Shared application types
// ---------------------------------------------------------------------------

// ── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  payflowId: string;
  createdAt: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Wallet ──────────────────────────────────────────────────────────────────
export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

// ── Transactions ─────────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  amount: string;
  /** PENDING | COMPLETED | FAILED */
  status: string;
  /** ADD_MONEY | TRANSFER */
  type: string;
  /** CREDIT | DEBIT */
  direction: string;
  note: string | null;
  createdAt: string;
  senderPayflowId: string;
  receiverPayflowId: string;
  senderEmail: string;
  receiverEmail: string;
}

export interface TransferResult {
  transactionId: string;
  senderBalance: string;
  receiverBalance: string;
  receiverName: string;
  receiverPayflowId: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardData {
  balance: string;
  totalSent: string;
  totalReceived: string;
  recentTransactions: Transaction[];
  monthlySpending: string;
  moneyReceivedThisMonth: string;
  moneySentToday: string;
  largestTransaction: Transaction | null;
  transactionCount: number;
}

// ── Users / Discovery ────────────────────────────────────────────────────────
export interface PublicProfile {
  displayName: string;
  payflowId: string;
  avatar: null;
}

export interface RecipientProfile extends PublicProfile {
  walletExists: boolean;
}

export interface RecentContact extends PublicProfile {
  lastInteractionAt: string;
  transactionCount: number;
}

// ── User Profile & Relationship ──────────────────────────────────────────────
export interface UserProfileResult {
  displayName: string;
  payflowId: string;
  email: string;
  avatar: null;
  isFavourite: boolean;
}

export interface RelationshipTransaction {
  id: string;
  amount: string;
  direction: 'DEBIT' | 'CREDIT';
  note: string | null;
  createdAt: string;
  status: string;
}

export interface RelationshipResult {
  isFavourite: boolean;
  totalSent: string;
  totalReceived: string;
  transactionCount: number;
  lastInteractionAt: string | null;
  recentTransactions: RelationshipTransaction[];
}

// ── API error envelope ───────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}
