import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/roles/$id/edit-permissions')({
  component: () => (
    <LegacyLinkPage
      title="Edit Role Permissions"
      description="Role permission assignment is available from the migrated roles table."
      href="/admin/roles"
      label="Open roles"
    />
  ),
});
