import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/apikeys')({
  component: () => (
    <LegacyLinkPage
      title="API Keys"
      description="API key management is available in the migrated settings workspace."
      href="/settings/apikeys"
      label="Open API keys"
    />
  ),
});
