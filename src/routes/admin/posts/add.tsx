import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

import { m } from '@/paraglide/messages.js';

export const Route = createFileRoute('/admin/posts/add')({
  component: () => (
    <LegacyLinkPage
      title={m['admin.legacy.posts_add.title']()}
      description={m['admin.legacy.posts_add.description']()}
      href="/admin/posts"
      label={m['admin.legacy.posts.open']()}
    />
  ),
});
