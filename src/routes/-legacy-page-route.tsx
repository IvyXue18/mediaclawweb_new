import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import {
  LegacyDynamicPage,
  type LegacyPageData,
} from '@/blocks/legacy-dynamic-page';

export type LocalizedLegacyPages = Partial<Record<string, LegacyPageData>>;

type JsonLdObject = Record<string, unknown>;

// Real rating data from the Chrome Web Store listing. Update these numbers
// manually as store ratings grow — never inflate them beyond the store page.
const CHROME_STORE_RATING = {
  ratingValue: '5',
  ratingCount: 1,
};

function buildLegacyJsonLd(data: LegacyPageData, url: string): JsonLdObject[] {
  const jsonLd: JsonLdObject[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: envConfigs.app_name,
      url,
      applicationCategory: 'BrowserApplication',
      operatingSystem: 'Chrome',
      ...(data.metadata?.description
        ? { description: data.metadata.description }
        : {}),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: CHROME_STORE_RATING.ratingValue,
        ratingCount: CHROME_STORE_RATING.ratingCount,
        bestRating: '5',
        worstRating: '1',
      },
    },
  ];

  const sections = Object.values(data.page?.sections ?? {});
  const faq = sections.find((section) => section?.block === 'faq');
  const faqItems = (faq?.items ?? []).filter(
    (item) => item.question && item.answer
  );

  if (faqItems.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return jsonLd;
}

export function legacyPageHead(data: LegacyPageData) {
  return {
    meta: [
      data.metadata?.title ? { title: data.metadata.title } : null,
      data.metadata?.description
        ? { name: 'description', content: data.metadata.description }
        : null,
      data.metadata?.keywords
        ? { name: 'keywords', content: data.metadata.keywords }
        : null,
    ].filter(Boolean),
  };
}

export function getLocalizedLegacyData(
  pages: LocalizedLegacyPages,
  locale: string
) {
  const data =
    pages[locale] ??
    pages[baseLocale] ??
    pages.zh ??
    pages.en ??
    Object.values(pages)[0];

  if (!data) {
    throw new Error(`Legacy page content is missing for locale "${locale}".`);
  }

  return data;
}

export function localizedLegacyLoader(pages: LocalizedLegacyPages) {
  const locale = getLocale();
  return {
    locale,
    data: getLocalizedLegacyData(pages, locale),
  };
}

export function localizedLegacyHead(
  path: string,
  pages: LocalizedLegacyPages,
  loaderData?: { locale: string; data?: LegacyPageData }
) {
  const locale = loaderData?.locale ?? baseLocale;
  const data = loaderData?.data ?? getLocalizedLegacyData(pages, locale);
  const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/+/, '')}`;
  const urlFor = (loc: string) =>
    localizeUrl(`${envConfigs.app_url}${normalizedPath}`, {
      locale: loc as (typeof locales)[number],
    }).href;

  return {
    ...(data ? legacyPageHead(data) : { meta: [] }),
    scripts: data
      ? buildLegacyJsonLd(data, urlFor(locale)).map((json) => ({
          type: 'application/ld+json',
          children: JSON.stringify(json),
        }))
      : [],
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
}

export function renderLegacyPage(data: LegacyPageData) {
  return function LegacyPageRoute() {
    return <LegacyDynamicPage data={data} />;
  };
}
