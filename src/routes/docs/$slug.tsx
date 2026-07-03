import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { LegacyLinkPage } from '@/routes/-legacy-action-pages';

export const Route = createFileRoute('/docs/$slug')({
  component: DocsSlugPage,
});

function DocsSlugPage() {
  const { slug } = Route.useParams();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');

  if (
    normalizedPathname !== `/docs/${slug}` &&
    normalizedPathname !== `/docs/${slug}/`
  ) {
    return <Outlet />;
  }

  return (
    <LegacyLinkPage
      title="Docs"
      description="Documentation detail URLs are preserved while the Fumadocs tree is migrated to TanStack."
      href="/docs"
      label="Open docs"
    />
  );
}
