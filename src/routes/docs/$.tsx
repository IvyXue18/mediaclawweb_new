import type { ComponentType } from 'react';
import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { baseLocale, getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { DocArticle } from '@/components/docs/doc-article';
import { findDocLeaf } from '@/content/docs/registry';

type DocMeta = { title: string; description: string };
type DocModule = { default: ComponentType; meta?: DocMeta };

// Unified content renderer for every nested /docs page — see the plan's
// Day 1 instruction to replace the old $slug/$slug/$ stubs with a single
// registry-driven route instead of one file per page.
const docModules = import.meta.glob<DocModule>('/src/content/docs/**/*.mdx', {
  eager: true,
});

function loadDoc(slug: string, locale: string): DocModule | null {
  const candidates = [
    `/src/content/docs/${slug}.${locale}.mdx`,
    `/src/content/docs/${slug}.${baseLocale}.mdx`,
    `/src/content/docs/${slug}.mdx`,
  ];
  for (const path of candidates) {
    if (path in docModules) return docModules[path];
  }
  return null;
}

type LoaderData = {
  slug: string;
  locale: string;
  meta: DocMeta;
};

export const Route = createFileRoute('/docs/$')({
  loader: ({ params }): LoaderData => {
    const slug = params._splat ?? '';
    if (slug === 'reference/troubleshooting') {
      throw redirect({
        to: '/docs/reference/faq',
        statusCode: 301,
      });
    }
    if (slug === 'create/feishu-ai-template') {
      throw redirect({
        to: '/docs/settings/feishu-template',
        statusCode: 301,
      });
    }
    if (slug === 'reuse/feishu-base') {
      throw redirect({
        to: '/docs/collect/feishu-sync',
        statusCode: 301,
      });
    }
    const leaf = findDocLeaf(slug);
    if (!leaf) throw notFound();

    const locale = getLocale();
    const doc = loadDoc(slug, locale);
    if (!doc) throw notFound();

    return {
      slug,
      locale,
      meta: {
        title: doc.meta?.title ?? leaf.navTitle,
        description: doc.meta?.description ?? '',
      },
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { slug, meta } = loaderData;
    const canonicalUrl = localizeUrl(`${envConfigs.app_url}/docs/${slug}`, {
      locale: baseLocale,
    }).href;
    return {
      meta: [
        { title: `${meta.title} | ${envConfigs.app_name}` },
        { name: 'description', content: meta.description },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', hrefLang: baseLocale, href: canonicalUrl },
        { rel: 'alternate', hrefLang: 'x-default', href: canonicalUrl },
      ],
    };
  },
  component: DocSlugPage,
});

function DocSlugPage() {
  const { slug, locale, meta } = Route.useLoaderData();
  const leaf = findDocLeaf(slug)!;
  const doc = loadDoc(slug, locale)!;
  const Content = doc.default;

  return (
    <DocArticle
      leaf={leaf}
      title={meta.title}
      description={meta.description}
      Content={Content}
    />
  );
}
