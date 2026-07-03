import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/settings/apikeys/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title="Edit API Key"
      description="API keys can currently be created or deleted; rename/edit parity is still pending from the old page."
      href="/settings/apikeys"
      label="Back to API keys"
    />
  ),
});
