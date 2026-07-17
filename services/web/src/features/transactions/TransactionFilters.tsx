type FilterOption = 'All' | 'Received' | 'Sent' | 'Today' | 'This Week' | 'This Month';

const filters: FilterOption[] = ['All', 'Received', 'Sent', 'Today', 'This Week', 'This Month'];

interface TransactionFiltersProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export function TransactionFilters({ activeFilter, onFilterChange }: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {filters.map((filter) => {
        const isActive = filter === activeFilter;

        return (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
              isActive
                ? 'border-brand-600 bg-brand-600 text-white shadow-[0_10px_24px_rgba(109,40,217,0.24)]'
                : 'border-border bg-white text-text-secondary hover:-translate-y-px hover:border-border-strong hover:text-text-primary hover:shadow-sm',
            ].join(' ')}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}

export type { FilterOption };