import { createFileRoute, notFound } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { MarkdownContent } from '@/components/markdown-content';
import { mdxComponents } from '@/components/mdx-components';
import {
  formatPostDate,
  loadLocalPost,
  type BlogPost,
  type BlogPostDetail,
} from '@/content/posts';
import { getBlogPostFn, getBlogPostsFn } from '@/content/posts/server';

import {
  getBlogPostCategoryLabels,
  normalizeBlogCategorySlug,
} from './-blog-list';
import { BlogToc } from './-blog-toc';

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const locale = getLocale();
    const post = await getBlogPostFn({
      data: { slug: params.slug, locale },
    });
    if (!post) throw notFound();
    const posts = await getBlogPostsFn({ data: { locale } });
    return {
      locale,
      post,
      relatedPosts: getRelatedPosts(posts, post),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { locale, post } = loaderData;
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/blog/${post.slug}`, {
        locale: loc as (typeof locales)[number],
      }).href;
    return {
      meta: [
        { title: `${post.title} | ${envConfigs.app_name}` },
        { name: 'description', content: post.description },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor(baseLocale) },
      ],
    };
  },
  component: BlogPostPage,
});

function getLabelSlugs(post: BlogPost): Set<string> {
  return new Set(
    [...getBlogPostCategoryLabels(post), ...(post.tags ?? [])].map((label) =>
      normalizeBlogCategorySlug(label)
    )
  );
}

function getRelatedPosts(posts: BlogPost[], currentPost: BlogPostDetail) {
  const currentLabels = getLabelSlugs(currentPost);
  const scoredPosts = posts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      score: [...getLabelSlugs(post)].filter((label) =>
        currentLabels.has(label)
      ).length,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime()
    );

  const related = scoredPosts.filter((item) => item.score > 0);
  const fallback = scoredPosts.filter((item) => item.score === 0);

  return [...related, ...fallback].slice(0, 4).map((item) => item.post);
}

function BlogPostPage() {
  const { locale, post, relatedPosts } = Route.useLoaderData();
  const tags = post.tags?.length ? post.tags : post.categories;
  const formattedDate = formatPostDate(post.createdAt, locale);

  // Local posts render their bundled MDX component; database posts render
  // raw markdown through MarkdownContent.
  const LocalContent =
    post.source === 'local' ? loadLocalPost(post.slug, locale)?.default : null;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1" data-blog-detail>
        <section className="px-4 pt-24 pb-12 sm:px-6 md:px-8 md:pt-24 md:pb-16">
          <div className="mx-auto w-full max-w-7xl">
            <nav
              className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm"
              aria-label={m['blog.back_to_blog']()}
            >
              <Link
                href="/blog"
                className="hover:text-foreground inline-flex items-center gap-2 font-medium transition-colors"
              >
                <ArrowLeft className="size-4" />
                {m['blog.back_to_blog']()}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-foreground line-clamp-1">{post.title}</span>
            </nav>

            <div
              className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-14"
              data-blog-detail-layout
            >
              <div className="min-w-0">
                <header className="max-w-5xl" data-blog-detail-hero>
                  <h1
                    className="text-foreground text-4xl leading-[1.1] font-bold tracking-tight text-balance lg:text-5xl"
                    data-blog-detail-title
                  >
                    {post.title}
                  </h1>
                  {post.description && (
                    <p className="text-muted-foreground mt-5 max-w-4xl text-lg leading-8">
                      {post.description}
                    </p>
                  )}

                  <div
                    className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
                    data-blog-detail-meta
                  >
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="size-4" aria-hidden="true" />
                      {formattedDate}
                    </span>
                    {tags?.length ? (
                      <span className="inline-flex items-center gap-2">
                        <Tag className="size-4" aria-hidden="true" />
                        {m['blog.tag_count']({ count: tags.length })}
                      </span>
                    ) : null}
                    {(post.authorName || post.authorImage) && (
                      <span className="inline-flex items-center gap-2">
                        {post.authorImage && (
                          <img
                            src={post.authorImage}
                            alt={post.authorName || ''}
                            width={20}
                            height={20}
                            className="size-5 rounded-full object-cover"
                          />
                        )}
                        {post.authorName}
                      </span>
                    )}
                  </div>

                  {tags?.length ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-muted-foreground/70 text-xs"
                          data-blog-detail-tag
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </header>

                <article
                  className="border-border [&_img]:border-border [&_td]:border-border [&_th]:border-border [&_th]:bg-muted [&>blockquote:first-child]:border-primary/70 [&>blockquote:first-child]:text-foreground/80 [&>div>blockquote:first-child]:border-primary/70 [&>div>blockquote:first-child]:text-foreground/80 mt-10 w-full border-t pt-8 text-[16px] leading-7 [&_img]:my-6 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:object-cover [&_table]:my-6 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-lg [&_td]:border [&_td]:p-3 [&_th]:border [&_th]:p-3 [&>blockquote:first-child]:mt-0 [&>blockquote:first-child]:mb-6 [&>blockquote:first-child]:py-1 [&>blockquote:first-child]:text-base [&>blockquote:first-child]:leading-8 [&>blockquote:first-child]:not-italic [&>div>blockquote:first-child]:mt-0 [&>div>blockquote:first-child]:mb-6 [&>div>blockquote:first-child]:py-1 [&>div>blockquote:first-child]:text-base [&>div>blockquote:first-child]:leading-8 [&>div>blockquote:first-child]:not-italic"
                  data-blog-detail-article
                >
                  {LocalContent ? (
                    <MDXProvider components={mdxComponents}>
                      <LocalContent />
                    </MDXProvider>
                  ) : (
                    <MarkdownContent content={post.content || ''} />
                  )}
                </article>

                {relatedPosts.length ? (
                  <div
                    className="border-border mt-12 border-t pt-8 lg:hidden"
                    data-blog-related-mobile
                  >
                    <RelatedPostsList
                      title={m['blog.related_posts']()}
                      posts={relatedPosts}
                      locale={locale}
                    />
                  </div>
                ) : null}
              </div>

              <aside className="hidden lg:block" data-blog-related-desktop>
                <div className="sticky top-24 space-y-8">
                  <BlogToc title={m['blog.on_this_page']()} />
                  {relatedPosts.length ? (
                    <RelatedPostsList
                      title={m['blog.related_posts']()}
                      posts={relatedPosts}
                      locale={locale}
                      compact
                    />
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function RelatedPostsList({
  title,
  posts,
  locale,
  compact = false,
}: {
  title: string;
  posts: BlogPost[];
  locale: string;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? 'border-border border-t pt-6'
          : 'border-border bg-card rounded-xl border p-4'
      }
      data-blog-related-list
    >
      <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
      <div className={compact ? 'mt-2' : 'mt-4 space-y-3'}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className={[
              'hover:text-foreground group transition-colors',
              compact
                ? 'border-border/60 text-muted-foreground block border-b py-3 last:border-b-0'
                : 'border-border/70 hover:bg-muted/50 flex gap-3 rounded-lg border p-3',
            ].join(' ')}
            data-blog-related-card
          >
            {post.image && !compact ? (
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                className="size-16 shrink-0 rounded-md object-cover object-center"
                data-blog-related-image
              />
            ) : !compact ? (
              <div className="bg-muted size-16 shrink-0 rounded-md" />
            ) : null}
            <div className={compact ? '' : 'min-w-0 flex-1'}>
              <h3 className="line-clamp-2 text-sm font-semibold group-hover:underline">
                {post.title}
              </h3>
              {!compact && post.description ? (
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {post.description}
                </p>
              ) : null}
              <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
                <Calendar className="size-3.5" aria-hidden="true" />
                {formatPostDate(post.createdAt, locale)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
