import { createFileRoute } from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/docs/$slug/$')({
  component: () => (
    <LegacyLinkPage
      title="Docs"
      description="Nested documentation URLs are preserved while the Fumadocs tree is migrated to TanStack."
      href="/docs"
      label="Open docs"
    />
  ),
});
