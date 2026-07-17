import EmptyState from '@/components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { SendMoneyIcon } from '@/features/dashboard/icons';

export function TransactionEmptyState() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<SendMoneyIcon className="h-5 w-5" />}
      title="No Transactions Yet"
      description="Your payment history will appear here after your first transfer."
      action={{ label: 'Send Money', onClick: () => navigate(ROUTES.SEND_MONEY) }}
      className="py-16"
    />
  );
}