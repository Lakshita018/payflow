import Input from '@/components/ui/Input';
import { SearchIcon } from '@/features/dashboard/icons';

export function TransactionSearch() {
  return (
    <Input
      aria-label="Search by name, phone, transaction ID or description"
      placeholder="Search by name, phone, transaction ID or description..."
      leftIcon={<SearchIcon className="h-4 w-4" />}
      className="h-11 rounded-2xl border-border bg-white px-4 text-sm shadow-sm"
    />
  );
}