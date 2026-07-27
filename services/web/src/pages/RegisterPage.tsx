import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterMutation } from '@/hooks';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { ROUTES } from '@/routes/paths';
import { AuthPageShell } from '@/components/ui/AuthPageShell';

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>;
  if (axiosErr.response?.data?.details?.length) {
    return axiosErr.response.data.details.map((d) => d.message).join(' ');
  }
  return axiosErr.response?.data?.error ?? 'Something went wrong. Please try again.';
}

const inputBase =
  'w-full rounded-xl border border-border bg-surface-subtle px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-all duration-150 hover:border-border-strong focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-60 disabled:cursor-not-allowed';

export function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientError, setClientError] = useState('');

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

    registerMutation.mutate({ email: email.trim(), password });
  };

  const displayError = clientError || (registerMutation.isError ? getApiErrorMessage(registerMutation.error) : '');

  return (
    <AuthPageShell
      heroTitle="Join PayFlow today."
      heroBody="Open your account in minutes. Send, receive, and manage money with confidence."
    >
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Create account</h2>
      <p className="mt-1.5 text-sm text-text-muted">Sign up to get started with PayFlow.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        {/* Error banner */}
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

        {/* Success banner */}
        <AnimatePresence>
          {registerMutation.isSuccess && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-success/20 bg-success/5 px-3.5 py-3 text-sm text-success"
            >
              Account created! Redirecting to sign in…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label className="label" htmlFor="register-email">Email</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
              <MailIcon />
            </span>
            <input
              id="register-email"
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

        {/* Password */}
        <div>
          <label className="label" htmlFor="register-password">Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
              <LockIcon />
            </span>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 8 chars)"
              className={`${inputBase} pl-10`}
            />
          </div>
          {/* Inline password strength */}
          {password.length > 0 && (
            <p className={['mt-1 text-xs', password.length >= 8 ? 'text-success' : 'text-warning'].join(' ')}>
              {password.length >= 8 ? '✓ Password length is good' : `${8 - password.length} more characters needed`}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="label" htmlFor="register-confirm-password">Confirm Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted">
              <LockIcon />
            </span>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className={`${inputBase} pl-10`}
            />
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="mt-1 text-xs text-danger">Passwords do not match</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={registerMutation.isPending || registerMutation.isSuccess}
          className="group inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_50%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgb(109_40_217/0.28)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_16px_40px_rgb(109_40_217/0.36)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          {registerMutation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Create Account</span>
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M5 12h12" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </>
          )}
        </button>

        <p className="text-center text-sm text-text-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate(ROUTES.LOGIN)}
            className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthPageShell>
  );
}
