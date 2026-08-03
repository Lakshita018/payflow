import { jsPDF } from 'jspdf';
import type { TransactionItem } from './types';

export interface TransactionRecord extends TransactionItem {
  contactLabel: 'From' | 'To';
  statusLabel: 'Received' | 'Sent' | 'Added';
  referenceId: string;
  paymentMethod: string;
  amountSign: '+' | '-';
  amountValue: string;
  amountWords: string;
  summaryDate: string;
  summaryTime: string;
  dateTime: string;
  /** ISO 8601 date-time string used for reliable date-based filtering */
  createdAt: string;
}

const receivedAmount = '₹1,250.00';
const sentAmount = '₹850.00';

export const transactionRecords: TransactionRecord[] = [
  {
    id: 'txn-784512',
    name: 'Rohan Sharma',
    phone: '+91 98765 43210',
    description: 'Dinner last night',
    transactionId: 'TXN784512',
    date: '18 Jul 2026',
    time: '10:30 AM',
    amount: `+ ${receivedAmount}`,
    kind: 'received',
    initials: 'RS',
    contactLabel: 'From',
    statusLabel: 'Received',
    referenceId: 'REF1234567890',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '+',
    amountValue: receivedAmount,
    amountWords: 'Rupees One Thousand Two Hundred Fifty Only',
    summaryDate: 'Today',
    summaryTime: '10:30 AM',
    dateTime: 'Today, 10:30 AM · 18 Jul 2026',
    createdAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
  },
  {
    id: 'txn-784511',
    name: 'Priya Patel',
    phone: '+91 91234 56789',
    description: 'Movie night',
    transactionId: 'TXN784511',
    date: '17 Jul 2026',
    time: '8:15 PM',
    amount: `- ${sentAmount}`,
    kind: 'sent',
    initials: 'PP',
    contactLabel: 'To',
    statusLabel: 'Sent',
    referenceId: 'REF0987654321',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '-',
    amountValue: sentAmount,
    amountWords: 'Rupees Eight Hundred Fifty Only',
    summaryDate: 'Yesterday',
    summaryTime: '8:15 PM',
    dateTime: 'Yesterday, 8:15 PM · 17 Jul 2026',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn-784510',
    name: 'Arav Mehta',
    phone: '+91 99887 76655',
    description: 'Rent split',
    transactionId: 'TXN784510',
    date: '16 May 2024',
    time: '6:45 PM',
    amount: `+ ₹2,500.00`,
    kind: 'received',
    initials: 'AM',
    contactLabel: 'From',
    statusLabel: 'Received',
    referenceId: 'REF1122334455',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '+',
    amountValue: '₹2,500.00',
    amountWords: 'Rupees Two Thousand Five Hundred Only',
    summaryDate: 'May 16, 2024',
    summaryTime: '6:45 PM',
    dateTime: 'May 16, 2024 · 6:45 PM',
    createdAt: '2024-05-16T13:15:00.000Z',
  },
  {
    id: 'txn-784509',
    name: 'Sneha Iyer',
    phone: '+91 90001 23456',
    description: 'Thanks!',
    transactionId: 'TXN784509',
    date: '12 May 2024',
    time: '9:20 AM',
    amount: `- ₹950.00`,
    kind: 'sent',
    initials: 'SI',
    contactLabel: 'To',
    statusLabel: 'Sent',
    referenceId: 'REF5566778899',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '-',
    amountValue: '₹950.00',
    amountWords: 'Rupees Nine Hundred Fifty Only',
    summaryDate: 'May 12, 2024',
    summaryTime: '9:20 AM',
    dateTime: 'May 12, 2024 · 9:20 AM',
    createdAt: '2024-05-12T03:50:00.000Z',
  },
  {
    id: 'txn-784508',
    name: 'Kavya Nair',
    phone: '+91 95555 12345',
    description: 'Gift return',
    transactionId: 'TXN784508',
    date: '10 May 2024',
    time: '11:10 PM',
    amount: `+ ₹1,000.00`,
    kind: 'received',
    initials: 'KN',
    contactLabel: 'From',
    statusLabel: 'Received',
    referenceId: 'REF6677889900',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '+',
    amountValue: '₹1,000.00',
    amountWords: 'Rupees One Thousand Only',
    summaryDate: 'May 10, 2024',
    summaryTime: '11:10 PM',
    dateTime: 'May 10, 2024 · 11:10 PM',
    createdAt: '2024-05-10T17:40:00.000Z',
  },
  {
    id: 'txn-784507',
    name: 'Vikas Patel',
    phone: '+91 98877 66554',
    description: 'Lunch',
    transactionId: 'TXN784507',
    date: '9 May 2024',
    time: '1:05 PM',
    amount: `- ₹450.00`,
    kind: 'sent',
    initials: 'VP',
    contactLabel: 'To',
    statusLabel: 'Sent',
    referenceId: 'REF2244668800',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '-',
    amountValue: '₹450.00',
    amountWords: 'Rupees Four Hundred Fifty Only',
    summaryDate: 'May 9, 2024',
    summaryTime: '1:05 PM',
    dateTime: 'May 9, 2024 · 1:05 PM',
    createdAt: '2024-05-09T07:35:00.000Z',
  },
  {
    id: 'txn-784506',
    name: 'Aanya Singh',
    phone: '+91 97766 55443',
    description: 'Book share',
    transactionId: 'TXN784506',
    date: '8 May 2024',
    time: '7:45 PM',
    amount: `+ ₹300.00`,
    kind: 'received',
    initials: 'AS',
    contactLabel: 'From',
    statusLabel: 'Received',
    referenceId: 'REF3344556677',
    paymentMethod: 'PayFlow Wallet',
    amountSign: '+',
    amountValue: '₹300.00',
    amountWords: 'Rupees Three Hundred Only',
    summaryDate: 'May 8, 2024',
    summaryTime: '7:45 PM',
    dateTime: 'May 8, 2024 · 7:45 PM',
    createdAt: '2024-05-08T14:15:00.000Z',
  },
];

export function getTransactionRecordById(transactionId: string | undefined): TransactionRecord | undefined {
  return transactionRecords.find((transaction) => transaction.id === transactionId);
}

export function createTransactionSummary(transaction: TransactionRecord): string {
  return [
    'PayFlow',
    `Transaction ID: ${transaction.transactionId}`,
    `Reference ID: ${transaction.referenceId}`,
    `Status: ${transaction.statusLabel}`,
    `Amount: ${transaction.amountSign} ${transaction.amountValue}`,
    `Date: ${transaction.summaryDate}`,
    `Time: ${transaction.summaryTime}`,
    `Contact: ${transaction.contactLabel} ${transaction.name} (${transaction.phone})`,
    `Description: ${transaction.description}`,
  ].join('\n');
}

export function createReceiptPdfBlob(transaction: TransactionRecord): Blob {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const W  = doc.internal.pageSize.getWidth();   // 210
  const H  = doc.internal.pageSize.getHeight();  // 297
  const mx = 18;                                  // horizontal margin
  const cw = W - mx * 2;                         // content width = 174
  const rEdge = mx + cw;                         // right edge = 192

  // ── Palette ────────────────────────────────────────────────────────────────
  const purple    = [109, 58, 238] as const;   // brand
  const purpleSft = [237, 232, 255] as const;  // light purple tint
  const ink       = [20,  17,  45] as const;   // near-black text
  const mid       = [90,  85, 120] as const;   // secondary text
  const muted     = [160, 155, 185] as const;  // label text
  const border    = [228, 224, 242] as const;  // card borders
  const green     = [22, 140, 75 ] as const;
  const greenSft  = [236, 253, 243] as const;
  const red       = [200, 30,  30 ] as const;
  const redSft    = [255, 240, 240] as const;

  const isReceived  = transaction.kind === 'received';
  const accent      = isReceived ? green   : red;
  const accentSoft  = isReceived ? greenSft : redSft;
  const statusLabel = isReceived ? 'PAYMENT RECEIVED' : 'PAYMENT SENT';
  const amountStr   = transaction.amountValue.replace(/^[+\-\s₹]+/, '').trim();
  const amountLabel = `INR ${amountStr}`;
  const signedLabel = `${isReceived ? '+' : '−'} INR ${amountStr}`;

  const now = new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  // ── Primitives ─────────────────────────────────────────────────────────────
  const rgb    = (c: readonly [number,number,number]) => doc.setTextColor(c[0], c[1], c[2]);
  const fill   = (c: readonly [number,number,number]) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: readonly [number,number,number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const lw     = (w: number)                          => doc.setLineWidth(w);

  /** White card with a hairline border */
  const card = (x: number, y: number, w: number, h: number) => {
    fill([255,255,255] as const); stroke(border); lw(0.25);
    doc.roundedRect(x, y, w, h, 4, 4, 'FD');
  };

  /**
   * Single label → value row spanning the full card width.
   * Label is left-aligned; value is right-aligned to rEdge - innerPad.
   */
  const row = (
    y: number,
    label: string,
    value: string,
    valCol: readonly [number,number,number] = ink,
    innerPad = 6,
  ) => {
    const lx = mx + innerPad;
    const rx = rEdge - innerPad;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); rgb(muted);
    doc.text(label, lx, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); rgb(valCol);
    doc.text(value, rx, y, { align: 'right' });
  };

  /** Hairline divider inside a card */
  const divider = (y: number, pad = 6) => {
    stroke(border); lw(0.18);
    doc.line(mx + pad, y, rEdge - pad, y);
  };

  // ── Page ───────────────────────────────────────────────────────────────────
  fill([252, 251, 255] as const); doc.rect(0, 0, W, H, 'F');

  // ── Header — clean, centered, minimal ──────────────────────────────────────
  // Logo circle (purple)
  fill(purple); stroke(purple); lw(0);
  doc.circle(W / 2, 20, 7.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  rgb([255,255,255] as const);
  doc.text('P', W / 2, 23.5, { align: 'center' });

  // Brand + subtitle
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); rgb(ink);
  doc.text('PayFlow', W / 2, 35, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); rgb(mid);
  doc.text('Transaction Receipt', W / 2, 42, { align: 'center' });

  // Thin purple rule under header
  fill(purple); doc.rect(W / 2 - 14, 45.5, 28, 0.8, 'F');

  // Generated-on line
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); rgb(muted);
  doc.text(`Generated: ${now}`, W / 2, 51, { align: 'center' });

  // ── Amount hero ────────────────────────────────────────────────────────────
  const heroY = 58;
  // Tinted background card
  fill(accentSoft); stroke(border); lw(0.25);
  doc.roundedRect(mx, heroY, cw, 36, 4, 4, 'FD');

  // Status label (small caps style)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); rgb(accent);
  doc.text(statusLabel, W / 2, heroY + 10, { align: 'center' });

  // Amount — large, bold, centered
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); rgb(accent);
  doc.text(signedLabel, W / 2, heroY + 26, { align: 'center' });

  // Date + time below amount
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); rgb(accent);
  doc.text(
    `${transaction.summaryDate}  ·  ${transaction.summaryTime}`,
    W / 2, heroY + 33, { align: 'center' },
  );

  // ── Transaction Details card ────────────────────────────────────────────────
  let y = heroY + 44;
  card(mx, y, cw, 62);

  // Section heading
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); rgb(ink);
  doc.text('Transaction Details', mx + 6, y + 9);
  divider(y + 13);

  row(y + 21, 'Transaction ID', transaction.transactionId);
  divider(y + 25);
  row(y + 33, 'Reference ID', transaction.referenceId);
  divider(y + 37);
  row(y + 45, 'Date & Time', transaction.dateTime);
  divider(y + 49);
  row(y + 57, 'Status', transaction.statusLabel, accent);

  // ── Contact Details card ────────────────────────────────────────────────────
  y += 68;
  card(mx, y, cw, 50);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); rgb(ink);
  doc.text('Contact Details', mx + 6, y + 9);
  divider(y + 13);

  row(y + 21, transaction.contactLabel, transaction.name);
  divider(y + 25);
  row(y + 33, 'PayFlow ID', transaction.phone, mid);
  divider(y + 37);
  row(y + 45, 'Note', transaction.description || '—');

  // ── Amount Breakdown card ──────────────────────────────────────────────────
  y += 56;
  card(mx, y, cw, 55);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); rgb(ink);
  doc.text('Amount Breakdown', mx + 6, y + 9);
  divider(y + 13);

  row(y + 21, 'Amount', amountLabel, accent);
  divider(y + 25);
  row(y + 33, 'Platform Fee', 'INR 0.00', mid);

  // Total row — highlighted band
  fill(purpleSft); stroke(purpleSft); lw(0);
  doc.roundedRect(mx + 4, y + 37, cw - 8, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); rgb(ink);
  doc.text('Total', mx + 8, y + 44.5);
  rgb(accent);
  doc.text(amountLabel, rEdge - 8, y + 44.5, { align: 'right' });

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footY = H - 18;
  stroke(border); lw(0.25); doc.line(mx, footY, rEdge, footY);

  doc.setFont('helvetica', 'italic'); doc.setFontSize(7); rgb(muted);
  doc.text('This receipt is computer-generated and does not require a signature.', W / 2, footY + 6, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); rgb(purple);
  doc.text('PayFlow · payflow.app', W / 2, footY + 13, { align: 'center' });

  return doc.output('blob');
}
