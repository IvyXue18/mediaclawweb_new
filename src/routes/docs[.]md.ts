import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';

async function GET() {
  const { getAllDocResources, renderDocsIndexMarkdown } =
    await import('@/content/docs/markdown');
  const markdown = renderDocsIndexMarkdown(
    getAllDocResources(baseLocale),
    envConfigs.app_url
  );
  const canonicalUrl = `${envConfigs.app_url.replace(/\/+$/, '')}/docs`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Language': baseLocale,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      Link: `<${canonicalUrl}>; rel="canonical"`,
    },
  });
}

export const Route = createFileRoute('/docs.md')({
  server: { handlers: { GET } },
});
