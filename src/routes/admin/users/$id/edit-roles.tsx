import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/users/$id/edit-roles')({
  component: () => (
    <LegacyLinkPage
      title="Edit User Roles"
      description="Role assignment is available from the migrated users table."
      href="/admin/users"
      label="Open users"
    />
  ),
});
