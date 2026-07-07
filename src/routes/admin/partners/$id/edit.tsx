import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/partners/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.partners_edit.title']()}
      description={m['admin.legacy.partners_edit.description']()}
      href="/admin/partners"
      label={m['admin.legacy.partners.open']()}
    />
  ),
});
