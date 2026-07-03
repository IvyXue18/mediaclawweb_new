import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/partners/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title="Edit Partner"
      description="Partner editing is available from the migrated partner operations table."
      href="/admin/partners"
      label="Open partners"
    />
  ),
});
