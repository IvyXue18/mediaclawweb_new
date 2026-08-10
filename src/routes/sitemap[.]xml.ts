import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { getLocalLogs } from '@/content/logs';
import { getLocalPosts, mergePosts } from '@/content/posts';

const STATIC_PATHS = [
  '',
  '/pricing',
  '/download',
  '/blog',
  '/updates',
  '/showcases',
  '/welfare',
  '/referral',
  '/docs',
  '/privacy-policy',
  '/terms-of-service',
  '/features/feishu-integration',
  '/ai-image-generator',
  '/ai-music-generator',
  '/ai-video-generator',
  '/xiaohongshu/account-analysis',
  '/xiaohongshu/scraper',
  '/xiaohongshu/comments',
  '/xiaohongshu/leads',
  '/xiaohongshu/keywords',
  '/xiaohongshu/monitoring',
  '/xiaohongshu/downloader',
  '/xiaohongshu/image-text',
  '/xiaohongshu/transcript',
  '/douyin/account-analysis',
  '/douyin/scraper',
  '/douyin/comments',
  '/douyin/leads',
  '/douyin/keywords',
  '/douyin/monitoring',
  '/douyin/downloader',
  '/douyin/image-text',
  '/douyin/transcript',
];

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: string;
  priority: number;
};

function urlFor(path: string, locale: string): string {
  return localizeUrl(`${envConfigs.app_url}${path || '/'}`, {
    locale: locale as (typeof locales)[number],
  }).href;
}

function entryXml(e: Entry): string {
  const alternates = locales
    .map(
      (loc) =>
        `    <xhtml:link rel="alternate" hreflang="${loc}" href="${urlFor(e.path, loc)}"/>`
    )
    .join('\n');
  return [
    '  <url>',
    `    <loc>${urlFor(e.path, baseLocale)}</loc>`,
    alternates,
    e.lastModified ? `    <lastmod>${e.lastModified}</lastmod>` : null,
    `    <changefreq>${e.changeFrequency}</changefreq>`,
    `    <priority>${e.priority}</priority>`,
    '  </url>',
  ]
    .filter(Boolean)
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
            changeFrequency:
              path === '/blog' || path === '/updates' ? 'daily' : 'weekly',
            priority: path === '' ? 1 : 0.8,
          });
        }

        for (const log of getLocalLogs(baseLocale)) {
          addEntry({
            path: `/updates/${log.slug}`,
            lastModified: new Date(log.date).toISOString(),
            changeFrequency: 'monthly',
            priority: 0.6,
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
              lastModified: post.createdAt,
              changeFrequency: 'monthly',
              priority: 0.6,
            });
          }
        } catch {
          // Database unreachable — static paths + local posts still listed.
          for (const post of getLocalPosts(baseLocale)) {
            addEntry({
              path: `/blog/${post.slug}`,
              lastModified: post.createdAt,
              changeFrequency: 'monthly',
              priority: 0.6,
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
