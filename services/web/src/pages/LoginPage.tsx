import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginMutation } from '@/hooks';
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

// ── Field component — icon + input with focus ring ───────────────────────────

function Field({
  id, label, type = 'text', value, onChange, placeholder, autoComplete, icon, suffix,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  icon: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-text-secondary"
      >
        {label}
      </label>
      <div className="relative">
        {/* Icon */}
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted transition-colors group-focus-within:text-brand-600">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={[
            'w-full rounded-xl border border-border bg-surface-subtle',
            'py-3 pl-10 text-sm text-text-primary placeholder:text-text-muted',
            suffix ? 'pr-11' : 'pr-3.5',
            'transition-all duration-150',
            'hover:border-border-strong',
            'focus:border-brand-600 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/15',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          ].join(' ')}
        />
        {/* Left border accent on focus */}
        {suffix}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password, rememberMe });
  };

  return (
    <AuthPageShell
      heroTitle="Move Money Smarter."
      heroBody="Secure payments. Instant transfers. Designed for the future."
    >
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-[1.625rem] font-bold tracking-tight text-text-primary">Welcome back</h2>
        <p className="mt-1 text-sm text-text-muted">Sign in to continue to PayFlow.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>

        {/* API error banner */}
        <AnimatePresence>
          {loginMutation.isError && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/6 px-4 py-3"
            >
              <svg className="mt-px h-4 w-4 shrink-0 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-danger">{getApiErrorMessage(loginMutation.error)}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <Field
          id="login-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
          icon={<MailIcon />}
        />

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="login-password">
              Password
            </label>
            <button
              type="button"
              onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
              className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-500"
            >
              Forgot password?
            </button>
          </div>
          <Field
            id="login-password"
            label=""
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
            icon={<LockIcon />}
            suffix={
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3.5 flex items-center text-text-muted transition-colors hover:text-text-primary"
              >
                <EyeIcon visible={showPassword} />
              </button>
            }
          />
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-0.5">
          <label htmlFor="remember-me" className="flex cursor-pointer select-none items-center gap-2.5">
            <div className="relative flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-border bg-surface transition-all checked:border-brand-600 checked:bg-brand-600 hover:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-600/20"
              />
              <svg
                className="pointer-events-none absolute left-0 h-4 w-4 scale-0 text-white transition-transform peer-checked:scale-100"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true"
              >
                <path d="M5 12l4 4 10-10" />
              </svg>
            </div>
            <span className="text-sm text-text-secondary">Remember me</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="group relative mt-1 inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c3aed_0%,#6d28d9_60%,#4f46e5_100%)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgb(109_40_217/0.30)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_32px_rgb(109_40_217/0.40)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none"
        >
          {/* Shimmer overlay */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          {loginMutation.isPending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span>Sign In</span>
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path d="M5 12h12" /><path d="m13 6 6 6-6 6" />
              </svg>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">New to PayFlow?</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Register link */}
        <button
          type="button"
          onClick={() => navigate(ROUTES.REGISTER)}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-subtle text-sm font-semibold text-text-primary transition-all duration-150 hover:border-border-strong hover:bg-surface hover:-translate-y-px active:translate-y-0"
        >
          Create a free account
        </button>

      </form>
    </AuthPageShell>
  );
}
