import type { ComponentType } from 'react';

import { baseLocale, locales } from '@/paraglide/runtime.js';
import {
  frontmatterList,
  frontmatterString,
  parseFrontmatter,
} from '@/content/frontmatter';

/**
 * Local blog posts written as MDX files in this directory.
 * File naming: `<slug>.<locale>.mdx` (falls back to the base locale).
 * Register every local post slug here — it drives loading and the sitemap.
 *
 * This module is isomorphic (safe in client bundles). Database posts are
 * fetched through the server functions in ./server.ts and merged with the
 * local posts via the pure helpers below.
 */
export const BLOG_POST_SLUGS = [
  'douyin-comment-export',
  'douyin-data-collection',
  'xiaohongshu-ai-benchmark-to-draft',
  'how-to-copy-viral-short-videos',
  'local-business-xiaohongshu-marketing',
  'low-follower-viral-content',
  'short-video-transcript-extraction',
  'video-transcript-timestamps',
  'xiaohongshu-brand-sentiment-monitoring',
  'xiaohongshu-comment-analysis',
  'xiaohongshu-comment-batch-export-campaign-review',
  'xiaohongshu-comment-topic-mining',
  'xiaohongshu-competitor-monitoring',
  'xiaohongshu-download-own-posts',
  'xiaohongshu-download-remove-watermark',
  'xiaohongshu-find-benchmark-accounts',
  'xiaohongshu-image-text-extraction',
  'xiaohongshu-keyword-placement',
  'xiaohongshu-keyword-research',
  'xiaohongshu-professional-content-search-traffic',
  'xiaohongshu-research-data-collection',
  'xiaohongshu-search-vs-recommendation-traffic',
  'xiaohongshu-topic-analysis',
  'xiaohongshu-topic-library-build',
] as const;

export type BlogPostMeta = {
  title: string;
  description: string;
  created_at: string;
  author_name?: string;
  author_image?: string;
  image?: string;
  categories?: string[] | string | null;
  tags?: string[] | string | null;
};

type PostModule = {
  default: ComponentType;
  meta?: BlogPostMeta;
};
type LoadedPostModule = Omit<PostModule, 'meta'> & { meta: BlogPostMeta };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  image?: string;
  /** ISO date string — serializable across loader/server-fn boundaries */
  createdAt: string;
  authorName?: string;
  authorImage?: string;
  categories?: string[];
  tags?: string[];
  source: 'local' | 'db';
};

export type BlogPostDetail = BlogPost & {
  /** Raw markdown — set for database posts */
  content?: string;
};

// Eagerly bundle the local MDX posts (small markdown files), mirroring the
// static-pages pattern. Keys are absolute from the project root.
const postModules = import.meta.glob<PostModule>('/src/content/posts/*.mdx', {
  eager: true,
});
const postRawModules = import.meta.glob<string>('/src/content/posts/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function resolvePostMeta(path: string, meta?: BlogPostMeta): BlogPostMeta {
  const frontmatter = parseFrontmatter(
    postRawModules[path] ?? postRawModules[`${path}?raw`]
  );
  const tags = frontmatterList(frontmatter, 'tags');
  const categories = frontmatterList(frontmatter, 'categories');

  return {
    title:
      meta?.title ??
      frontmatterString(frontmatter, 'title') ??
      path
        .split('/')
        .pop()
        ?.replace(/\.[^.]+\.mdx$/, '') ??
      'Untitled',
    description:
      meta?.description ?? frontmatterString(frontmatter, 'description') ?? '',
    created_at:
      meta?.created_at ??
      frontmatterString(frontmatter, 'created_at') ??
      frontmatterString(frontmatter, 'date') ??
      '1970-01-01',
    author_name:
      meta?.author_name ?? frontmatterString(frontmatter, 'author_name'),
    author_image:
      meta?.author_image ?? frontmatterString(frontmatter, 'author_image'),
    image: meta?.image ?? frontmatterString(frontmatter, 'image'),
    categories: meta?.categories ?? categories,
    tags: meta?.tags ?? tags,
  };
}

export function normalizePostLabels(value: unknown): string[] | undefined {
  const normalize = (items: unknown[]) =>
    items.map((label) => String(label).trim()).filter(Boolean);

  if (Array.isArray(value)) {
    const labels = normalize(value);
    return labels.length ? labels : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const raw = value.trim();
  if (!raw) {
    return undefined;
  }

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const labels = normalize(parsed);
        return labels.length ? labels : undefined;
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  const labels = raw
    .split(/[,，|]/)
    .map((label) => label.trim())
    .filter(Boolean);
  return labels.length ? labels : undefined;
}

export function loadLocalPost(
  slug: string,
  locale: string
): LoadedPostModule | null {
  if (!BLOG_POST_SLUGS.includes(slug as (typeof BLOG_POST_SLUGS)[number])) {
    return null;
  }

  const postPath =
    `/src/content/posts/${slug}.${locale}.mdx` in postModules
      ? `/src/content/posts/${slug}.${locale}.mdx`
      : `/src/content/posts/${slug}.${baseLocale}.mdx`;
  const mod = postModules[postPath];
  if (!mod) return null;

  return {
    ...mod,
    meta: resolvePostMeta(postPath, mod.meta),
  };
}

export function getLocalPostLocales(slug: string): (typeof locales)[number][] {
  if (!BLOG_POST_SLUGS.includes(slug as (typeof BLOG_POST_SLUGS)[number])) {
    return [];
  }

  return locales.filter(
    (locale) => `/src/content/posts/${slug}.${locale}.mdx` in postModules
  );
}

function localPostToItem(slug: string, meta: BlogPostMeta): BlogPost {
  const tags = normalizePostLabels(meta.tags);
  const categories = normalizePostLabels(meta.categories) ?? tags;

  return {
    slug,
    title: meta.title,
    description: meta.description,
    image: meta.image,
    createdAt: new Date(meta.created_at).toISOString(),
    authorName: meta.author_name,
    authorImage: meta.author_image,
    categories,
    tags: tags ?? categories,
    source: 'local',
  };
}

export function getLocalPosts(locale: string): BlogPost[] {
  return BLOG_POST_SLUGS.map((slug) => ({
    slug: slug as string,
    mod: loadLocalPost(slug, locale),
  }))
    .filter((m): m is { slug: string; mod: LoadedPostModule } => m.mod !== null)
    .map(({ slug, mod }) => localPostToItem(slug, mod.meta));
}

/**
 * Merge database posts with local MDX posts, deduped by slug
 * (local MDX wins), newest first.
 */
export function mergePosts(
  dbPosts: BlogPost[],
  localPosts: BlogPost[],
  options: { limit?: number } = {}
): BlogPost[] {
  const localSlugs = new Set(localPosts.map((p) => p.slug));
  const merged = [
    ...localPosts,
    ...dbPosts.filter((p) => !localSlugs.has(p.slug)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return options.limit ? merged.slice(0, options.limit) : merged;
}

export function formatPostDate(dateIso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(dateIso));
}
