import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { getLocalLogs } from '@/content/logs';
import {
  getLocalPostLocales,
  getLocalPosts,
  mergePosts,
} from '@/content/posts';

const STATIC_PATHS = [
  '',
  '/pricing',
  '/download',
  '/customers',
  '/blog',
  '/updates',
  '/welfare',
  '/referral',
  '/docs',
  '/privacy-policy',
  '/terms-of-service',
  '/features/feishu-integration',
  '/xiaohongshu',
  '/xiaohongshu/account-analysis',
  '/xiaohongshu/viral-content-analysis',
  '/xiaohongshu/scraper',
  '/xiaohongshu/comments',
  '/xiaohongshu/leads',
  '/xiaohongshu/keywords',
  '/xiaohongshu/monitoring',
  '/xiaohongshu/downloader',
  '/xiaohongshu/image-text',
  '/xiaohongshu/transcript',
  '/douyin',
  '/douyin/account-analysis',
  '/douyin/viral-content-analysis',
  '/douyin/scraper',
  '/douyin/comments',
  '/douyin/leads',
  '/douyin/keywords',
  '/douyin/monitoring',
  '/douyin/downloader',
  '/douyin/image-text',
  '/douyin/transcript',
];

// No changefreq/priority: Google ignores both. Accurate canonical, hreflang and
// lastmod plus real internal links are what matter.
type Entry = {
  path: string;
  availableLocales?: readonly (typeof locales)[number][];
  lastModified?: string;
};

function urlFor(path: string, locale: string): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale: locale as (typeof locales)[number],
  }).href;
}

function entryXml(e: Entry): string {
  const availableLocales = e.availableLocales?.length
    ? e.availableLocales
    : locales;
  const alternates = [
    ...availableLocales.map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${loc}" href="${urlFor(e.path, loc)}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(e.path, baseLocale)}"/>`,
  ].join('\n');

  return availableLocales
    .map((locale) =>
      [
        '  <url>',
        `    <loc>${urlFor(e.path, locale)}</loc>`,
        alternates,
        e.lastModified ? `    <lastmod>${e.lastModified}</lastmod>` : null,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [];
        const seenPaths = new Set<string>();

        const addEntry = (entry: Entry) => {
          if (seenPaths.has(entry.path)) return;
          seenPaths.add(entry.path);
          entries.push(entry);
        };

        for (const path of STATIC_PATHS) {
          addEntry({
            path,
            availableLocales: path === '/welfare' ? [baseLocale] : locales,
          });
        }

        for (const log of getLocalLogs(baseLocale)) {
          addEntry({
            path: `/updates/${log.slug}`,
            availableLocales: locales,
            lastModified: new Date(log.date).toISOString(),
          });
        }

        // Blog posts: db posts merged with local MDX posts.
        try {
          const { listPublishedArticles } =
            await import('@/modules/posts/service');
          const rows = await listPublishedArticles().catch(() => []);
          const dbPosts = rows.map((row) => ({
            slug: row.slug,
            title: row.title || row.slug,
            description: row.description || '',
            createdAt: new Date(row.createdAt).toISOString(),
            source: 'db' as const,
          }));
          const posts = mergePosts(dbPosts, getLocalPosts(baseLocale));
          for (const post of posts) {
            addEntry({
              path: `/blog/${post.slug}`,
              availableLocales:
                post.source === 'local'
                  ? getLocalPostLocales(post.slug)
                  : [baseLocale],
              lastModified: post.createdAt,
            });
          }
        } catch {
          // Database unreachable — static paths + local posts still listed.
          for (const post of getLocalPosts(baseLocale)) {
            addEntry({
              path: `/blog/${post.slug}`,
              availableLocales: getLocalPostLocales(post.slug),
              lastModified: post.createdAt,
            });
          }
        }

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          ...entries.map(entryXml),
          '</urlset>',
          '',
        ].join('\n');

        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml' },
        });
      },
    },
  },
});
