import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/referral/withdrawals')({
  component: () => (
    <LegacyLinkPage
      title="Referral Withdrawals"
      description="Withdrawal review is available in the migrated referral operations table."
      href="/admin/referral"
      label="Open referral operations"
    />
  ),
});
