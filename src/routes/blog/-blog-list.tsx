import { Calendar } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import enBlogPage from '@/content/legacy-pages/en/blog.json';
import zhBlogPage from '@/content/legacy-pages/zh/blog.json';
import {
  formatPostDate,
  normalizePostLabels,
  type BlogPost,
} from '@/content/posts';

export type LegacyBlogPage = typeof zhBlogPage;

type BlogCategory = {
  label: string;
  slug: string;
  href: string;
  count: number;
  active: boolean;
};

const MAX_CATEGORY_LINKS = 12;

export function getLegacyBlogPage(locale: string): LegacyBlogPage {
  return locale === 'zh' ? zhBlogPage : enBlogPage;
}

export function normalizeBlogCategorySlug(value: string): string {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Route params may already be decoded.
  }

  return decoded
    .normalize('NFKC')
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[\s_/]+/g, '-');
}

export function blogCategorySlugForLabel(label: string): string {
  return encodeURIComponent(normalizeBlogCategorySlug(label));
}

export function getBlogPostCategoryLabels(post: BlogPost): string[] {
  const categories = normalizePostLabels(post.categories);
  const tags = normalizePostLabels(post.tags);
  const labels = categories?.length ? categories : tags;
  const seen = new Set<string>();

  return (labels ?? [])
    .map((label) => String(label).trim())
    .filter((label) => {
      if (!label) return false;
      const slug = normalizeBlogCategorySlug(label);
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
}

export function filterBlogPostsByCategory(
  posts: BlogPost[],
  categorySlug: string
): BlogPost[] {
  const normalized = normalizeBlogCategorySlug(categorySlug);
  return posts.filter((post) =>
    getBlogPostCategoryLabels(post).some(
      (label) => normalizeBlogCategorySlug(label) === normalized
    )
  );
}

export function findBlogCategoryLabel(
  posts: BlogPost[],
  categorySlug: string
): string | undefined {
  const normalized = normalizeBlogCategorySlug(categorySlug);
  for (const post of posts) {
    const match = getBlogPostCategoryLabels(post).find(
      (label) => normalizeBlogCategorySlug(label) === normalized
    );
    if (match) return match;
  }
  return undefined;
}

function getBlogCategories(
  posts: BlogPost[],
  allLabel: string,
  activeCategorySlug?: string
): BlogCategory[] {
  const counts = new Map<string, { label: string; count: number }>();

  for (const post of posts) {
    for (const label of getBlogPostCategoryLabels(post)) {
      const slug = normalizeBlogCategorySlug(label);
      const current = counts.get(slug);
      counts.set(slug, {
        label: current?.label ?? label,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const active = activeCategorySlug
    ? normalizeBlogCategorySlug(activeCategorySlug)
    : '';
  const categoryLinks = Array.from(counts.entries())
    .sort(([, a], [, b]) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, MAX_CATEGORY_LINKS)
    .map(([slug, category]) => ({
      label: category.label,
      slug,
      href: `/blog/category/${encodeURIComponent(slug)}`,
      count: category.count,
      active: slug === active,
    }));

  return [
    {
      label: allLabel,
      slug: '',
      href: '/blog',
      count: posts.length,
      active: !active,
    },
    ...categoryLinks,
  ];
}

export function BlogArchivePage({
  locale,
  page,
  posts,
  allPosts = posts,
  activeCategorySlug,
}: {
  locale: string;
  page: LegacyBlogPage;
  posts: BlogPost[];
  allPosts?: BlogPost[];
  activeCategorySlug?: string;
}) {
  const section = page.page.sections.blog;
  const pageTitle = page.page.title || section.title;
  const title = section.title || pageTitle;
  const description = section.description || page.metadata.description;
  const categories = getBlogCategories(
    allPosts,
    page.messages.all,
    activeCategorySlug
  );

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section id={section.id} className="py-24 md:py-36" data-blog-section>
          <div className="mx-auto mb-8 px-4 text-center">
            <h1 className="sr-only">{pageTitle}</h1>
            <h2 className="mb-6 text-3xl font-bold text-pretty lg:text-4xl">
              {title}
            </h2>
            <p className="text-muted-foreground mx-auto mb-4 max-w-xl lg:max-w-none lg:text-lg">
              {description}
            </p>
          </div>

          {categories.length > 1 ? (
            <nav
              aria-label={page.messages.crumb}
              className="mx-auto mb-8 flex max-w-5xl gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible"
              data-blog-category-nav
            >
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  aria-current={category.active ? 'page' : undefined}
                  className={[
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    category.active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  ].join(' ')}
                  data-active={category.active ? 'true' : 'false'}
                  data-blog-category-link
                >
                  <span>{category.label}</span>
                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-[11px]',
                      category.active
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {category.count}
                  </span>
                </Link>
              ))}
            </nav>
          ) : null}

          {posts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-base">
              {page.messages.no_content}
            </p>
          ) : (
            <div className="container mx-auto flex flex-col items-center gap-8 px-4 lg:px-16">
              <div
                className="flex w-full flex-wrap items-stretch"
                data-blog-grid
              >
                {posts.map((post) => (
                  <LegacyBlogCard key={post.slug} post={post} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function LegacyBlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const tags = post.tags?.length ? post.tags : post.categories;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex w-full p-4 md:w-1/3"
      data-blog-card
    >
      <article className="border-border bg-card flex h-full w-full flex-col overflow-hidden rounded-xl border">
        {post.image ? (
          <div className="bg-muted/20 aspect-video shrink-0 overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover object-center"
              data-blog-card-image
            />
          </div>
        ) : null}
        <div className="flex h-full flex-col px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
          <h3
            className="mb-3 [display:-webkit-box] min-h-[4.5rem] overflow-hidden text-lg leading-7 font-semibold text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:3] md:mb-4 md:text-xl lg:mb-6"
            data-blog-card-title
          >
            {post.title}
          </h3>
          {post.description ? (
            <p
              className="text-muted-foreground mb-3 [display:-webkit-box] min-h-[5.25rem] overflow-hidden leading-7 text-ellipsis [-webkit-box-orient:vertical] [-webkit-line-clamp:3] md:mb-4 lg:mb-6"
              data-blog-card-description
            >
              {post.description}
            </p>
          ) : null}
          {tags?.length ? (
            <div className="mb-3 flex min-h-7 flex-wrap gap-2 md:mb-4 lg:mb-6">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground rounded-md px-2 py-1 text-xs"
                  data-blog-card-tag
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="text-muted-foreground mt-auto flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" aria-hidden="true" />
              {formatPostDate(post.createdAt, locale)}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
