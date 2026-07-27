// ---------------------------------------------------------------------------
// AuthPageShell — shared left+right panel layout used by all auth pages.
// The left panel has a branded gradient with decorative UI elements.
// The right panel contains the form card.
// ---------------------------------------------------------------------------
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/routes/paths';

// ── Decorative card mockup ────────────────────────────────────────────────────

function MockPhoneUI() {
  return (
    <div className="absolute right-10 top-2 rounded-[2rem] border border-white/10 bg-white/8 p-3 shadow-[0_35px_80px_rgb(15_23_42/0.42)] backdrop-blur-xl">
      <div className="relative h-80 w-52 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 text-slate-900 shadow-[0_24px_40px_rgb(15_23_42/0.22)]">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-slate-300/90" />
        <div className="mt-5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          <span>Balance</span>
          <span>PayFlow</span>
        </div>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight">$24,250.00</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-slate-500">
          <div className="rounded-xl bg-white px-2 py-2.5 shadow-sm">Send</div>
          <div className="rounded-xl bg-white px-2 py-2.5 shadow-sm">Add</div>
          <div className="rounded-xl bg-white px-2 py-2.5 shadow-sm">Pay</div>
        </div>
        <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span>Recent</span>
            <span>Today</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
              <span className="font-medium text-slate-700">Aurora Labs</span>
              <span className="text-emerald-600">+₹1,240</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
              <span className="font-medium text-slate-700">Northwind</span>
              <span className="text-slate-500">−₹480</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockCardChip() {
  return (
    <div className="absolute left-2 top-12 -rotate-12 rounded-[1.75rem] border border-white/12 bg-white/10 p-4 shadow-[0_30px_60px_rgb(15_23_42/0.35)] backdrop-blur-xl">
      <div className="h-24 w-40 rounded-[1.375rem] border border-white/10 bg-[linear-gradient(145deg,rgb(255_255_255/0.16),rgb(255_255_255/0.06))] p-4">
        <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.24em] text-white/70">
          <span>PAYFLOW</span>
          <span>DEBIT</span>
        </div>
        <div className="mt-7 h-2.5 w-10 rounded-full bg-white/30" />
        <div className="mt-3 flex items-end justify-between text-xs text-white/70">
          <span>•••• 2841</span>
          <span>08/29</span>
        </div>
      </div>
    </div>
  );
}

function MockPaymentNotif() {
  return (
    <div className="absolute bottom-10 right-4 rounded-[1.875rem] border border-white/10 bg-white/12 p-3 shadow-[0_30px_60px_rgb(15_23_42/0.34)] backdrop-blur-xl">
      <div className="flex items-center gap-3 rounded-[1.375rem] bg-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(74,222,128,0.15)]" />
        <div>
          <p className="text-xs font-medium text-white">Payment sent</p>
          <p className="text-[11px] text-white/65">To Nova Studio · 2m ago</p>
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthPageShellProps {
  /** Title shown in the left hero panel */
  heroTitle: string;
  /** Body text shown below hero title */
  heroBody: string;
  /** The form content to render in the right panel */
  children: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthPageShell({ heroTitle, heroBody, children }: AuthPageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--auth-bg)] text-text-primary">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgb(109_40_217/0.10),transparent_32%),radial-gradient(circle_at_85%_85%,rgb(79_70_229/0.08),transparent_30%)]" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* ── Left hero panel ─────────────────────────────────────────────── */}
        <aside
          className="relative hidden overflow-hidden lg:flex lg:w-[44%] xl:w-[42%]"
          aria-hidden="true"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#2e1065_0%,#4c1d95_46%,#6d28d9_100%)]" />
          {/* Radial glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(255_255_255/0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgb(167_139_250/0.16),transparent_28%)]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] [background-size:64px_64px]" />

          <div className="relative flex w-full flex-col justify-between px-10 py-10 text-white xl:px-14 xl:py-12">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15 backdrop-blur-sm">
                <span className="text-xl font-bold text-white">P</span>
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight text-white">PayFlow</p>
                <p className="text-[0.6875rem] text-white/55">Premium payments infrastructure</p>
              </div>
            </button>

            {/* Hero copy */}
            <div className="max-w-lg">
              <h1 className="text-[2.5rem] font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-white/70 xl:text-[1.0625rem]">
                {heroBody}
              </p>
            </div>

            {/* Decorative UI mockups */}
            <div className="relative min-h-72 xl:min-h-80">
              <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute right-8 top-12 h-36 w-36 rounded-full bg-brand-300/15 blur-3xl" />
              <MockCardChip />
              <MockPhoneUI />
              <MockPaymentNotif />
            </div>
          </div>
        </aside>

        {/* ── Right form panel ─────────────────────────────────────────────── */}
        <section className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:px-10">
          {/* Theme toggle */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>

          <motion.div
            className="w-full max-w-[26rem]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="flex items-center gap-3 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow-brand">
                  <span className="text-lg font-bold">P</span>
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight text-text-primary">PayFlow</p>
                  <p className="text-xs text-text-muted">Premium payments infrastructure</p>
                </div>
              </button>
            </div>

            {/* Form card */}
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-card-md sm:p-8">
              {children}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
