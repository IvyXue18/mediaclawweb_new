import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/settings/invoices/retrieve')({
  component: () => (
    <LegacyLinkPage
      title="Invoices"
      description="Invoice retrieval routes are preserved while the exact old billing portal handoff is migrated."
      href="/settings/payments"
      label="Open payments"
    />
  ),
});
