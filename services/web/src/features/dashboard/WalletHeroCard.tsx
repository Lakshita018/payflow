import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ArrowUpRightIcon, PlusIcon, SendMoneyIcon } from './icons';

export function WalletHeroCard() {
  return (
    <Card
      variant="elevated"
      className="relative overflow-hidden border-0 bg-[linear-gradient(135deg,#4c1d95_0%,#5b21b6_35%,#6d28d9_70%,#7c3aed_100%)] p-6 text-white shadow-[0_24px_60px_rgba(109,40,217,0.28)] sm:p-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_26%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-white/75">Total Wallet Balance</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">₹48,750.50</p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              className="h-12 rounded-2xl border-0 bg-white px-5 text-sm font-semibold text-brand-700 shadow-[0_10px_28px_rgba(15,23,42,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/95"
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add Money
            </Button>
            <Button
              variant="ghost"
              className="h-12 rounded-2xl border border-white/30 bg-white/8 px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/12"
              leftIcon={<SendMoneyIcon className="h-4 w-4" />}
            >
              Send Money
            </Button>
          </div>
        </div>

        <div className="relative mx-auto h-60 w-full max-w-[21rem] shrink-0 sm:h-64 lg:mx-0">
          <div className="absolute right-0 top-4 h-36 w-36 rounded-[2rem] bg-white/10 shadow-[0_20px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm" />
          <div className="absolute right-6 top-8 h-32 w-32 rounded-[1.8rem] bg-white/14 shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-sm" />

          <div className="absolute left-4 top-10 h-28 w-36 rounded-[2rem] border border-white/20 bg-white/12 p-4 shadow-[0_22px_45px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-white/68">
              <span>PayFlow</span>
              <span>Wallet</span>
            </div>
            <div className="mt-8 h-3 w-12 rounded-full bg-white/35" />
            <div className="mt-4 flex items-center justify-between text-xs text-white/75">
              <span>•••• 2841</span>
              <span>08/29</span>
            </div>
          </div>

          <div className="absolute bottom-0 right-0 h-48 w-34 rotate-[-10deg] rounded-[2rem] border border-white/20 bg-[linear-gradient(180deg,#f5f3ff_0%,#ede9fe_100%)] p-4 shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />
            <div className="mt-6 rounded-2xl bg-white/85 p-3 text-slate-700 shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mobile Wallet</p>
              <p className="mt-2 text-lg font-semibold tracking-tight">₹48,750.50</p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-sm">
              <span>Ready to pay</span>
              <ArrowUpRightIcon className="h-4 w-4 text-brand-600" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}