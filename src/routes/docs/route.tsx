import { createFileRoute, Outlet } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';

import { usePathname } from '@/core/i18n/navigation';
import { DocsHeader } from '@/components/docs/doc-header';
import { DocMobileNav } from '@/components/docs/doc-mobile-nav';
import { DocSidebar } from '@/components/docs/doc-sidebar';
import { DocToc } from '@/components/docs/doc-toc';
import { mdxComponents } from '@/components/mdx-components';

export const Route = createFileRoute('/docs')({
  component: DocsLayout,
});

// Its own app-shell — no marketing Header/Footer. The header is a plain
// sticky bar (not the marketing site's floating pill) so it reserves its
// own layout space and nothing downstream needs compensating top padding.
// The sidebar hugs the viewport edge instead of sitting inside a centered,
// gutter-heavy container, so the reading column gets real room.
function DocsLayout() {
  const pathname = usePathname();
  const activeSlug = pathname.replace(/^\/docs\/?/, '');

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <DocsHeader />
      <div className="flex flex-1 items-stretch">
        <DocSidebar activeSlug={activeSlug} className="hidden lg:block" />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
          <div className="mb-6 lg:hidden">
            <DocMobileNav activeSlug={activeSlug} />
          </div>
          <div className="mx-auto flex w-full max-w-6xl items-stretch gap-10">
            <div className="min-w-0 flex-1">
              <MDXProvider components={mdxComponents}>
                <Outlet />
              </MDXProvider>
            </div>
            <DocToc className="hidden xl:block" />
          </div>
        </main>
      </div>
    </div>
  );
}
