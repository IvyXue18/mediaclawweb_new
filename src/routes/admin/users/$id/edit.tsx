import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/users/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title="Edit User"
      description="User management actions are available from the migrated users table."
      href="/admin/users"
      label="Open users"
    />
  ),
});
