import { useState, type SVGProps } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

// ─── Icons ────────────────────────────────────────────────────────────────────

type IconProps = SVGProps<SVGSVGElement>;

function StarIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.2 16.2 20 20" />
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

function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DotsVerticalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="19" r="1.4" />
    </svg>
  );
}

function BankIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <path d="M3 9.5 12 4l9 5.5" />
      <rect x="5" y="10" width="3" height="7" />
      <rect x="10.5" y="10" width="3" height="7" />
      <rect x="16" y="10" width="3" height="7" />
      <path d="M2 19h20" />
    </svg>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M12 3 19 6v6c0 5-3.4 8.5-7 10-3.6-1.5-7-5-7-10V6l7-3Z" />
      <path d="M9.5 12.2 11.4 14 15 10.2" />
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

function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function ListIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── Types & data ─────────────────────────────────────────────────────────────

type ContactGroup = 'Personal' | 'Business' | 'Family';

type ContactEntry = {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  avatarTextColor: string;
  starred: boolean;
  group: ContactGroup | null;
  bank: string | null;
  accountMask: string | null;
};

const INITIAL_CONTACTS: ContactEntry[] = [
  {
    id: 'c1',
    name: 'Rohan Sharma',
    phone: '+91 98765 43210',
    avatarColor: 'bg-emerald-100',
    avatarTextColor: 'text-emerald-700',
    starred: true,
    group: 'Personal',
    bank: null,
    accountMask: null,
  },
  {
    id: 'c2',
    name: 'Priya Patel',
    phone: '+91 91234 56789',
    avatarColor: 'bg-rose-100',
    avatarTextColor: 'text-rose-600',
    starred: true,
    group: null,
    bank: 'HDFC Bank',
    accountMask: '5678',
  },
  {
    id: 'c3',
    name: 'Amit Kumar',
    phone: '+91 99887 66554',
    avatarColor: 'bg-teal-100',
    avatarTextColor: 'text-teal-700',
    starred: true,
    group: null,
    bank: 'ICICI Bank',
    accountMask: '1234',
  },
  {
    id: 'c4',
    name: 'Neha Kapoor',
    phone: '+91 98712 34567',
    avatarColor: 'bg-violet-100',
    avatarTextColor: 'text-violet-700',
    starred: true,
    group: null,
    bank: 'Axis Bank',
    accountMask: '7890',
  },
  {
    id: 'c5',
    name: 'Vikram Singh',
    phone: '+91 90001 23456',
    avatarColor: 'bg-sky-100',
    avatarTextColor: 'text-sky-700',
    starred: true,
    group: 'Personal',
    bank: null,
    accountMask: null,
  },
  {
    id: 'c6',
    name: 'Sneha Mehta',
    phone: '+91 91123 45678',
    avatarColor: 'bg-amber-100',
    avatarTextColor: 'text-amber-700',
    starred: false,
    group: null,
    bank: 'State Bank of India',
    accountMask: '3456',
  },
  {
    id: 'c7',
    name: 'Arjun Desai',
    phone: '+91 97777 88888',
    avatarColor: 'bg-rose-100',
    avatarTextColor: 'text-rose-600',
    starred: true,
    group: null,
    bank: 'Kotak Mahindra Bank',
    accountMask: '2468',
  },
  {
    id: 'c8',
    name: 'Yash Sharma',
    phone: '+91 87654 32109',
    avatarColor: 'bg-emerald-100',
    avatarTextColor: 'text-emerald-700',
    starred: true,
    group: 'Personal',
    bank: null,
    accountMask: null,
  },
];

type FilterOption = 'All Contacts' | 'Personal' | 'Business' | 'Family' | 'Bank Accounts';
type SortOption = 'Recently Added' | 'Name A–Z' | 'Name Z–A';
type ViewMode = 'grid' | 'list';

const FILTER_OPTIONS: FilterOption[] = ['All Contacts', 'Personal', 'Business', 'Family', 'Bank Accounts'];
const SORT_OPTIONS: SortOption[] = ['Recently Added', 'Name A–Z', 'Name Z–A'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GroupBadge({ group }: { group: ContactGroup }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-2xs font-medium text-brand-700 border border-brand-100">
      {group}
    </span>
  );
}

function BankRow({ bank, mask }: { bank: string; mask: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <BankIcon className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      <span className="text-xs text-text-secondary">{bank}</span>
      <span className="text-xs text-text-muted">•••• {mask}</span>
    </div>
  );
}

// Grid card
function ContactCard({
  contact,
  onToggleStar,
}: {
  contact: ContactEntry;
  onToggleStar: (id: string) => void;
}) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card transition-all duration-150 hover:border-border-strong hover:shadow-card-md">
      {/* Star + dots */}
      <div className="flex items-start justify-between">
        <Avatar
          name={contact.name}
          size="lg"
          className={[contact.avatarColor, contact.avatarTextColor].join(' ')}
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleStar(contact.id)}
            aria-label={contact.starred ? 'Remove from favourites' : 'Add to favourites'}
            className={['transition-colors', contact.starred ? 'text-brand-600' : 'text-text-muted hover:text-brand-500'].join(' ')}
          >
            <StarIcon filled={contact.starred} className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            aria-label="More options"
            className="text-text-muted transition-colors hover:text-text-secondary"
          >
            <DotsVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Name & phone */}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{contact.name}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{contact.phone}</p>
      </div>

      {/* Tag */}
      {contact.group ? (
        <GroupBadge group={contact.group} />
      ) : contact.bank && contact.accountMask ? (
        <BankRow bank={contact.bank} mask={contact.accountMask} />
      ) : null}
    </div>
  );
}

// List row
function ContactRow({
  contact,
  onToggleStar,
}: {
  contact: ContactEntry;
  onToggleStar: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-card transition-all duration-150 hover:border-border-strong hover:shadow-card-md">
      <Avatar
        name={contact.name}
        size="md"
        className={[contact.avatarColor, contact.avatarTextColor].join(' ')}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{contact.name}</p>
        <p className="truncate text-xs text-text-secondary">{contact.phone}</p>
      </div>

      <div className="hidden shrink-0 sm:block">
        {contact.group ? (
          <GroupBadge group={contact.group} />
        ) : contact.bank && contact.accountMask ? (
          <BankRow bank={contact.bank} mask={contact.accountMask} />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleStar(contact.id)}
          aria-label={contact.starred ? 'Remove from favourites' : 'Add to favourites'}
          className={['transition-colors', contact.starred ? 'text-brand-600' : 'text-text-muted hover:text-brand-500'].join(' ')}
        >
          <StarIcon filled={contact.starred} className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="More options"
          className="text-text-muted transition-colors hover:text-text-secondary"
        >
          <DotsVerticalIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Add-new placeholder card (grid only)
function AddNewCard() {
  return (
    <button
      type="button"
      className="group flex flex-col items-start gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-4 transition-all duration-150 hover:border-brand-400 hover:bg-brand-50"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-brand-300 bg-brand-100 text-brand-600 transition-colors group-hover:border-brand-400">
        <PlusIcon className="h-5 w-5" />
      </span>
      <div className="text-left">
        <p className="text-sm font-semibold text-brand-700">Add New Contact</p>
        <p className="mt-0.5 text-xs text-brand-500 leading-relaxed">Save a contact for faster and easier payments</p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FavouriteContactsPage() {
  const [contacts, setContacts] = useState<ContactEntry[]>(INITIAL_CONTACTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('All Contacts');
  const [sort, setSort] = useState<SortOption>('Recently Added');
  const [view, setView] = useState<ViewMode>('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const toggleStar = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c)),
    );
  };

  // Filter
  let visible = contacts.filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
    if (filter === 'Personal') return c.group === 'Personal';
    if (filter === 'Business') return c.group === 'Business';
    if (filter === 'Family') return c.group === 'Family';
    if (filter === 'Bank Accounts') return !!c.bank;
    return true;
  });

  // Sort
  if (sort === 'Name A–Z') visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'Name Z–A') visible = [...visible].sort((a, b) => b.name.localeCompare(a.name));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">

      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50">
            <StarIcon filled className="h-6 w-6 text-brand-600" />
          </span>
          <div>
            <p className="text-base font-semibold text-text-primary">Your favourite contacts</p>
            <p className="mt-0.5 text-sm text-text-secondary">Add and manage your most frequently used contacts for faster payments.</p>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusIcon className="h-4 w-4" />}
          className="h-11 shrink-0 rounded-2xl bg-brand-600 px-5 font-semibold shadow-[0_6px_20px_rgba(109,40,217,0.24)] hover:bg-brand-700"
        >
          Add New Contact
        </Button>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search favourite contacts..."
            className="input pl-9 h-10 rounded-xl text-sm"
          />
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:border-border-strong"
          >
            {filter}
            <ChevronDownIcon className={['h-4 w-4 text-text-muted transition-transform duration-150', filterOpen ? 'rotate-180' : ''].join(' ')} />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[160px] overflow-hidden rounded-xl border border-border bg-surface shadow-card-md">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setFilter(opt); setFilterOpen(false); }}
                  className={['w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted', filter === opt ? 'font-semibold text-brand-700 bg-brand-50' : 'text-text-primary'].join(' ')}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="ml-auto hidden text-sm text-text-secondary sm:inline">Sort by:</span>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:border-border-strong"
          >
            {sort}
            <ChevronDownIcon className={['h-4 w-4 text-text-muted transition-transform duration-150', sortOpen ? 'rotate-180' : ''].join(' ')} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-[calc(100%+4px)] z-20 min-w-[160px] overflow-hidden rounded-xl border border-border bg-surface shadow-card-md">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSort(opt); setSortOpen(false); }}
                  className={['w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted', sort === opt ? 'font-semibold text-brand-700 bg-brand-50' : 'text-text-primary'].join(' ')}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-label="Grid view"
            className={['flex h-10 w-10 items-center justify-center transition-colors', view === 'grid' ? 'bg-brand-600 text-white' : 'text-text-muted hover:bg-surface-muted'].join(' ')}
          >
            <GridIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-label="List view"
            className={['flex h-10 w-10 items-center justify-center transition-colors', view === 'list' ? 'bg-brand-600 text-white' : 'text-text-muted hover:bg-surface-muted'].join(' ')}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Contact grid / list ───────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface py-16 text-center shadow-card">
          <StarIcon className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-4 text-base font-semibold text-text-primary">No contacts found</p>
          <p className="mt-1 text-sm text-text-secondary">Try adjusting your search or filter.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onToggleStar={toggleStar} />
          ))}
          <AddNewCard />
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((contact) => (
            <ContactRow key={contact.id} contact={contact} onToggleStar={toggleStar} />
          ))}
        </div>
      )}

      {/* ── Security footer ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-subtle px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-primary">Your data is safe with PayFlow</p>
            <p className="text-xs text-text-secondary">We use bank-level security to protect your contact information and payment details.</p>
          </div>
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
        >
          Learn more
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
