import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/account/credentials')({
  component: () => (
    <LegacyLinkPage
      title="Activation Codes"
      description="The old account activation-code page now lives in the migrated settings workspace."
      href="/settings/credentials"
      label="Open activation codes"
    />
  ),
});
