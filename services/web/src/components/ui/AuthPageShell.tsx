// ---------------------------------------------------------------------------
// AuthPageShell — shared left+right panel layout used by all auth pages.
// ---------------------------------------------------------------------------
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/routes/paths';

// ── Left panel decorative elements ───────────────────────────────────────────

function MockPhoneUI() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 3 }}
      animate={{ opacity: 1, y: 0, rotate: 3 }}
      transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-6 top-0 rounded-[2rem] border border-white/12 bg-white/8 p-3 shadow-[0_40px_80px_rgb(0_0_0/0.45)] backdrop-blur-2xl"
    >
      <div className="relative h-[17rem] w-48 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 text-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-300/90" />
        <div className="mt-4 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span>Balance</span><span>PayFlow</span>
        </div>
        <p className="mt-1 text-[1.35rem] font-bold tracking-tight text-slate-900">₹24,250.00</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold text-slate-500">
          {['Send','Add','Pay'].map((a) => (
            <div key={a} className="rounded-xl bg-white px-1.5 py-2 shadow-sm">{a}</div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-white p-2.5 shadow-sm">
          <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-slate-400">Recent</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[10px]">
              <span className="font-medium text-slate-700">Aurora Labs</span>
              <span className="font-semibold text-emerald-600">+₹1,240</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[10px]">
              <span className="font-medium text-slate-700">Northwind</span>
              <span className="font-medium text-slate-400">−₹480</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MockCardChip() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, rotate: -14 }}
      animate={{ opacity: 1, x: 0, rotate: -14 }}
      transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 top-8 rounded-[1.75rem] border border-white/12 bg-white/10 p-3.5 shadow-[0_30px_60px_rgb(0_0_0/0.35)] backdrop-blur-xl"
    >
      <div className="h-24 w-40 rounded-[1.25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
        <div className="flex items-center justify-between text-[9px] font-semibold tracking-[0.2em] text-white/70">
          <span>PAYFLOW</span><span>DEBIT</span>
        </div>
        <div className="mt-5 flex items-center gap-1">
          <div className="h-2.5 w-7 rounded-sm bg-amber-300/70" />
          <div className="h-2.5 w-2 rounded-sm bg-amber-200/50" />
        </div>
        <div className="mt-2.5 flex items-end justify-between text-[10px] text-white/60">
          <span className="tracking-widest">•••• 2841</span>
          <span>08/29</span>
        </div>
      </div>
    </motion.div>
  );
}

function MockPaymentNotif() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-4 right-2 rounded-2xl border border-white/20 bg-[rgba(30,15,80,0.72)] px-4 py-3 shadow-[0_20px_40px_rgb(0_0_0/0.45)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/25">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,0.25)]" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">Payment sent</p>
          <p className="text-[10px] font-medium text-white/80">To Nova Studio · 2m ago</p>
        </div>
        <span className="ml-1 text-xs font-bold text-emerald-300">−₹480</span>
      </div>
    </motion.div>
  );
}

function StatPill({ label, value, up }: { label: string; value: string; up: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3.5 py-2.5 backdrop-blur-md">
      <span className={`text-xs font-bold ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{up ? '↑' : '↓'}</span>
      <div>
        <p className="text-[10px] text-white/50">{label}</p>
        <p className="text-xs font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthPageShellProps {
  heroTitle: string;
  heroBody: string;
  children: ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthPageShell({ heroTitle, heroBody, children }: AuthPageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--auth-bg)] text-text-primary">
      {/* Ambient blobs on the right panel */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-brand-400/8 blur-[100px]" />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">

        {/* ── Left hero panel ─────────────────────────────────────────────── */}
        <aside className="relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-[44%]" aria-hidden="true">
          {/* Background layers */}
          <div className="absolute inset-0 bg-[linear-gradient(150deg,#1e0a4a_0%,#3b0f8c_40%,#6d28d9_80%,#7c3aed_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.22),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.2),transparent_45%)]" />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgb(255_255_255/0.5)_1px,transparent_1px)] [background-size:28px_28px]" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#3b0f8c]/60 to-transparent" />

          {/* Trusted pill — top-right corner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-6 top-6 z-10 xl:right-8 xl:top-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Trusted by 50,000+ users
            </div>
          </motion.div>

          <div className="relative flex w-full flex-col justify-between px-10 py-10 text-white xl:px-14 xl:py-12">

            {/* Logo */}
            <motion.button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                <span className="text-xl font-bold text-white">P</span>
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-white">PayFlow</p>
                <p className="text-[0.6875rem] text-white/50">Premium payments infrastructure</p>
              </div>
            </motion.button>

            {/* Hero copy */}
            <motion.div
              className="max-w-md"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-tight text-white xl:text-5xl">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-white/60">
                {heroBody}
              </p>
              {/* Stat pills */}
              <div className="mt-6 flex flex-wrap gap-2">
                <StatPill label="This month" value="₹2.4L transferred" up={true} />
                <StatPill label="Success rate" value="99.8% uptime" up={true} />
              </div>
            </motion.div>

            {/* Decorative mockups */}
            <div className="relative min-h-64 xl:min-h-72">
              {/* Glow orbs */}
              <div className="absolute left-4 top-4 h-20 w-20 rounded-full bg-violet-400/20 blur-2xl" />
              <div className="absolute right-10 top-8 h-32 w-32 rounded-full bg-brand-300/15 blur-3xl" />
              <MockCardChip />
              <MockPhoneUI />
              <MockPaymentNotif />
            </div>

          </div>
        </aside>

        {/* ── Right form panel ─────────────────────────────────────────────── */}
        <section className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
          {/* Theme toggle */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <ThemeToggle />
          </div>

          <motion.div
            className="w-full max-w-[25rem]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow-brand">
                <span className="text-lg font-bold">P</span>
              </div>
              <div>
                <p className="text-base font-bold tracking-tight text-text-primary">PayFlow</p>
                <p className="text-xs text-text-muted">Premium payments infrastructure</p>
              </div>
            </div>

            {children}

            {/* Footer note */}
            <p className="mt-6 text-center text-[11px] text-text-muted">
              Protected by 256-bit encryption · SOC 2 compliant
            </p>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
