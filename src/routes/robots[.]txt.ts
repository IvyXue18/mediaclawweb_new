import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';

const PRIVATE_RULES = [
  'Disallow: /admin',
  'Disallow: /settings',
  'Disallow: /api/',
  'Disallow: /*?*',
];

function crawlerGroup(userAgent: string): string[] {
  return [`User-Agent: ${userAgent}`, 'Allow: /', ...PRIVATE_RULES, ''];
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const body = [
          // Explicitly permit ChatGPT search discovery. Other search and AI
          // crawlers inherit the public-site policy from the wildcard group.
          ...crawlerGroup('OAI-SearchBot'),
          ...crawlerGroup('*'),
          `Sitemap: ${envConfigs.app_url}/sitemap.xml`,
          '',
        ].join('\n');
        return new Response(body, {
          headers: { 'Content-Type': 'text/plain' },
        });
      },
    },
  },
});
