import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/categories/add')({
  component: () => (
    <LegacyLinkPage
      title="Add Category"
      description="Category creation is handled from the migrated categories table."
      href="/admin/categories"
      label="Open categories"
    />
  ),
});
