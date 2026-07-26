import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/routes/paths';
import { ArrowDownLeftIcon, ArrowUpRightIcon, ShieldIcon } from '@/features/dashboard/icons';
import {
  createReceiptPdfBlob,
  createTransactionSummary,
  getTransactionRecordById,
  type TransactionRecord,
} from '@/features/transactions/mockTransactions';

type AccentTone = 'success' | 'danger';

function BackArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 19 8 12l7-7" />
      <path d="M9 12h11" />
    </svg>
  );
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="9" width="9" height="9" rx="2" />
      <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 17v2h14v-2" />
    </svg>
  );
}

function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a3 3 0 1 0-2.8-4" />
      <path d="M8 14a3 3 0 1 0 2.8 4" />
      <path d="m14 7-4 2.5" />
      <path d="m10 14.5 4 2.5" />
      <path d="M18 10.5a3 3 0 1 0 0 3" />
    </svg>
  );
}

function CardShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={['rounded-[24px] border border-border bg-surface shadow-card', className].filter(Boolean).join(' ')}>
      {children}
    </section>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  action,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="flex items-center gap-2 justify-self-end">
        <div className="text-sm font-medium text-text-primary">{value}</div>
        {action}
      </div>
    </div>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-700">{children}</span>;
}

function StatusGlyph({ kind }: { kind: TransactionRecord['kind'] }) {
  const Icon = kind === 'received' ? ArrowDownLeftIcon : ArrowUpRightIcon;
  const tone: AccentTone = kind === 'received' ? 'success' : 'danger';
  const classes = tone === 'success'
    ? 'border-success/20 bg-success/[0.08] text-success'
    : 'border-danger/20 bg-danger/[0.08] text-danger';

  return (
    <div className={['flex h-16 w-16 items-center justify-center rounded-full border lg:h-[72px] lg:w-[72px]', classes].join(' ')}>
      <Icon className="h-7 w-7 lg:h-8 lg:w-8" />
    </div>
  );
}

function CopyButton({ value, onCopied }: { value: string; onCopied: (message: string) => void }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      onCopied('Copied to clipboard');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      onCopied('Copied to clipboard');
    }
  };

  return (
    <button
      type="button"
      aria-label={`Copy ${value}`}
      onClick={handleCopy}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100"
    >
      <CopyIcon className="h-4 w-4" />
    </button>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-card">
      {message}
    </div>
  );
}

export function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const transaction = getTransactionRecordById(id);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!toastMessage)
      return undefined;

    const timeout = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = (message: string) => {
    setToastMessage(message);
  };

  const handleBack = () => {
    if ((window.history.state as { idx?: number } | null)?.idx && (window.history.state as { idx?: number }).idx > 0) {
      navigate(-1);
      return;
    }

    navigate(ROUTES.TRANSACTIONS, { replace: true, preventScrollReset: true });
  };

  const downloadReceipt = () => {
    if (!transaction)
      return;

    const blob = createReceiptPdfBlob(transaction);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${transaction.transactionId.toLowerCase()}-receipt.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareTransaction = async () => {
    if (!transaction)
      return;

    const summary = createTransactionSummary(transaction);

    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'PayFlow Transaction',
          text: summary,
        });
        showToast('Transaction shared');
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(summary);
      showToast('Transaction copied');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = summary;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Transaction copied');
    }
  };

  if (!transaction) {
    return (
      <div className="mx-auto w-full max-w-none px-4 pb-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <BackArrowIcon className="h-4 w-4" />
            Back to Transactions
          </button>
        </div>

        <CardShell className="flex min-h-[240px] items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">Transaction not found</h1>
              <p className="mt-2 text-sm text-text-secondary">
                We could not find a transaction for this link. It may have been removed or the address may be invalid.
              </p>
            </div>

            <Button variant="primary" onClick={handleBack} className="rounded-2xl px-5">
              Back to Transactions
            </Button>
          </div>
        </CardShell>
      </div>
    );
  }

  const isReceived = transaction.kind === 'received';
  const accentTone: AccentTone = isReceived ? 'success' : 'danger';
  const accentText = accentTone === 'success' ? 'text-success' : 'text-danger';
  const heroTint = accentTone === 'success' ? 'border-success/15 bg-success/[0.05]' : 'border-danger/15 bg-danger/[0.05]';

  return (
    <>
      <div className="mx-auto w-full max-w-none px-4 pb-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <BackArrowIcon className="h-4 w-4" />
            Back to Transactions
          </button>
          <div className="hidden h-4 w-px bg-border lg:block" />
          <h1 className="text-[1.65rem] font-semibold tracking-tight text-text-primary lg:text-[1.85rem]">Transaction Details</h1>
        </div>

        <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
          <CardShell className={['p-3.5 lg:col-span-12 lg:h-[108px] lg:p-4', heroTint].join(' ')}>
            <div className="grid h-full gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex items-center gap-3.5 lg:gap-5">
                <StatusGlyph kind={transaction.kind} />

                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={accentTone} className="px-3 py-1 text-xs font-semibold">
                      {transaction.statusLabel}
                    </Badge>
                  </div>
                  <div className={['text-[2rem] font-semibold leading-none tracking-tight lg:text-[2.25rem]', accentText].join(' ')}>
                    {transaction.amountSign} {transaction.amountValue}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary lg:text-sm">{transaction.amountWords}</p>
                </div>
              </div>

              <div className="flex items-center justify-start gap-3 lg:justify-end">
                <Badge variant={accentTone} className="px-3 py-1 text-xs font-semibold">
                  Completed
                </Badge>
                <div className="h-8 w-px bg-border/80" />
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{transaction.summaryDate}, {transaction.summaryTime}</p>
                  <p className="text-sm text-text-secondary">{transaction.date}</p>
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell className="p-3.5 lg:col-span-6 lg:p-4.5">
            <SectionTitle
              title="Transaction Overview"
              icon={<span className="text-sm font-semibold leading-none">▤</span>}
            />

            <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
              <Avatar
                name={transaction.name}
                size="xl"
                className={isReceived ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}
              />

              <div className="min-w-0">
                <MiniLabel>{transaction.contactLabel}</MiniLabel>
                <h3 className="mt-1 truncate text-xl font-semibold text-text-primary">{transaction.name}</h3>
                <p className="text-sm text-text-secondary">{transaction.phone}</p>
                <p className="mt-2 text-sm text-text-secondary">{transaction.description}</p>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border/80">
              <InfoRow
                label="Transaction ID"
                value={transaction.transactionId}
                icon={<span className="text-sm font-semibold leading-none">#</span>}
                action={<CopyButton value={transaction.transactionId} onCopied={showToast} />}
              />
              <InfoRow
                label="Reference ID"
                value={transaction.referenceId}
                icon={<span className="text-sm font-semibold leading-none">⌁</span>}
                action={<CopyButton value={transaction.referenceId} onCopied={showToast} />}
              />
            </div>
          </CardShell>

          <CardShell className="p-3.5 lg:col-span-6 lg:p-4.5">
            <SectionTitle
              title="Payment Details"
              icon={<span className="text-sm font-semibold leading-none">▭</span>}
            />

            <div className="divide-y divide-border/80">
              <InfoRow
                label="Status"
                value={<Badge variant={accentTone} className="px-3 py-1 text-xs font-semibold">{transaction.statusLabel}</Badge>}
                icon={<span className="text-sm leading-none">●</span>}
              />
              <InfoRow
                label="Date & Time"
                value={transaction.dateTime}
                icon={<span className="text-sm leading-none">📅</span>}
              />
              <InfoRow
                label="Payment Method"
                value={transaction.paymentMethod}
                icon={<span className="text-sm leading-none">◫</span>}
              />
              <InfoRow
                label="Amount"
                value={<span className={accentText}>{transaction.amountValue}</span>}
                icon={<span className="text-sm leading-none">₹</span>}
              />
              <InfoRow
                label="Fee"
                value="₹0.00"
                icon={<span className="text-sm leading-none">₨</span>}
              />
              <InfoRow
                label="Total"
                value={<span className={['text-base font-semibold', accentText].join(' ')}>{transaction.amountValue}</span>}
                icon={<span className="text-sm leading-none">∑</span>}
              />
            </div>
          </CardShell>

          <div className="grid gap-3 lg:col-span-12 lg:grid-cols-3">
            <CardShell className="flex min-h-[100px] items-center gap-4 p-3.5 lg:p-4.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-6 text-text-secondary lg:text-base">
                This transaction is protected by PayFlow.
              </p>
            </CardShell>

            <CardShell className="flex min-h-[100px] items-center p-3.5 lg:p-4.5">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={downloadReceipt}
                leftIcon={<DownloadIcon className="h-4 w-4" />}
                className="h-12 rounded-2xl border border-brand-200 bg-surface px-5 text-brand-700 shadow-sm hover:bg-brand-50"
              >
                Download Receipt
              </Button>
            </CardShell>

            <CardShell className="flex min-h-[100px] items-center p-3.5 lg:p-4.5">
              <Button
                variant="secondary"
                fullWidth
                size="lg"
                onClick={shareTransaction}
                leftIcon={<ShareIcon className="h-4 w-4" />}
                className="h-12 rounded-2xl border border-brand-200 bg-surface px-5 text-brand-700 shadow-sm hover:bg-brand-50"
              >
                Share Transaction
              </Button>
            </CardShell>
          </div>
        </div>
      </div>

      {toastMessage && <Toast message={toastMessage} />}
    </>
  );
}