import Card from '@/components/ui/Card';
import { ROUTES } from '@/routes/paths';
import { ChevronRightIcon, PlusIcon, SendMoneyIcon } from './icons';
import { useNavigate } from 'react-router-dom';

const actions = [
  {
    label: 'Send Money',
    description: 'Transfer to anyone',
    icon: SendMoneyIcon,
    path: ROUTES.SEND_MONEY,
  },
  {
    label: 'Add Money',
    description: 'Add funds to wallet',
    icon: PlusIcon,
  },
];

export function QuickActionsCard() {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="h-full p-6 sm:p-7">
      <p className="text-lg font-semibold tracking-tight text-text-primary">Quick Actions</p>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={() => action.path && navigate(action.path)}
              className={[
                'group flex w-full items-center gap-4 px-4 py-5 text-left transition-all duration-200 ease-out hover:-translate-y-px hover:bg-surface-muted',
                index === 0 ? 'border-b border-border' : '',
              ].join(' ')}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-transform duration-200 group-hover:scale-[1.03]">
                <Icon className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text-primary">{action.label}</span>
                <span className="block text-sm text-text-muted">{action.description}</span>
              </span>

              <ChevronRightIcon className="h-4 w-4 text-text-muted transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}