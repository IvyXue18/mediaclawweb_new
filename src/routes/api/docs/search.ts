import { createFileRoute } from '@tanstack/react-router';

import { getAllDocSlugs } from '@/content/docs/registry';

type SearchDoc = {
  id: string;
  title: string;
  content: string;
  url: string;
};

const legacyPages = import.meta.glob('/src/content/legacy-pages/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;

const mdxFiles = import.meta.glob('/src/content/**/*.{md,mdx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, unknown>;

const registeredDocSlugs = new Set(getAllDocSlugs());

function isSearchableMdxPath(path: string) {
  const prefix = '/src/content/docs/';
  if (!path.startsWith(prefix)) return true;
  const slug = path
    .slice(prefix.length)
    .replace(/\.(zh|en)\.mdx?$/, '')
    .replace(/\.mdx?$/, '');
  return registeredDocSlugs.has(slug);
}

function titleFromLegacy(data: any) {
  return (
    data?.seo?.title ||
    data?.hero?.title ||
    data?.blocks?.find?.((block: any) => block?.title)?.title ||
    'MediaClaw'
  );
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function urlFromPath(path: string) {
  return path
    .replace('/src/content/legacy-pages/zh/index.json', '/')
    .replace('/src/content/legacy-pages/en/index.json', '/')
    .replace(/^\/src\/content\/legacy-pages\/(?:zh|en)\//, '/')
    .replace(/^\/src\/content\//, '/')
    .replace(/\.(zh|en)\.mdx?$/, '')
    .replace(/\.mdx?$/, '')
    .replace(/\.json$/, '')
    .replace(/\/index$/, '/');
}

function docs(): SearchDoc[] {
  const legacy = Object.entries(legacyPages).map(([path, data]) => ({
    id: path,
    title: titleFromLegacy(data),
    content: JSON.stringify(data),
    url: urlFromPath(path),
  }));

  const mdx = Object.entries(mdxFiles)
    .filter(([path]) => isSearchableMdxPath(path))
    .map(([path, raw]) => {
      const content =
        typeof raw === 'string'
          ? raw
          : typeof (raw as any)?.default === 'string'
            ? (raw as any).default
            : String(raw || '');
      const title =
        content.match(/^#\s+(.+)$/m)?.[1]?.trim() ||
        path
          .split('/')
          .pop()
          ?.replace(/\.(zh|en)\.mdx?$/, '')
          .replace(/-/g, ' ') ||
        'Document';
      return {
        id: path,
        title,
        content: stripMarkdown(content),
        url: urlFromPath(path),
      };
    });

  return [...legacy, ...mdx];
}

async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') || searchParams.get('q') || '')
    .trim()
    .toLowerCase();

  if (!query) {
    return Response.json([]);
  }

  const results = docs()
    .map((doc) => {
      const haystack = `${doc.title}\n${doc.content}`.toLowerCase();
      const index = haystack.indexOf(query);
      if (index < 0) return null;
      const start = Math.max(0, index - 80);
      const snippet = doc.content
        .slice(start, start + 220)
        .replace(/\s+/g, ' ');
      return {
        id: doc.id,
        title: doc.title,
        content: snippet,
        url: doc.url,
      };
    })
    .filter(Boolean)
    .slice(0, 20);

  return Response.json(results);
}

export const Route = createFileRoute('/api/docs/search')({
  server: { handlers: { GET } },
});
