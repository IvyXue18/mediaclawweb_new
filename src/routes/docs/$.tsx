import type { ComponentType } from 'react';
import { createFileRoute, notFound } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
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

function getDocLocales(slug: string): (typeof locales)[number][] {
  const available = locales.filter(
    (locale) => `/src/content/docs/${slug}.${locale}.mdx` in docModules
  );
  const hasBaseDocument =
    `/src/content/docs/${slug}.mdx` in docModules ||
    `/src/content/docs/${slug}.${baseLocale}.mdx` in docModules;

  if (hasBaseDocument && !available.includes(baseLocale)) {
    available.push(baseLocale);
  }
  return available;
}

type LoaderData = {
  slug: string;
  locale: string;
  meta: DocMeta;
  availableLocales: (typeof locales)[number][];
  updatedAt: string;
};

export const Route = createFileRoute('/docs/$')({
  loader: ({ params }): LoaderData => {
    const slug = params._splat ?? '';
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
      availableLocales: getDocLocales(slug),
      updatedAt: leaf.updatedAt,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { slug, locale, meta, availableLocales, updatedAt } = loaderData;
    const isLocaleAvailable = availableLocales.includes(
      locale as (typeof locales)[number]
    );
    const canonicalLocale = isLocaleAvailable ? locale : baseLocale;
    const urlFor = (loc: string, markdown = false) =>
      localizeUrl(
        `${envConfigs.app_url}/docs/${slug}${markdown ? '.md' : ''}`,
        { locale: loc as (typeof locales)[number] }
      ).href;
    const canonicalUrl = urlFor(canonicalLocale);
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: meta.title,
        description: meta.description,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        inLanguage: canonicalLocale,
        datePublished: updatedAt,
        dateModified: updatedAt,
        author: {
          '@type': 'Organization',
          name: envConfigs.app_name,
          url: envConfigs.app_url,
        },
        publisher: {
          '@type': 'Organization',
          name: envConfigs.app_name,
          url: envConfigs.app_url,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'MediaClaw 使用文档',
            item: localizeUrl(`${envConfigs.app_url}/docs`, {
              locale: canonicalLocale as (typeof locales)[number],
            }).href,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: meta.title,
            item: canonicalUrl,
          },
        ],
      },
    ];

    return {
      meta: [
        { title: `${meta.title} | ${envConfigs.app_name}` },
        { name: 'description', content: meta.description },
        {
          name: 'robots',
          content: isLocaleAvailable
            ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
            : 'noindex,follow',
        },
        { name: 'author', content: envConfigs.app_name },
        { property: 'og:title', content: meta.title },
        { property: 'og:description', content: meta.description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:site_name', content: envConfigs.app_name },
        { property: 'article:modified_time', content: updatedAt },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: meta.title },
        { name: 'twitter:description', content: meta.description },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        ...availableLocales.map((availableLocale) => ({
          rel: 'alternate',
          hrefLang: availableLocale,
          href: urlFor(availableLocale),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: urlFor(baseLocale),
        },
        {
          rel: 'alternate',
          type: 'text/markdown',
          href: urlFor(canonicalLocale, true),
        },
      ],
      scripts: jsonLd.map((json) => ({
        type: 'application/ld+json',
        children: JSON.stringify(json),
      })),
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
