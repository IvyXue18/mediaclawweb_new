import type { ComponentType } from 'react';
import { notFound, useLoaderData } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { frontmatterString, parseFrontmatter } from '@/content/frontmatter';

type PageMeta = {
  title: string;
  description: string;
  updated_at?: string;
  created_at?: string;
};

type PageModule = {
  default: ComponentType;
  meta?: PageMeta;
};
type LoadedPageModule = Omit<PageModule, 'meta'> & { meta: PageMeta };

// Eagerly bundle the static content pages (small legal/info MDX files).
// Keys are absolute from the project root.
const pages = import.meta.glob<PageModule>('/src/content/pages/*.mdx', {
  eager: true,
});
const pageRawModules = import.meta.glob<string>('/src/content/pages/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function resolvePageMeta(path: string, meta?: PageMeta): PageMeta {
  const frontmatter = parseFrontmatter(
    pageRawModules[path] ?? pageRawModules[`${path}?raw`]
  );
  const title =
    meta?.title ?? frontmatterString(frontmatter, 'title') ?? 'MediaClaw';
  const description =
    meta?.description ??
    frontmatterString(frontmatter, 'description') ??
    'MediaClaw documentation and policies.';
  const updatedAt =
    meta?.updated_at ??
    meta?.created_at ??
    frontmatterString(frontmatter, 'updated_at') ??
    frontmatterString(frontmatter, 'created_at');

  return {
    title,
    description,
    updated_at: updatedAt,
    created_at:
      meta?.created_at ?? frontmatterString(frontmatter, 'created_at'),
  };
}

function loadPage(slug: string, locale: string): LoadedPageModule | null {
  const pagePath = [
    `/src/content/pages/${slug}.${locale}.mdx`,
    `/src/content/pages/${slug}.${baseLocale}.mdx`,
    `/src/content/pages/${slug}.mdx`,
  ].find((candidate) => candidate in pages);
  if (!pagePath) return null;

  const page = pages[pagePath];
  return {
    ...page,
    meta: resolvePageMeta(pagePath, page.meta),
  };
}

type LoaderData = { meta: PageMeta; slug: string; locale: string };

// Shared route options for static MDX pages. Each page gets its own
// explicit route file (e.g. privacy-policy.tsx) so static segments
// always outrank dynamic ones — add a new page by creating the MDX
// content plus a thin route file using this factory.
export function staticPageRouteOptions(slug: string) {
  return {
    loader: (): LoaderData => {
      const locale = getLocale();
      const page = loadPage(slug, locale);
      if (!page) throw notFound();
      return { meta: page.meta, slug, locale };
    },
    head: ({ loaderData }: { loaderData?: LoaderData }) => {
      if (!loaderData) return {};
      const { meta, locale } = loaderData;
      const urlFor = (loc: string) =>
        localizeUrl(`${envConfigs.app_url}/${slug}`, {
          locale: loc as (typeof locales)[number],
        }).href;
      return {
        meta: [
          { title: meta.title },
          { name: 'description', content: meta.description },
        ],
        links: [
          { rel: 'canonical', href: urlFor(locale) },
          ...locales.map((loc) => ({
            rel: 'alternate',
            hrefLang: loc,
            href: urlFor(loc),
          })),
        ],
      };
    },
    component: StaticPage,
  };
}

function StaticPage() {
  const { meta, slug, locale } = useLoaderData({
    strict: false,
  }) as LoaderData;

  const page = loadPage(slug, locale)!;
  const Content = page.default;

  return (
    <article>
      <header className="border-border mb-6 border-b pb-5">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          {meta.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">{meta.description}</p>
        {meta.updated_at ? (
          <p className="text-muted-foreground mt-2 text-xs">
            {m['common.pages.last_updated']()}: {meta.updated_at}
          </p>
        ) : null}
      </header>
      <div className="text-foreground/90 text-[15px] leading-7">
        <Content />
      </div>
    </article>
  );
}
