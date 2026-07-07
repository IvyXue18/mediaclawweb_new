import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/roles/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.roles_edit.title']()}
      description={m['admin.legacy.roles_edit.description']()}
      href="/admin/roles"
      label={m['admin.legacy.roles.open']()}
    />
  ),
});
