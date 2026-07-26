import { useQuery } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon } from './icons';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services';

export function FavouriteContactsCard() {
  const navigate = useNavigate();

  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn: userService.getFavourites,
    staleTime: 60_000,
  });

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

      {favourites.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No favourite contacts yet"
            description="Send money to someone and add them as a favourite."
            action={{ label: 'Send Money', onClick: () => navigate(ROUTES.SEND_MONEY) }}
          />
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border bg-surface">
          {favourites.slice(0, 5).map((contact) => (
            <button
              key={contact.payflowId}
              type="button"
              onClick={() => navigate(ROUTES.SEND_MONEY)}
              className="group flex w-full items-center gap-4 px-4 py-4 text-left transition-all duration-150 hover:bg-surface-muted/60"
            >
              <Avatar name={contact.displayName} size="md" className="bg-brand-100 text-brand-700" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{contact.displayName}</p>
                <p className="truncate text-sm text-text-muted">{contact.payflowId}</p>
              </div>

              <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}

      {favourites.length > 0 && (
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
      )}
    </Card>
  );
}
