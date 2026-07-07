import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/users/$id/edit-roles')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.users_roles.title']()}
      description={m['admin.legacy.users_roles.description']()}
      href="/admin/users"
      label={m['admin.legacy.users.open']()}
    />
  ),
});
