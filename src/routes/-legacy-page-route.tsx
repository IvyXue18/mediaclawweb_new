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
