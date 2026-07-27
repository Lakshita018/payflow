import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '@/hooks';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { ROUTES } from '@/routes/paths';

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="5" y="10" width="14" height="9" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TransactionDot() {
  return <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(74,222,128,0.14)]" />;
}

// Extracts a human-readable error message from an Axios error response.
function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError & { message?: string }>;
  if (!axiosErr.response) {
    return 'Unable to reach the server. Check that the backend is running.';
  }
  return (
    axiosErr.response.data?.error ??
    axiosErr.response.data?.message ??
    'Something went wrong. Please try again.'
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-50 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,40,217,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#f3f4f6_100%)]" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#2e1065_0%,#4c1d95_46%,#6d28d9_100%)] px-10 py-10 text-white lg:flex lg:w-[45%] xl:px-14 xl:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.16),_transparent_28%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

          <div className="relative flex w-full flex-col justify-between">
            <button
              type="button"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="flex items-center gap-3 text-left transition-opacity duration-200 hover:opacity-90"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 shadow-[0_20px_45px_rgba(17,24,39,0.22)] ring-1 ring-white/15 backdrop-blur-sm">
                <span className="text-2xl font-semibold text-white">P</span>
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">PayFlow</p>
                <p className="text-xs text-white/60">Premium payments infrastructure</p>
              </div>
            </button>

            <div className="max-w-lg pt-16 xl:pt-20">
              <p className="text-4xl font-semibold tracking-tight text-white xl:text-5xl">
                Move Money Smarter.
              </p>
              <p className="mt-6 max-w-md text-base leading-7 text-white/76 xl:text-lg">
                Secure payments.
                <br />
                Instant transfers.
                <br />
                Designed for the future.
              </p>
            </div>

            <div className="relative mt-14 min-h-[24rem] xl:mt-16">
              <div className="absolute left-6 top-8 h-28 w-28 rounded-full bg-white/14 blur-2xl" />
              <div className="absolute right-6 top-16 h-40 w-40 rounded-full bg-brand-300/18 blur-3xl" />

              <div className="absolute left-2 top-14 -rotate-12 rounded-[28px] border border-white/12 bg-white/12 p-4 shadow-[0_30px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <div className="h-28 w-44 rounded-[22px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] p-4">
                  <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.24em] text-white/70">
                    <span>PAYFLOW</span>
                    <span>DEBIT</span>
                  </div>
                  <div className="mt-8 h-3 w-12 rounded-full bg-white/30" />
                  <div className="mt-4 flex items-end justify-between text-xs text-white/70">
                    <span>•••• 2841</span>
                    <span>08/29</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-12 right-4 rounded-[30px] border border-white/10 bg-white/12 p-3 shadow-[0_30px_60px_rgba(15,23,42,0.34)] backdrop-blur-xl">
                <div className="flex items-center gap-3 rounded-[22px] bg-white/10 px-4 py-3">
                  <TransactionDot />
                  <div>
                    <p className="text-xs font-medium text-white">Payment sent</p>
                    <p className="text-[11px] text-white/65">To Nova Studio · 2m ago</p>
                  </div>
                </div>
              </div>

              <div className="absolute right-14 top-0 rounded-[34px] border border-white/10 bg-white/8 p-3 shadow-[0_35px_80px_rgba(15,23,42,0.42)] backdrop-blur-xl">
                <div className="relative h-[22rem] w-[14rem] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 text-slate-900 shadow-[0_24px_40px_rgba(15,23,42,0.22)]">
                  <div className="mx-auto h-1.5 w-16 rounded-full bg-slate-300/90" />
                  <div className="mt-6 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    <span>Balance</span>
                    <span>PayFlow</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">$24,250.00</p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-slate-500">
                    <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">Send</div>
                    <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">Add</div>
                    <div className="rounded-2xl bg-white px-2 py-3 shadow-sm">Pay</div>
                  </div>
                  <div className="mt-5 rounded-[22px] bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span>Recent transfer</span>
                      <span>Today</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">Aurora Labs</span>
                        <span className="text-emerald-600">+$1,240</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">Northwind</span>
                        <span className="text-slate-500">-$480</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute left-10 bottom-6 h-16 w-16 rounded-full border border-white/15 bg-white/10 blur-[0.2px]" />
            </div>
          </div>
        </aside>

        <section className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:w-[55%] lg:px-10 lg:py-10">
          <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
            <button
              type="button"
              aria-label="Dark mode toggle"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-200 hover:border-white hover:bg-white hover:text-slate-900 active:scale-[0.98]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.5 1.5M17.8 17.8l1.5 1.5M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.5-1.5M17.8 6.2l1.5-1.5" />
                </svg>
              </span>
              <span className="hidden sm:inline">Dark</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.2 13.9A7.2 7.2 0 1 1 10.1 3a8.2 8.2 0 1 0 6.1 10.9Z" />
                </svg>
              </span>
            </button>
          </div>

          <div className="w-full max-w-2xl rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-[0_20px_40px_rgba(109,40,217,0.28)]">
                <span className="text-xl font-semibold">P</span>
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">PayFlow</p>
                <p className="text-xs text-slate-500">Premium payments infrastructure</p>
              </div>
            </div>

            <div className="max-w-md">
              <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Welcome Back
              </p>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Sign in to continue to PayFlow.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Global API error */}
              {loginMutation.isError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {getApiErrorMessage(loginMutation.error)}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors group-hover:text-slate-500">
                    <MailIcon />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                    Password
                  </label>
                  {/* Forgot Password link — navigates to the dedicated page */}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                    className="text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="group relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors group-hover:text-slate-500">
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-11 pr-11 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-3 text-slate-600">
                  <span className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-[7px] border border-slate-300 bg-white transition-all duration-200 checked:border-brand-700 checked:bg-brand-700 hover:border-brand-500 focus:ring-4 focus:ring-brand-700/10"
                    />
                    <svg
                      className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 scale-0 text-white transition-transform duration-200 peer-checked:scale-100"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  </span>
                  Remember Me
                </label>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(109,40,217,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(109,40,217,0.38)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
              >
                {loginMutation.isPending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Login</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path d="M5 12h12" />
                        <path d="m13 6 6 6-6 6" />
                      </svg>
                    </span>
                  </>
                )}
              </button>

              <p className="pt-2 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => navigate(ROUTES.REGISTER)} className="font-semibold text-brand-700 transition-colors hover:text-brand-800">
                  Create Account
                </button>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
