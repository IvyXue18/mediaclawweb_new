import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/analytics')({
  component: () => (
    <LegacyLinkPage
      title="Analytics"
      description="Analytics settings and provider configuration are available in the migrated admin settings area."
      href="/admin/settings"
      label="Open admin settings"
    />
  ),
});
