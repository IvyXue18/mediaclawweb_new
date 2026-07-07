import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/roles/$id/edit-permissions')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.roles_permissions.title']()}
      description={m['admin.legacy.roles_permissions.description']()}
      href="/admin/roles"
      label={m['admin.legacy.roles.open']()}
    />
  ),
});
