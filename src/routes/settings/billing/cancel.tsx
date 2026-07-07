import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/settings/billing/cancel')({
  component: () => (
    <LegacyLinkPage
      title={m['settings.billing.one_time_title']()}
      description={m['settings.billing.cancel_unavailable_description']()}
      href="/settings/payments"
      label={m['settings.payments.open']()}
    />
  ),
});
