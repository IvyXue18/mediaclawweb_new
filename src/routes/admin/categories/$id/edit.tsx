import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/categories/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title="Edit Category"
      description="Category editing is handled from the migrated categories table."
      href="/admin/categories"
      label="Open categories"
    />
  ),
});
