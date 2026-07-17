import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { PageContainer } from '@/layouts/PageContainer';

export function ProfilePage() {
  return (
    <PageContainer title="Profile" subtitle="Manage your PayFlow account.">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="elevated" className="xl:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name="Liam Grant" size="xl" className="bg-brand-100 text-brand-700" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-text-primary">Liam Grant</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">lg@example.com</p>
                <p className="mt-1 text-sm text-text-muted">+91 98765 43210</p>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-muted px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">Wallet ID</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">PF-2048-1187</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text-secondary">Primary Wallet</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">₹48,750.50</p>
              <p className="mt-1 text-sm text-text-muted">Available balance</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-text-secondary">Preferred Contact Method</p>
              <p className="mt-2 text-2xl font-semibold text-text-primary">Phone</p>
              <p className="mt-1 text-sm text-text-muted">Used for transfer confirmations</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard title="Wallet Balance" value="₹48,750.50" description="Primary wallet" />
          <StatCard title="Transactions" value="128" description="All-time activity" />
          <StatCard title="Favourite Contacts" value="5" description="Saved recipients" />
        </div>
      </div>
    </PageContainer>
  );
}