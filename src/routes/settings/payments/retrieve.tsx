import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/settings/payments/retrieve')({
  component: () => (
    <LegacyLinkPage
      title={m['settings.payments.retrieve_title']()}
      description={m['settings.payments.retrieve_description']()}
      href="/settings/payments"
      label={m['settings.payments.open']()}
    />
  ),
});
