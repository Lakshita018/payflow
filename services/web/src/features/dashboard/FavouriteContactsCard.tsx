import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES, userProfilePath } from '@/routes/paths';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services';
import { PlusIcon } from './icons';

const itemVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

export function FavouriteContactsCard() {
  const navigate = useNavigate();

  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn: userService.getFavourites,
    staleTime: 60_000,
  });

  return (
    <Card variant="elevated" className="h-full p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-semibold text-text-primary">Favourite Contacts</p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.FAVOURITES)}
          className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
        >
          View all →
        </button>
      </div>

      {favourites.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No favourite contacts yet"
            description="Send money to someone and add them as a favourite."
            action={{ label: 'Send Money', onClick: () => navigate(ROUTES.SEND_MONEY) }}
          />
        </div>
      ) : (
        /* Horizontal bubble strip */
        <motion.div
          className="mt-4 flex flex-nowrap gap-4 overflow-x-auto pb-1 scrollbar-hide"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {favourites.slice(0, 7).map((contact) => (
            <motion.button
              key={contact.payflowId}
              type="button"
              variants={itemVariants}
              onClick={() => navigate(userProfilePath(contact.payflowId))}
              className="group flex shrink-0 flex-col items-center gap-2"
              title={contact.displayName}
            >
              {/* Avatar with hover ring */}
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full ring-2 ring-transparent transition-all duration-200 group-hover:ring-brand-400 group-hover:ring-offset-2 group-hover:ring-offset-surface">
                <Avatar
                  name={contact.displayName}
                  size="lg"
                  className="h-14 w-14 bg-brand-100 text-brand-700 text-base font-semibold"
                />
              </span>
              <span className="max-w-[3.5rem] truncate text-center text-[11px] font-medium text-text-secondary">
                {contact.displayName.split('@')[0]}
              </span>
            </motion.button>
          ))}

          {/* Add new bubble */}
          <motion.button
            type="button"
            variants={itemVariants}
            onClick={() => navigate(ROUTES.SEND_MONEY)}
            className="group flex shrink-0 flex-col items-center gap-2"
            title="Add new contact"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface-subtle transition-all duration-200 group-hover:border-brand-400 group-hover:bg-brand-50">
              <PlusIcon className="h-5 w-5 text-text-muted group-hover:text-brand-500" />
            </span>
            <span className="text-[11px] font-medium text-text-muted">Add New</span>
          </motion.button>
        </motion.div>
      )}
    </Card>
  );
}
