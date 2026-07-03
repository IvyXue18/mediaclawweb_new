import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/no-permission')({
  component: () => (
    <LegacyLinkPage
      title="No Permission"
      description="Your account does not have access to this admin area."
      href="/"
      label="Back home"
    />
  ),
});
