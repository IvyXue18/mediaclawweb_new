import { createServerFn } from '@tanstack/react-start';

import {
  getLocalPosts,
  loadLocalPost,
  mergePosts,
  normalizePostLabels,
  type BlogPost,
  type BlogPostDetail,
} from './index';

// Database access stays behind server functions (dynamic import keeps
// drizzle out of the client bundle), mirroring the analytics pattern.

function parseTagList(value?: string | null): string[] | undefined {
  return normalizePostLabels(value)?.slice(0, 6);
}

async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const { listPublishedArticles } = await import('@/modules/posts/service');
    const rows = await listPublishedArticles();
    return rows.map((row) => {
      const tags = parseTagList(row.tags);
      const categories = parseTagList(row.categories) ?? tags;
      return {
        slug: row.slug,
        title: row.title || row.slug,
        description: row.description || '',
        image: row.image || undefined,
        createdAt: new Date(row.createdAt).toISOString(),
        authorName: row.authorName || undefined,
        authorImage: row.authorImage || undefined,
        categories,
        tags: tags ?? categories,
        source: 'db' as const,
      };
    });
  } catch {
    // Database not configured/reachable — local posts still render.
    return [];
  }
}

/**
 * All blog posts: database posts merged with local MDX posts,
 * deduped by slug (database wins), newest first.
 */
export const getBlogPostsFn = createServerFn()
  .inputValidator((data: { locale: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    const dbPosts = await getDbPosts();
    return mergePosts(dbPosts, getLocalPosts(data.locale), {
      limit: data.limit,
    });
  });

/**
 * Single blog post by slug: local MDX first, database as fallback.
 * Local posts return meta only — the route component resolves the MDX
 * Content from the bundled glob map (components don't serialize).
 */
export const getBlogPostFn = createServerFn()
  .inputValidator((data: { slug: string; locale: string }) => data)
  .handler(async ({ data }): Promise<BlogPostDetail | null> => {
    const mod = loadLocalPost(data.slug, data.locale);
    if (mod) {
      const meta = mod.meta;
      const tags = normalizePostLabels(meta.tags);
      const categories = normalizePostLabels(meta.categories) ?? tags;

      return {
        slug: data.slug,
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

    try {
      const { findPublishedBySlug } = await import('@/modules/posts/service');
      const row = await findPublishedBySlug(data.slug);
      if (row) {
        const tags = parseTagList(row.tags);
        const categories = parseTagList(row.categories) ?? tags;
        return {
          slug: row.slug,
          title: row.title || row.slug,
          description: row.description || '',
          image: row.image || undefined,
          createdAt: new Date(row.createdAt).toISOString(),
          authorName: row.authorName || undefined,
          authorImage: row.authorImage || undefined,
          categories,
          tags: tags ?? categories,
          source: 'db',
          content: row.content || '',
        };
      }
    } catch {
      // Database not configured/reachable — fall through to local posts.
    }
    return null;
  });
