import { PageContainer } from '@/layouts/PageContainer';
import Card from '@/components/ui/Card';

const sections = [
  {
    title: 'Appearance',
    description: 'Customize the look and feel of PayFlow.',
    content: (
      <p className="text-sm text-text-muted">
        Use the theme toggle in the top navigation bar to switch between light and dark mode.
        Your preference is saved automatically.
      </p>
    ),
  },
  {
    title: 'Notifications',
    description: 'Control how and when PayFlow notifies you.',
    content: (
      <p className="text-sm text-text-muted">
        Notification preferences are coming soon.
      </p>
    ),
  },
  {
    title: 'Security',
    description: 'Manage your account security settings.',
    content: (
      <p className="text-sm text-text-muted">
        Two-factor authentication and session management are coming soon.
      </p>
    ),
  },
];

export function SettingsPage() {
  return (
    <PageContainer title="Settings" subtitle="Manage your account preferences.">
      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title} variant="elevated" className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-text-primary">{section.title}</h3>
              <p className="mt-0.5 text-sm text-text-muted">{section.description}</p>
            </div>
            <div className="border-t border-border pt-3">
              {section.content}
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
