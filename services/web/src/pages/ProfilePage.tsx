// ---------------------------------------------------------------------------
// ProfilePage — view + edit mode for the authenticated user's profile.
//
// Edit mode allows:
//   • Display name
//   • Phone number
//   • Profile picture / avatar (with upload-progress simulation and size validation)
//
// Changes are persisted via PATCH /api/v1/auth/me.
// The Zustand auth store is patched on success so the UI reflects the new
// values everywhere immediately without a full page reload.
// ---------------------------------------------------------------------------
import { useRef, useState, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageContainer } from '@/layouts/PageContainer';
import { useAuthStore } from '@/store';
import { walletService, transactionService, userService, authService } from '@/services';
import { useToast } from '@/providers/ToastProvider';

// ── constants ─────────────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

// ── helpers ──────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Avatar component ─────────────────────────────────────────────────────────
function AvatarDisplay({
  avatarUrl,
  name,
  size = 'xl',
}: {
  avatarUrl: string | null;
  name: string;
  size?: 'xl' | 'lg';
}) {
  const dim = size === 'xl' ? 'h-16 w-16' : 'h-12 w-12';
  const text = size === 'xl' ? 'text-2xl' : 'text-lg';
  const initials = name
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} rounded-full object-cover border-2 border-border`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center bg-brand-100 text-brand-700 font-semibold ${text} select-none`}
    >
      {initials || name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── derived display values ──────────────────────────────────────────────────
  const resolvedName  = user?.displayName ?? user?.email?.split('@')[0] ?? user?.payflowId?.split('@')[0] ?? 'Account';
  const payflowId     = user?.payflowId ?? '—';

  // ── edit-mode state ─────────────────────────────────────────────────────────
  const [editing, setEditing]           = useState(false);
  const [displayName, setDisplayName]   = useState('');
  const [phone, setPhone]               = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarB64, setAvatarB64]       = useState<string | null>(null); // undefined = untouched
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [imageError, setImageError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── queries ──────────────────────────────────────────────────────────────────
  const { data: wallet } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn:  walletService.getBalance,
    staleTime: 30_000,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  transactionService.getDashboard,
    staleTime: 30_000,
  });

  const { data: favourites = [] } = useQuery({
    queryKey: ['favourites'],
    queryFn:  userService.getFavourites,
    staleTime: 60_000,
  });

  // ── mutation ──────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updated) => {
      setUser({
        displayName: updated.displayName,
        phone:       updated.phone,
        avatarUrl:   updated.avatarUrl,
      });
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setEditing(false);
      setUploadProgress(0);
      toast.success('Profile updated successfully.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save changes.';
      toast.error(msg);
    },
  });

  // ── derived ───────────────────────────────────────────────────────────────────
  const balanceDisplay = wallet?.balance
    ? '₹' + parseFloat(wallet.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '₹0.00';

  const txCount  = dashboard?.transactionCount ?? 0;
  const favCount = favourites.length;

  // ── handlers ──────────────────────────────────────────────────────────────────
  function startEditing() {
    setDisplayName(user?.displayName ?? '');
    setPhone(user?.phone ?? '');
    setAvatarPreview(null);
    setAvatarB64(null);
    setImageError(null);
    setUploadProgress(0);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setAvatarPreview(null);
    setAvatarB64(null);
    setImageError(null);
    setUploadProgress(0);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // ── size validation ────────────────────────────────────────────────────────
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`);
      e.target.value = '';
      return;
    }

    // ── type validation ────────────────────────────────────────────────────────
    if (!file.type.startsWith('image/')) {
      setImageError('Only image files are allowed.');
      e.target.value = '';
      return;
    }

    // ── simulate upload progress while converting ──────────────────────────────
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 80) { clearInterval(interval); return p; }
        return p + 20;
      });
    }, 100);

    try {
      const b64 = await fileToBase64(file);
      clearInterval(interval);
      setUploadProgress(100);
      setAvatarB64(b64);
      setAvatarPreview(b64);
    } catch {
      clearInterval(interval);
      setUploadProgress(0);
      setImageError('Could not read image. Please try again.');
    }
    e.target.value = '';
  }

  function handleSave() {
    mutation.mutate({
      displayName: displayName.trim() || null,
      phone:       phone.trim() || null,
      // Only send avatarUrl when the user picked a new image
      ...(avatarB64 !== null ? { avatarUrl: avatarB64 } : {}),
    });
  }

  // ── live avatar for display in edit mode ──────────────────────────────────────
  const currentAvatarUrl = avatarPreview ?? user?.avatarUrl ?? null;

  return (
    <PageContainer>
      <motion.div
        className="grid gap-5 xl:grid-cols-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* ── Main profile card ─────────────────────────────────────────────── */}
        <Card variant="elevated" className="xl:col-span-2">
          <AnimatePresence mode="wait" initial={false}>
            {!editing ? (
              /* ── View mode ─────────────────────────────────────────────────── */
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <AvatarDisplay avatarUrl={user?.avatarUrl ?? null} name={resolvedName} size="xl" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-text-primary">{resolvedName}</h2>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-text-secondary">{user?.email ?? '—'}</p>
                      {user?.phone && (
                        <p className="mt-0.5 text-sm text-text-secondary">{user.phone}</p>
                      )}
                      <p className="mt-0.5 text-xs text-text-muted font-mono">{payflowId}</p>
                    </div>
                  </div>

                  {/* PayFlow ID chip + Edit button */}
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="rounded-xl border border-border bg-surface-subtle px-4 py-3 sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">PayFlow ID</p>
                      <p className="mt-1 text-sm font-semibold text-text-primary font-mono">{payflowId}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={startEditing}>
                      Edit Profile
                    </Button>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Primary Wallet</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">{balanceDisplay}</p>
                    <p className="mt-0.5 text-xs text-text-muted">Available balance</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Account Status</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">Active</p>
                    <p className="mt-0.5 text-xs text-text-muted">Wallet verified</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── Edit mode ──────────────────────────────────────────────────── */
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <h3 className="text-base font-semibold text-text-primary">Edit Profile</h3>
                </div>

                {/* Avatar picker */}
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <AvatarDisplay avatarUrl={currentAvatarUrl} name={resolvedName} size="xl" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                      aria-label="Change profile picture"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M15.232 5.232l3.536 3.536M9 11l6-6 4 4-6 6H9v-4z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">Profile Picture</p>
                    <p className="mt-0.5 text-xs text-text-muted">JPG, PNG or GIF · max 2 MB</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Choose image…
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                {/* Upload progress bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Processing image…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}
                {uploadProgress === 100 && !imageError && (
                  <p className="text-xs text-success">Image ready — save to apply.</p>
                )}
                {imageError && (
                  <p className="text-xs text-danger">{imageError}</p>
                )}

                {/* Form fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Display Name"
                    placeholder="e.g. Alice Smith"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={64}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    type="tel"
                  />
                </div>

                {/* Read-only fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Email" value={user?.email ?? ''} disabled />
                  <Input label="PayFlow ID" value={payflowId} disabled />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={mutation.isPending}
                    disabled={!!imageError}
                  >
                    Save Changes
                  </Button>
                  <Button variant="ghost" onClick={cancelEditing} disabled={mutation.isPending}>
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Stat cards ────────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard title="Wallet Balance"      value={balanceDisplay}   description="Primary wallet" />
          <StatCard title="Transactions"        value={String(txCount)}  description="All-time activity" />
          <StatCard title="Favourite Contacts"  value={String(favCount)} description="Saved recipients" />
        </div>
      </motion.div>
    </PageContainer>
  );
}
