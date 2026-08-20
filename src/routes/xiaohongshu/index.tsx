import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { PlatformHubPage } from '@/components/platform-hub/platform-hub-page';
import type { PlatformHubContent } from '@/components/platform-hub/types';
import {
  enXiaohongshuHub,
  zhXiaohongshuHub,
} from '@/content/platform-hubs/xiaohongshu';

const pages: Record<'zh' | 'en', PlatformHubContent> = {
  zh: zhXiaohongshuHub,
  en: enXiaohongshuHub,
};

function contentFor(locale: string) {
  return pages[locale === 'en' ? 'en' : 'zh'];
}

function urlFor(locale: string, path = '/xiaohongshu') {
  return localizeUrl(`${envConfigs.app_url}${path}`, {
    locale: locale as (typeof locales)[number],
  }).href;
}

function buildHubJsonLd(content: PlatformHubContent, locale: string) {
  const featureItems = content.features
    .filter((feature): feature is typeof feature & { href: string } =>
      Boolean(feature.href)
    )
    .map((feature, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: feature.title,
      url: urlFor(locale, feature.href),
    }));

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: content.metadata.title,
      description: content.metadata.description,
      url: urlFor(locale),
      isPartOf: {
        '@type': 'WebSite',
        name: envConfigs.app_name,
        url: urlFor(locale, '/'),
      },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: featureItems.length,
        itemListElement: featureItems,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: content.breadcrumbs.home,
          item: urlFor(locale, '/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: content.breadcrumbs.current,
          item: urlFor(locale),
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
  ];
}

export const Route = createFileRoute('/xiaohongshu/')({
  loader: () => {
    const locale = getLocale();
    return { locale, content: contentFor(locale) };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const content = loaderData?.content ?? contentFor(locale);
    return {
      meta: [
        { title: content.metadata.title },
        { name: 'description', content: content.metadata.description },
        { name: 'keywords', content: content.metadata.keywords },
        { property: 'og:title', content: content.metadata.title },
        { property: 'og:description', content: content.metadata.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: urlFor(locale) },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: urlFor(baseLocale),
        },
      ],
      scripts: buildHubJsonLd(content, locale).map((json) => ({
        type: 'application/ld+json',
        children: JSON.stringify(json),
      })),
    };
  },
  component: XiaohongshuHubPage,
});

function XiaohongshuHubPage() {
  const { content } = Route.useLoaderData();
  return <PlatformHubPage content={content} />;
}
