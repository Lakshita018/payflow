import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResetPasswordMutation } from '@/hooks';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { ROUTES } from '@/routes/paths';
import { AuthPageShell } from '@/components/ui/AuthPageShell';

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

const inputBase =
  'w-full rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 hover:border-border-strong focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed';

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

  // ── Missing token guard ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <AuthPageShell heroTitle="Invalid Link" heroBody="This reset link appears to be invalid or has expired.">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 ring-8 ring-danger/5">
            <svg className="h-7 w-7 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Invalid reset link</h2>
          <p className="mt-2 text-sm text-text-secondary">This link is missing a token. Please request a new one.</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_rgb(109_40_217/0.25)] transition-all hover:-translate-y-px"
          >
            Request new link
          </button>
        </div>
      </AuthPageShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    if (password.length < 8) { setClientError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setClientError('Passwords do not match.'); return; }
    mutation.mutate({ token, password });
  };

  const displayError = clientError || (mutation.isError ? getApiErrorMessage(mutation.error) : '');

  return (
    <AuthPageShell
      heroTitle="Set a new password."
      heroBody="Choose a strong password that you haven't used before. Your security is our priority."
    >
      {mutation.isSuccess ? (
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
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">Password updated!</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">{mutation.data.message}</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN, { replace: true })}
            className="mt-7 group inline-flex h-11 w-full max-w-xs items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgb(109_40_217/0.28)] transition-all hover:-translate-y-px hover:shadow-[0_16px_40px_rgb(109_40_217/0.36)]"
          >
            <span>Go to Login</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M5 12h12" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
        </motion.div>
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">New Password</h2>
          <p className="mt-1.5 text-sm text-text-muted">Enter and confirm your new password below.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <AnimatePresence>
              {displayError && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-sm text-danger"
                >
                  {displayError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* New password */}
            <div>
              <label className="label" htmlFor="new-password">New Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
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
                  className={`${inputBase} pl-10 pr-11`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-text-muted transition-colors hover:text-text-primary"
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-xs text-warning">Password must be at least 8 characters.</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label" htmlFor="confirm-new-password">Confirm New Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
                  <LockIcon />
                </span>
                <input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className={`${inputBase} pl-10 pr-11`}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-text-muted transition-colors hover:text-text-primary"
                >
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="mt-1 text-xs text-danger">Passwords do not match.</p>
              )}
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
                  <span>Update Password</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path d="M5 12h12" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-sm text-text-muted">
              Back to{' '}
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
