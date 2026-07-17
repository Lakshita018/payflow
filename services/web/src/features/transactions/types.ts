export type TransactionKind = 'received' | 'sent';

export interface TransactionItem {
  id: string;
  name: string;
  phone: string;
  description: string;
  transactionId: string;
  date: string;
  time: string;
  amount: string;
  kind: TransactionKind;
  initials: string;
}