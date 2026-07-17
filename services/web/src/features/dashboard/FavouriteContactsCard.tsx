import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon } from './icons';
import { useNavigate } from 'react-router-dom';

type ContactItem = {
  name: string;
  phone: string;
  initials: string;
};

const contacts: ContactItem[] = [
  { name: 'Rohan Sharma', phone: '+91 98765 43210', initials: 'RS' },
  { name: 'Priya Patel', phone: '+91 91234 56789', initials: 'PP' },
  { name: 'Arav Mehta', phone: '+91 99887 76655', initials: 'AM' },
  { name: 'Sneha Iyer', phone: '+91 90001 23456', initials: 'SI' },
  { name: 'Kavya Nair', phone: '+91 95555 12345', initials: 'KN' },
];

export function FavouriteContactsCard() {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="h-full p-6 sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg font-semibold tracking-tight text-text-primary">Favourite Contacts</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.FAVOURITES)}
          className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
        >
          View all
        </button>
      </div>

      <div className="mt-6 divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border bg-surface">
        {contacts.map((contact) => (
          <button
            key={contact.name}
            type="button"
            className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-all duration-150 hover:bg-surface-muted/60"
          >
            <Avatar name={contact.name} size="md" className="bg-brand-100 text-brand-700" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{contact.name}</p>
              <p className="truncate text-sm text-text-muted">{contact.phone}</p>
            </div>

            <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.FAVOURITES)}
          className="group gap-2 rounded-full px-4 py-2 text-brand-700 transition-all duration-200 hover:bg-brand-50 hover:underline underline-offset-4"
          rightIcon={<ChevronRightIcon className="h-4 w-4" />}
        >
          View All Contacts
        </Button>
      </div>
    </Card>
  );
}