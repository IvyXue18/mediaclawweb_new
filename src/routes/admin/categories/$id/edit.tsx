import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/categories/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.categories_edit.title']()}
      description={m['admin.legacy.categories_edit.description']()}
      href="/admin/categories"
      label={m['admin.legacy.categories.open']()}
    />
  ),
});
