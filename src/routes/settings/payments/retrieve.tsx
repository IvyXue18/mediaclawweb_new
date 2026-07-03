import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/settings/payments/retrieve')({
  component: () => (
    <LegacyLinkPage
      title="Payment Details"
      description="Payment retrieval routes are preserved and payment history is available in the migrated settings page."
      href="/settings/payments"
      label="Open payments"
    />
  ),
});
