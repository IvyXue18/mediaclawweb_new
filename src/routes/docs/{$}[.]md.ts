import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';

async function GET({ params }: { params: { _splat?: string } }) {
  const slug = String(params._splat || '').replace(/^\/+|\/+$/g, '');
  if (!slug) return new Response('Not found', { status: 404 });

  const { getDocResource, renderDocMarkdown } =
    await import('@/content/docs/markdown');
  const doc = getDocResource(slug, baseLocale);
  if (!doc) return new Response('Not found', { status: 404 });

  const origin = envConfigs.app_url.replace(/\/+$/, '');
  return new Response(renderDocMarkdown(doc, origin), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Language': baseLocale,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      Link: `<${origin}/docs/${slug}>; rel="canonical"`,
    },
  });
}

export const Route = createFileRoute('/docs/{$}.md')({
  server: { handlers: { GET } },
});
