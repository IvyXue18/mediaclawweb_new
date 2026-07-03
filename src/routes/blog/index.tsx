import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { getBlogPostsFn } from '@/content/posts/server';

import { BlogArchivePage, getLegacyBlogPage } from './-blog-list';

export const Route = createFileRoute('/blog/')({
  loader: async () => {
    const locale = getLocale();
    const posts = await getBlogPostsFn({ data: { locale } });
    return { locale, posts, page: getLegacyBlogPage(locale) };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale;
    const page = loaderData?.page;
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/blog`, { locale: loc as any }).href;
    const meta: Array<{ title: string } | { name: string; content: string }> = [
      {
        title: page?.metadata?.title ?? `Blog | ${envConfigs.app_name}`,
      },
    ];
    if (page?.metadata?.description) {
      meta.push({ name: 'description', content: page.metadata.description });
    }
    if (page?.metadata?.keywords) {
      meta.push({ name: 'keywords', content: page.metadata.keywords });
    }

    return {
      meta,
      links: [
        { rel: 'canonical', href: urlFor(locale ?? baseLocale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
      ],
    };
  },
  component: BlogPage,
});

function BlogPage() {
  const { locale, posts, page } = Route.useLoaderData();
  return <BlogArchivePage locale={locale} page={page} posts={posts} />;
}
