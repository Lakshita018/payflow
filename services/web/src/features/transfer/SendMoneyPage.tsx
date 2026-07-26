import { useState, type SVGProps } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

// ─── Icons ────────────────────────────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement>;

function ContactsTabIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c1.1-3.1 3.7-5 5.5-5s4.4 1.9 5.5 5" />
    </svg>
  );
}

function BeneficiariesTabIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M2.5 19c1-3 3.5-5 5.5-5s2.5.6 4 1.5" />
      <path d="M13.5 19c1-3 3.5-5 5.5-5s4.5 1.9 5.5 5" />
    </svg>
  );
}

function BankIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M3 9.5 12 4l9 5.5" />
      <rect x="5" y="10" width="3" height="7" />
      <rect x="10.5" y="10" width="3" height="7" />
      <rect x="16" y="10" width="3" height="7" />
      <path d="M2 19h20" />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SendIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M21 3 10 14" />
      <path d="m21 3-7 19-4-8-8-4 19-7Z" />
    </svg>
  );
}

function ShieldCheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 3 19 6v6c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3Z" />
      <path d="M9.5 12.2 11.4 14 15 10.2" />
    </svg>
  );
}

function WalletIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M20 12V8H6a2 2 0 0 1 0-4h14v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronDownSmIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ─── Amount-to-words helper ───────────────────────────────────────────────────

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numToWords(n: number): string {
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + numToWords(n % 100) : '');
  if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + numToWords(n % 1000) : '');
  if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + numToWords(n % 100000) : '');
  return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + numToWords(n % 10000000) : '');
}

function amountInWords(raw: string): string {
  const num = parseFloat(raw.replace(/,/g, ''));
  if (isNaN(num) || num <= 0) return '';
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + numToWords(rupees);
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise';
  return result + ' Only';
}

// ─── Static data ──────────────────────────────────────────────────────────────

type RecipientItem = {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  avatarTextColor: string;
};

const CONTACTS: RecipientItem[] = [
  { id: 'c1', name: 'Rohan Sharma',  phone: '+91 98765 43210', avatarColor: 'bg-brand-100', avatarTextColor: 'text-brand-700' },
  { id: 'c2', name: 'Priya Patel',   phone: '+91 91234 56789', avatarColor: 'bg-violet-100', avatarTextColor: 'text-violet-700' },
  { id: 'c3', name: 'Arav Mehta',    phone: '+91 99887 76655', avatarColor: 'bg-emerald-100', avatarTextColor: 'text-emerald-700' },
  { id: 'c4', name: 'Sneha Iyer',    phone: '+91 90001 23456', avatarColor: 'bg-rose-100', avatarTextColor: 'text-rose-700' },
  { id: 'c5', name: 'Kavya Nair',    phone: '+91 95555 12345', avatarColor: 'bg-amber-100', avatarTextColor: 'text-amber-700' },
];

const RECENT_CONTACTS: RecipientItem[] = [
  { id: 'c1', name: 'Rohan Sharma',  phone: '+91 98765 43210', avatarColor: 'bg-brand-100',   avatarTextColor: 'text-brand-700'   },
  { id: 'c2', name: 'Priya Patel',   phone: '+91 91234 56789', avatarColor: 'bg-violet-100',  avatarTextColor: 'text-violet-700'  },
  { id: 'c6', name: 'Amit Kumar',    phone: '+91 99887 66554', avatarColor: 'bg-emerald-100', avatarTextColor: 'text-emerald-700' },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

type RecipientTab = 'contacts' | 'beneficiaries' | 'bank';

// ─── Component ────────────────────────────────────────────────────────────────

export function SendMoneyPage() {
  const [activeTab, setActiveTab] = useState<RecipientTab>('contacts');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientItem>(CONTACTS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rawAmount, setRawAmount] = useState('1,250.00');
  const [message, setMessage] = useState('');

  const numericAmount = parseFloat(rawAmount.replace(/,/g, '')) || 0;
  const words = amountInWords(rawAmount);
  const formattedAmount = numericAmount > 0
    ? '₹' + numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';

  const handleAmountChange = (value: string) => {
    // Allow digits, one dot, commas
    const cleaned = value.replace(/[^0-9.,]/g, '');
    setRawAmount(cleaned);
  };

  const addQuickAmount = (amount: number) => {
    const current = parseFloat(rawAmount.replace(/,/g, '')) || 0;
    const next = current + amount;
    setRawAmount(next.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const clearAmount = () => setRawAmount('');

  const tabs: { id: RecipientTab; label: string; icon: typeof ContactsTabIcon }[] = [
    { id: 'contacts', label: 'Contacts', icon: ContactsTabIcon },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: BeneficiariesTabIcon },
    { id: 'bank', label: 'Bank Account', icon: BankIcon },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Send Money</h2>
        <p className="mt-1 text-sm text-text-secondary">Send money securely to any contact or bank account</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Step 1 — Recipient */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">1</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Recipient</h3>
                <p className="text-xs text-text-secondary">Choose a contact, beneficiary or enter bank details</p>
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex rounded-xl border border-border bg-surface-subtle p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-surface text-brand-700 shadow-sm border border-border'
                        : 'text-text-secondary hover:text-text-primary',
                    ].join(' ')}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Recipient selector */}
            <div className="relative mt-3">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-surface-subtle"
              >
                <Avatar
                  name={selectedRecipient.name}
                  size="md"
                  className={[selectedRecipient.avatarColor, selectedRecipient.avatarTextColor].join(' ')}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{selectedRecipient.name}</p>
                  <p className="text-xs text-text-secondary">{selectedRecipient.phone}</p>
                </div>
                <ChevronDownIcon className={['h-4 w-4 text-text-muted transition-transform duration-200', dropdownOpen ? 'rotate-180' : ''].join(' ')} />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 overflow-hidden rounded-xl border border-border bg-surface shadow-card-md">
                  {(activeTab === 'contacts' ? CONTACTS : RECENT_CONTACTS).map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => { setSelectedRecipient(contact); setDropdownOpen(false); }}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted',
                        selectedRecipient.id === contact.id ? 'bg-brand-50' : '',
                      ].join(' ')}
                    >
                      <Avatar
                        name={contact.name}
                        size="sm"
                        className={[contact.avatarColor, contact.avatarTextColor].join(' ')}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary">{contact.name}</p>
                        <p className="text-xs text-text-secondary">{contact.phone}</p>
                      </div>
                      {selectedRecipient.id === contact.id && (
                        <span className="h-2 w-2 rounded-full bg-brand-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add new recipient */}
            <button
              type="button"
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add new recipient
            </button>
          </section>

          {/* Step 2 — Amount */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">Amount</h3>
                <p className="text-xs text-text-secondary">Enter the amount you want to send</p>
              </div>
            </div>

            {/* Amount input */}
            <div className="relative flex items-center rounded-xl border border-border bg-surface-subtle px-4 py-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
              <span className="mr-2 text-xl font-medium text-text-secondary">₹</span>
              <input
                type="text"
                inputMode="decimal"
                value={rawAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-2xl font-semibold text-text-primary outline-none placeholder:text-text-muted"
              />
              {rawAmount && (
                <button
                  type="button"
                  onClick={clearAmount}
                  className="ml-2 text-text-muted transition-colors hover:text-text-secondary"
                  aria-label="Clear amount"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Amount in words */}
            {words && (
              <p className="mt-2 text-xs text-text-secondary">{words}</p>
            )}

            {/* Quick amounts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => addQuickAmount(amount)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  + ₹{amount.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3 — Message */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">3</span>
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Message <span className="font-normal text-text-muted">(Optional)</span>
                </h3>
                <p className="text-xs text-text-secondary">Add a note for the recipient</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 50))}
                placeholder="What's this payment for?"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-surface-subtle px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              <span className="absolute bottom-3 right-3 text-xs text-text-muted">
                {message.length} / 50
              </span>
            </div>
          </section>

          {/* CTA */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            className="h-14 rounded-2xl bg-brand-600 text-base font-semibold shadow-[0_8px_24px_rgba(109,40,217,0.28)] hover:bg-brand-700"
          >
            Review &amp; Continue
          </Button>
        </div>

        {/* ── Right column — Payment Summary ─────────────────────────────── */}
        <aside className="space-y-4">

          {/* Summary card */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <h3 className="mb-4 text-base font-semibold text-text-primary">Payment Summary</h3>

            <p className="text-xs text-text-secondary">You are sending</p>
            <p className="mt-0.5 text-3xl font-bold tracking-tight text-text-primary">{formattedAmount}</p>

            <div className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text-secondary">To</span>
                <span className="text-right text-sm font-medium text-text-primary">{selectedRecipient.name}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text-secondary">Phone</span>
                <span className="text-right text-sm font-medium text-text-primary">{selectedRecipient.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-secondary">Payment Method</span>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-brand-300"
                >
                  <WalletIcon className="h-3.5 w-3.5 text-brand-600" />
                  PayFlow Wallet
                  <ChevronDownSmIcon className="h-3 w-3 text-text-muted" />
                </button>
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Amount</span>
                <span className="text-sm font-medium text-text-primary">{formattedAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  Convenience Fee
                  <span
                    title="No fees for PayFlow Wallet transfers"
                    className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] text-text-muted"
                  >
                    i
                  </span>
                </span>
                <span className="text-sm font-medium text-text-primary">₹0.00</span>
              </div>
            </div>

            <div className="my-4 border-t border-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Total Payable</span>
              <span className="text-base font-bold text-brand-700">{formattedAmount}</span>
            </div>

            {/* Security notice */}
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <ShieldCheckIcon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-brand-700">Secure &amp; Encrypted</p>
                <p className="mt-0.5 text-xs text-brand-600/80 leading-relaxed">
                  Your payment is protected with bank-level security and encryption.
                </p>
              </div>
            </div>
          </div>

          {/* Recent contacts */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Recent Contacts</h3>
              <button type="button" className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors">
                View all
              </button>
            </div>

            <div className="space-y-1">
              {RECENT_CONTACTS.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedRecipient(contact)}
                  className={[
                    'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-muted',
                    selectedRecipient.id === contact.id ? 'bg-brand-50' : '',
                  ].join(' ')}
                >
                  <Avatar
                    name={contact.name}
                    size="sm"
                    className={[contact.avatarColor, contact.avatarTextColor].join(' ')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text-primary">{contact.name}</p>
                    <p className="truncate text-xs text-text-muted">{contact.phone}</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors group-hover:border-brand-300 group-hover:bg-brand-50 group-hover:text-brand-600">
                    <SendIcon className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
