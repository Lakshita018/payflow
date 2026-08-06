// ---------------------------------------------------------------------------
// UserSearchInput — live-search input that shows a dropdown of matching
// PayFlow users as the user types.
//
// Behaviour (mirrors the dashboard TopNavigation search):
//   • Shows recent contacts when the field is empty (if provided)
//   • Fires userService.search() after a 250 ms debounce on every keystroke
//   • Spinner shows immediately while the user types (before debounce fires)
//   • Distinguishes API errors from genuine "no results"
//   • Dropdown disappears when a user is selected or the field loses focus
//   • Keyboard: ArrowUp/Down to navigate, Enter to confirm, Escape to close
// ---------------------------------------------------------------------------
import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import { userService } from '@/services';
import { useDebounce } from '@/hooks';
import type { PublicProfile, RecentContact } from '@/types';

interface UserSearchInputProps {
  /** Called when the user selects a result from the dropdown. */
  onSelect: (user: PublicProfile) => void;
  /** Optional list of recent contacts shown before the user starts typing. */
  recentContacts?: RecentContact[];
  placeholder?: string;
  /** Additional class names for the outer wrapper div. */
  className?: string;
  /** Auto-focus the input on mount. */
  autoFocus?: boolean;
}

export function UserSearchInput({
  onSelect,
  recentContacts = [],
  placeholder = 'Search by name, email or PayFlow ID…',
  className = '',
  autoFocus = false,
}: UserSearchInputProps) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use a shorter debounce so results arrive quickly
  const debounced = useDebounce(value.trim(), 250);

  // Live search results
  const { data: results = [], isFetching, isError } = useQuery<PublicProfile[]>({
    queryKey: ['user-search-input', debounced],
    queryFn: () => userService.search(debounced),
    enabled: debounced.length >= 1,
    staleTime: 15_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });

  // Is the user currently typing (value has text but debounce hasn't fired yet)?
  const isTyping = value.trim() !== debounced;

  // Items shown in the dropdown
  const hasQuery  = debounced.length >= 1;
  const items: PublicProfile[] = hasQuery ? results : recentContacts.slice(0, 5);

  // Show dropdown when:
  //  - open and field has text (always show spinner/results/error state), OR
  //  - open and no text but recent contacts exist
  const showDropdown = open && (value.trim().length > 0 || recentContacts.length > 0);

  // Show spinner while typing OR while fetching
  const showSpinner = isFetching || isTyping && debounced.length >= 1;

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const handleSelect = useCallback((user: PublicProfile) => {
    setValue('');
    setOpen(false);
    setActiveIndex(-1);
    onSelect(user);
  }, [onSelect]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    const count = items.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, count - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? items[activeIndex] : items[0];
      if (target) handleSelect(target);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  const sectionLabel = hasQuery ? 'Results' : 'Recent';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        {/* Search icon */}
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="input w-full pl-10 pr-9"
        />

        {/* Spinner — shown while typing or waiting for results */}
        {showSpinner && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            <svg className="h-4 w-4 animate-spin text-text-muted" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">

          {/* While typing / fetching — only show label if there are already stale results */}
          {(isFetching || isTyping) && items.length === 0 && (
            <p className="px-3 py-3 text-sm text-text-muted">Searching…</p>
          )}

          {/* API error state */}
          {isError && !isFetching && !isTyping && (
            <p className="px-3 py-3 text-sm text-danger">
              Could not connect to search. Check your connection and try again.
            </p>
          )}

          {/* Section label */}
          {items.length > 0 && (
            <p className="px-3 pt-2.5 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
              {sectionLabel}
            </p>
          )}

          {/* Result rows */}
          {items.map((user, i) => {
            const name = user.displayName ?? user.payflowId.split('@')[0] ?? user.payflowId;
            return (
              <button
                key={user.payflowId}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(user); }}
                className={[
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                  i === activeIndex
                    ? 'bg-brand-50 dark:bg-brand-950/40'
                    : 'hover:bg-surface-subtle',
                ].join(' ')}
              >
                <Avatar
                  name={name}
                  size="sm"
                  className="shrink-0 bg-brand-100 text-brand-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  <p className="truncate text-xs text-text-muted">{user.payflowId}</p>
                </div>
              </button>
            );
          })}

          {/* Genuine no-results — only shown after fetch completes with no error */}
          {hasQuery && !isFetching && !isTyping && !isError && results.length === 0 && (
            <p className="px-3 py-3 text-sm text-text-muted">
              No users found for &ldquo;{debounced}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}
