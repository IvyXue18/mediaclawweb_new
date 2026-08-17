import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale } from '@/paraglide/runtime.js';
import { getLocalPosts, mergePosts } from '@/content/posts';

const STATIC_PAGES: { path: string; title: string; description: string }[] = [
  { path: '', title: 'Home', description: 'Landing page' },
  { path: '/pricing', title: 'Pricing', description: 'Pricing plans' },
  { path: '/blog', title: 'Blog', description: 'Blog posts and articles' },
  {
    path: '/xiaohongshu',
    title: 'Xiaohongshu (RedNote) Tools',
    description:
      'Platform hub: every RedNote capability for research, scraping, extraction, and monitoring in one workflow',
  },
  {
    path: '/douyin',
    title: 'Douyin Tools',
    description:
      'Platform hub: every Douyin capability for research, scraping, transcripts, and monitoring in one workflow',
  },
  {
    path: '/xiaohongshu/account-analysis',
    title: 'Xiaohongshu Account Analyzer',
    description:
      'Research public RedNote creator profiles, content patterns, and engagement signals',
  },
  {
    path: '/xiaohongshu/viral-content-analysis',
    title: 'Xiaohongshu Viral Post Analysis',
    description:
      'Find low-follower RedNote hits and analyze titles, structure, visuals, public comments, and reusable topic methods',
  },
  {
    path: '/douyin/account-analysis',
    title: 'Douyin Account Analyzer',
    description:
      'Research public Douyin creator videos, transcripts, content patterns, and engagement signals',
  },
  {
    path: '/douyin/viral-content-analysis',
    title: 'Douyin Viral Video Analysis',
    description:
      'Find low-follower Douyin hits and analyze titles, covers, opening hooks, timed transcripts, and public comment signals',
  },
];

export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const { app_url, app_name, app_description } = envConfigs;

        let posts = getLocalPosts(baseLocale);
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
          posts = mergePosts(dbPosts, posts);
        } catch {
          // Database unreachable — local posts still listed.
        }

        const lines: string[] = [
          `# ${app_name}`,
          '',
          `> ${app_description}`,
          '',
          '## Pages',
          '',
          ...STATIC_PAGES.map(
            (p) => `- [${p.title}](${app_url}${p.path}): ${p.description}`
          ),
        ];

        if (posts.length > 0) {
          lines.push('', '## Blog Posts', '');
          for (const post of posts) {
            lines.push(
              `- [${post.title}](${app_url}/blog/${post.slug}): ${post.description}`
            );
          }
        }

        lines.push('');

        return new Response(lines.join('\n'), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
