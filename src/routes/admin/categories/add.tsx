import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/categories/add')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.categories_add.title']()}
      description={m['admin.legacy.categories_add.description']()}
      href="/admin/categories"
      label={m['admin.legacy.categories.open']()}
    />
  ),
});
