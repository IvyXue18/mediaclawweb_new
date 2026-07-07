import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/settings/invoices/retrieve')({
  component: () => (
    <LegacyLinkPage
      title={m['settings.invoices.retrieve_title']()}
      description={m['settings.invoices.retrieve_description']()}
      href="/settings/payments"
      label={m['settings.payments.open']()}
    />
  ),
});
