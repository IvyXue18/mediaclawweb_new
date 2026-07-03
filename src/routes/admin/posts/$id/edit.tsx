import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/admin/posts/$id/edit')({
  component: () => (
    <LegacyLinkPage
      title="Edit Post"
      description="Post editing is available from the migrated posts table."
      href="/admin/posts"
      label="Open posts"
    />
  ),
});
