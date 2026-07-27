import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForgotPasswordMutation } from '@/hooks';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { ROUTES } from '@/routes/paths';
import { AuthPageShell } from '@/components/ui/AuthPageShell';

function MailIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
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

const inputBase =
  'w-full rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 hover:border-border-strong focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const mutation = useForgotPasswordMutation();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email: email.trim() });
  };

  return (
    <AuthPageShell
      heroTitle="Forgot your password?"
      heroBody="No worries — it happens. Enter your email and we'll send you a secure link to reset it."
    >
      {mutation.isSuccess ? (
        /* ── Success state ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
            <svg className="h-8 w-8 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">Check your inbox</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">{mutation.data.message}</p>
          <p className="mt-1.5 text-xs text-text-muted">The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="mt-7 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-muted px-5 text-sm font-medium text-text-primary transition-all hover:bg-border"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path d="M19 12H5" />
              <path d="m12 5-7 7 7 7" />
            </svg>
            Back to Login
          </button>
        </motion.div>
      ) : (
        /* ── Form state ── */
        <>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Reset Password</h2>
          <p className="mt-1.5 text-sm text-text-muted">Enter your email and we&apos;ll send you a reset link.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <AnimatePresence>
              {mutation.isError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger"
                >
                  {getApiErrorMessage(mutation.error)}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label" htmlFor="forgot-email">Email address</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                  <MailIcon />
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputBase} pl-10`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="group inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgb(109_40_217/0.28)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_16px_40px_rgb(109_40_217/0.36)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
            >
              {mutation.isPending ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M5 12h12" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-sm text-text-muted">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
              >
                Sign In
              </button>
            </p>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
