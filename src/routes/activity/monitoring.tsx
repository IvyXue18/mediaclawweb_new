import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/activity/monitoring')({
  component: () => (
    <LegacyLinkPage
      title="Monitoring Activity"
      description="Monitoring activity URLs are preserved while the old activity table is migrated."
      href="/features/feishu-integration"
      label="Open collaboration page"
    />
  ),
});
