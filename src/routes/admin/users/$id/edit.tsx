import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/users/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.users_edit.title']()}
      description={m['admin.legacy.users_edit.description']()}
      href="/admin/users"
      label={m['admin.legacy.users.open']()}
    />
  ),
});
