import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/referral/risks')({
  component: () => (
    <LegacyLinkPage
      title="Referral Risks"
      description="Referral risk records and review APIs are migrated; the full review table will be expanded here."
      href="/admin/referral"
      label="Open referral operations"
    />
  ),
});
