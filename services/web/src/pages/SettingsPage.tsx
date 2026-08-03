// ---------------------------------------------------------------------------
// SettingsPage — all account settings in one place.
//
// Sections:
//   1. Change Password
//   2. Logout from all devices
//   3. Email preferences
//   4. Notification preferences
//   5. Theme preference
//
// Changes are persisted immediately via dedicated API calls.
// Zustand auth store is patched on preference changes so the theme selection
// is reflected on the ThemeProvider without a reload.
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageContainer } from '@/layouts/PageContainer';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/store';
import { authService } from '@/services';
import { useLogout } from '@/hooks/useAuth';
import { useToast } from '@/providers/ToastProvider';

// ── small helper: inline toggle ───────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out focus:outline-none',
          checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600',
        ].join(' ')}
      >
        <span
          className={[
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </label>
  );
}

// ── ThemeSelector ─────────────────────────────────────────────────────────────
function ThemeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: 'light' | 'dark' | 'system') => void;
}) {
  const options = [
    { value: 'system', label: 'System',  description: 'Follow device setting' },
    { value: 'light',  label: 'Light',   description: 'Always light' },
    { value: 'dark',   label: 'Dark',    description: 'Always dark' },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'rounded-xl border p-3 text-left transition-colors',
            value === opt.value
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
              : 'border-border bg-surface hover:bg-surface-subtle',
          ].join(' ')}
        >
          <p className={`text-sm font-medium ${value === opt.value ? 'text-brand-700 dark:text-brand-400' : 'text-text-primary'}`}>
            {opt.label}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────
export function SettingsPage() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { setTheme, theme: activeTheme } = useTheme();
  const handleLogout = useLogout();
  const queryClient  = useQueryClient();
  const { toast } = useToast();

  // ── 1. Change password state ───────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]      = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');

  const changePwdMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to change password.';
      toast.error(msg);
    },
  });

  function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      changePwdMutation.reset();
      return;
    }
    changePwdMutation.mutate({ currentPassword, newPassword });
  }

  // ── 2. Logout all devices ──────────────────────────────────────────────────
  const logoutAllMutation = useMutation({
    mutationFn: authService.logoutAll,
    onSuccess: async () => {
      toast.info('All sessions invalidated. Signing you out…');
      await handleLogout();
    },
    onError: () => {
      toast.error('Failed to logout all devices. Please try again.');
    },
  });

  // ── 3. Push notification preference ───────────────────────────────────────
  // user may be null on first render (loaded async by useInitAuth), so we sync
  // local state whenever the user object arrives to avoid stale-true default.
  const [pushNotifications, setPushNotifications] = useState(user?.pushNotifications ?? true);
  useEffect(() => {
    if (user !== null) setPushNotifications(user.pushNotifications ?? true);
  // Only run when user transitions from null → loaded, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pushNotifications]);

  const prefMutation = useMutation({
    mutationFn: authService.updatePreferences,
    onSuccess: (updated) => {
      setUser({
        emailNotifications: updated.emailNotifications,
        pushNotifications:  updated.pushNotifications,
        themePreference:    updated.themePreference,
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Notification preferences saved.');
    },
    onError: () => {
      toast.error('Failed to save preferences. Please try again.');
    },
  });

  function handleSaveNotifications() {
    prefMutation.mutate({ pushNotifications });
  }

  // ── 5. Theme preference ────────────────────────────────────────────────────
  // Same async-load guard as pushNotifications above.
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>(
    (user?.themePreference ?? 'system') as 'light' | 'dark' | 'system',
  );

  const themeMutation = useMutation({
    mutationFn: authService.updatePreferences,
    onSuccess: (updated) => {
      setUser({ themePreference: updated.themePreference });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success('Appearance preference saved.');
    },
    onError: () => {
      toast.error('Failed to save theme. Please try again.');
    },
  });

  function handleSaveTheme() {
    setTheme(themePref);           // apply immediately to the UI
    themeMutation.mutate({ themePreference: themePref });
  }

  return (
    // No title/subtitle here — TopNavigation already shows "Settings / Adjust your preferences."
    <PageContainer>
      <motion.div
        className="grid gap-4 lg:grid-cols-2"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* ── Left column: Change Password + Session Management ────────── */}
        <div className="space-y-4">
          {/* 1. Change Password */}
          <Card variant="elevated" className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Change Password</h3>
              <p className="mt-0.5 text-sm text-text-muted">
                Update your password. You will remain logged in on this device.
              </p>
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                helperText="Minimum 8 characters."
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={
                  confirmPassword && newPassword !== confirmPassword
                    ? 'Passwords do not match'
                    : undefined
                }
              />
              <Button
                variant="primary"
                size="sm"
                loading={changePwdMutation.isPending}
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                onClick={handleChangePassword}
              >
                Update Password
              </Button>
            </div>
          </Card>

          {/* 2. Session Management */}
          <Card variant="elevated" className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Session Management</h3>
              <p className="mt-0.5 text-sm text-text-muted">
                Signed in on another device you don&apos;t recognise? Log out everywhere and sign in again.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <Button
                variant="danger"
                size="sm"
                loading={logoutAllMutation.isPending}
                onClick={() => logoutAllMutation.mutate()}
              >
                Logout from all devices
              </Button>
              <p className="mt-2 text-xs text-text-muted">
                This will immediately invalidate all active sessions including this one.
              </p>
            </div>
          </Card>
        </div>

        {/* ── Right column: Notifications + Appearance ─────────────────── */}
        <div className="space-y-4">
          {/* 3. Push Notifications only — email notifications removed (no SMTP) */}
          <Card variant="elevated" className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Notification Preferences</h3>
              <p className="mt-0.5 text-sm text-text-muted">
                Control how PayFlow notifies you about activity on your account.
              </p>
            </div>
            <div className="border-t border-border pt-1">
              <Toggle
                label="Push Notifications"
                description="In-app alerts for incoming transfers and wallet top-ups."
                checked={pushNotifications}
                onChange={setPushNotifications}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={prefMutation.isPending}
              onClick={handleSaveNotifications}
            >
              Save Notification Settings
            </Button>
          </Card>

          {/* 4. Appearance */}
          <Card variant="elevated" className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Appearance</h3>
              <p className="mt-0.5 text-sm text-text-muted">
                Choose your preferred colour scheme. Saved to your account and applied on every device.
              </p>
            </div>
            <div className="border-t border-border pt-4 space-y-4">
              <ThemeSelector value={themePref} onChange={setThemePref} />
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  loading={themeMutation.isPending}
                  disabled={themePref === activeTheme}
                  onClick={handleSaveTheme}
                >
                  Save Theme
                </Button>
                {themePref !== activeTheme && (
                  <p className="text-xs text-text-muted">
                    Preview changes by selecting a theme above.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </PageContainer>
  );
}
