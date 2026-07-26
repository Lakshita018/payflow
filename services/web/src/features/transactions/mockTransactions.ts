import { jsPDF } from 'jspdf';
import type { TransactionItem } from './types';

export interface TransactionRecord extends TransactionItem {
  contactLabel: 'From' | 'To';
  statusLabel: 'Received' | 'Sent';
  referenceId: string;
  paymentMethod: string;
  amountSign: '+' | '-';
  amountValue: string;
  amountWords: string;
  summaryDate: string;
  summaryTime: string;
  dateTime: string;
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - (marginX * 2);
  const purple = [109, 74, 255] as const;
  const success = [22, 163, 74] as const;
  const danger = [220, 38, 38] as const;
  const border = [226, 229, 239] as const;
  const muted = [96, 102, 125] as const;
  const text = [30, 35, 52] as const;

  const currentDateTime = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const isReceived = transaction.kind === 'received';
  const accent = isReceived ? success : danger;
  const accentSoft = isReceived ? [236, 253, 243] as const : [255, 241, 241] as const;
  const statusLabel = isReceived ? 'PAYMENT RECEIVED' : 'PAYMENT SENT';
  const amountLabel = `INR ${transaction.amountValue.replace(/^₹\s?/, '')}`;
  const feeLabel = 'INR 0.00';

  const drawCard = (x: number, y: number, w: number, h: number, fill: readonly [number, number, number] = [255, 255, 255]) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 4, 4, 'FD');
  };

  const drawSectionTitle = (x: number, y: number, title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(text[0], text[1], text[2]);
    doc.text(title, x, y);
  };

  const drawInfoRow = (x: number, y: number, label: string, value: string, valueColor: readonly [number, number, number] = text) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
    doc.text(value, x + 58, y);
  };

  const drawPairRow = (
    x: number,
    y: number,
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
    rightValueColor: readonly [number, number, number] = text,
  ) => {
    const leftValueX = x + 28;
    const rightLabelX = x + 90;
    const rightValueX = x + 122;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(leftLabel, x, y);
    doc.text(rightLabel, rightLabelX, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(text[0], text[1], text[2]);
    doc.text(leftValue, leftValueX, y);

    doc.setTextColor(rightValueColor[0], rightValueColor[1], rightValueColor[2]);
    doc.text(rightValue, rightValueX, y);
  };

  // Page background.
  doc.setFillColor(250, 251, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header.
  doc.setFillColor(purple[0], purple[1], purple[2]);
  doc.circle(pageWidth / 2, 22, 7.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(purple[0], purple[1], purple[2]);
  doc.text('P', pageWidth / 2, 24.3, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('PayFlow', pageWidth / 2, 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text('Transaction Receipt', pageWidth / 2, 42, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Generated on:', pageWidth / 2, 50, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text(currentDateTime, pageWidth / 2, 55, { align: 'center' });

  // Status section.
  drawCard(marginX, 64, contentWidth, 48, [255, 255, 255]);
  doc.setFillColor(accentSoft[0], accentSoft[1], accentSoft[2]);
  doc.circle(pageWidth / 2, 84, 10, 'F');
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.7);
  doc.circle(pageWidth / 2, 84, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.setFontSize(9.5);
  doc.text(isReceived ? '↓' : '↑', pageWidth / 2, 87, { align: 'center' });

  doc.setFontSize(12);
  doc.text(statusLabel, pageWidth / 2, 101, { align: 'center' });

  doc.setFontSize(16.5);
  doc.text(`${transaction.amountSign} ${amountLabel}`, pageWidth / 2, 109, { align: 'center' });

  // Details card.
  drawCard(marginX, 120, contentWidth, 50);
  drawSectionTitle(marginX + 6, 126, 'Details');
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(marginX + 6, 129, pageWidth - marginX - 6, 129);
  drawPairRow(marginX + 8, 138, 'Transaction ID', transaction.transactionId, 'Reference ID', transaction.referenceId);
  drawPairRow(marginX + 8, 147, 'Date', transaction.summaryDate, 'Time', transaction.summaryTime);
  drawPairRow(marginX + 8, 156, 'Status', transaction.statusLabel, 'Payment Method', transaction.paymentMethod, accent);

  // Contact card.
  drawCard(marginX, 174, contentWidth, 46);
  drawSectionTitle(marginX + 6, 184, 'Contact Details');
  doc.line(marginX + 6, 187, pageWidth - marginX - 6, 187);
  drawPairRow(marginX + 8, 196, 'Name', transaction.name, 'Phone Number', transaction.phone);
  drawPairRow(marginX + 8, 205, 'Direction', transaction.contactLabel, 'Description', transaction.description);

  // Amount card.
  drawCard(marginX, 226, contentWidth, 44, [252, 252, 255]);
  drawSectionTitle(marginX + 6, 234, 'Amount');
  doc.line(marginX + 6, 241, pageWidth - marginX - 6, 241);
  drawInfoRow(marginX + 8, 249, 'Amount', amountLabel, accent);
  drawInfoRow(marginX + 8, 257, 'Fee', feeLabel);
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(marginX + 6, 261.5, pageWidth - marginX - 6, 261.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('Total', marginX + 8, 270);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.setFontSize(13);
  doc.text(amountLabel, pageWidth - marginX - 8, 270, { align: 'right' });

  // Footer.
  const footerTop = 278;
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.line(marginX, footerTop, pageWidth - marginX, footerTop);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text('This receipt is computer generated and does not require a signature.', pageWidth / 2, footerTop + 8, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(text[0], text[1], text[2]);
  doc.text('PayFlow', pageWidth / 2, footerTop + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(purple[0], purple[1], purple[2]);
  doc.text('www.payflow.app', pageWidth / 2, footerTop + 24, { align: 'center' });

  return doc.output('blob');
}
