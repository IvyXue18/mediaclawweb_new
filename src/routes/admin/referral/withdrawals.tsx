import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/referral/withdrawals')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.referral.withdrawals_page.title']()}
      description={m['admin.referral.withdrawals_page.description']()}
      href="/admin/referral"
      label={m['admin.referral.withdrawals_page.open']()}
    />
  ),
});
