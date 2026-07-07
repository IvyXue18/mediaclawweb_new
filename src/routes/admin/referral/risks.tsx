import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/referral/risks')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.referral.risks_page.title']()}
      description={m['admin.referral.risks_page.description']()}
      href="/admin/referral"
      label={m['admin.referral.risks_page.open']()}
    />
  ),
});
