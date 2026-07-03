import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/posts/add')({
  component: () => (
    <LegacyLinkPage
      title="Add Post"
      description="Post creation is available from the migrated posts table."
      href="/admin/posts"
      label="Open posts"
    />
  ),
});
