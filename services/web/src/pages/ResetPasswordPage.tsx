import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '@/hooks';
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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const mutation = useResetPasswordMutation();

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [clientError, setClientError]         = useState('');

  // ── Missing token guard ──────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-[24px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mb-6 flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50">
            <svg className="h-7 w-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Invalid reset link</h2>
          <p className="mt-2 text-sm text-slate-500">
            This password reset link is missing a token. Please request a new one.
          </p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(109,40,217,0.25)] transition-all hover:-translate-y-0.5"
          >
            Request new link
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');

    if (password.length < 8) {
      setClientError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setClientError('Passwords do not match.');
      return;
    }

    mutation.mutate({ token, password });
  };

  const displayError = clientError || (mutation.isError ? getApiErrorMessage(mutation.error) : '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-50 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(109,40,217,0.12),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.12),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#f3f4f6_100%)]" />

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* ── Decorative left panel ── */}
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
                Set a new password.
              </p>
              <p className="mt-6 max-w-md text-base leading-7 text-white/70 xl:text-lg">
                Choose a strong password that you haven&apos;t used before. Your security is our priority.
              </p>
            </div>

            {/* Decorative blobs */}
            <div className="relative mt-14 min-h-[12rem] xl:mt-16">
              <div className="absolute left-6 top-4 h-32 w-32 rounded-full bg-white/14 blur-2xl" />
              <div className="absolute right-6 top-10 h-44 w-44 rounded-full bg-brand-300/18 blur-3xl" />
              <div className="absolute left-10 bottom-6 h-16 w-16 rounded-full border border-white/15 bg-white/10 blur-[0.2px]" />
            </div>
          </div>
        </aside>

        {/* ── Form panel ── */}
        <section className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:w-[55%] lg:px-10 lg:py-10">
          <div className="w-full max-w-2xl rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-[0_20px_40px_rgba(109,40,217,0.28)]">
                <span className="text-xl font-semibold">P</span>
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900">PayFlow</p>
                <p className="text-xs text-slate-500">Premium payments infrastructure</p>
              </div>
            </div>

            {/* ── Success state ── */}
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50">
                  <svg className="h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Password updated!</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  {mutation.data.message}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
                  className="mt-8 group inline-flex h-14 w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(109,40,217,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(109,40,217,0.38)]"
                >
                  <span>Go to Login</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                      <path d="M5 12h12" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="max-w-md">
                  <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    New Password
                  </p>
                  <p className="mt-3 text-sm text-slate-500 sm:text-base">
                    Enter and confirm your new password below.
                  </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                  {/* Error banner */}
                  {displayError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                      {displayError}
                    </div>
                  )}

                  {/* New password */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="new-password">
                      New Password
                    </label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors group-hover:text-slate-500">
                        <LockIcon />
                      </span>
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-11 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10"
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

                  {/* Confirm password */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400 transition-colors group-hover:text-slate-500">
                        <LockIcon />
                      </span>
                      <input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-11 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white hover:shadow-md focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 transition-colors hover:text-slate-600"
                      >
                        <EyeIcon visible={showConfirm} />
                      </button>
                    </div>
                  </div>

                  {/* Password strength hint */}
                  {password.length > 0 && password.length < 8 && (
                    <p className="text-xs text-amber-600">
                      Password must be at least 8 characters.
                    </p>
                  )}
                  {password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-amber-600">Passwords do not match.</p>
                  )}

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(109,40,217,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(109,40,217,0.38)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {mutation.isPending ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Update Password</span>
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
                    Back to{' '}
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.LOGIN)}
                      className="font-semibold text-brand-700 transition-colors hover:text-brand-800"
                    >
                      Sign In
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
