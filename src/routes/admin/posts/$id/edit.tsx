import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/posts/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.posts_edit.title']()}
      description={m['admin.legacy.posts_edit.description']()}
      href="/admin/posts"
      label={m['admin.legacy.posts.open']()}
    />
  ),
});
