import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { getBlogPostsFn } from '@/content/posts/server';

import {
  BlogArchivePage,
  blogCategorySlugForLabel,
  filterBlogPostsByCategory,
  findBlogCategoryLabel,
  getLegacyBlogPage,
  normalizeBlogCategorySlug,
} from '../-blog-list';

export const Route = createFileRoute('/blog/category/$slug')({
  loader: async ({ params }) => {
    const locale = getLocale();
    const page = getLegacyBlogPage(locale);
    const allPosts = await getBlogPostsFn({ data: { locale } });
    const activeCategoryLabel =
      findBlogCategoryLabel(allPosts, params.slug) ??
      normalizeBlogCategorySlug(params.slug);
    const posts = filterBlogPostsByCategory(allPosts, params.slug);

    return {
      locale,
      page,
      allPosts,
      posts,
      activeCategorySlug: normalizeBlogCategorySlug(params.slug),
      activeCategoryLabel,
    };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale;
    const page = loaderData?.page;
    const activeLabel = loaderData?.activeCategoryLabel;
    const activeSlug = activeLabel
      ? blogCategorySlugForLabel(activeLabel)
      : loaderData?.activeCategorySlug;
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/blog/category/${activeSlug ?? ''}`, {
        locale: loc as any,
      }).href;
    const meta: Array<{ title: string } | { name: string; content: string }> = [
      {
        title: activeLabel
          ? `${activeLabel} | ${page?.metadata?.title ?? envConfigs.app_name}`
          : (page?.metadata?.title ?? `Blog | ${envConfigs.app_name}`),
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
  component: BlogCategoryPage,
});

function BlogCategoryPage() {
  const { locale, page, posts, allPosts, activeCategorySlug } =
    Route.useLoaderData()!;

  return (
    <BlogArchivePage
      locale={locale}
      page={page}
      posts={posts}
      allPosts={allPosts}
      activeCategorySlug={activeCategorySlug}
    />
  );
}
