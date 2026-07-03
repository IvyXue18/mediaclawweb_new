import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enDownloadPage from '@/content/legacy-pages/en/download.json';
import zhDownloadPage from '@/content/legacy-pages/zh/download.json';

import { legacyPageHead } from './-legacy-page-route';

function getDownloadPage(locale: string) {
  return locale === 'en' ? enDownloadPage : zhDownloadPage;
}

export const Route = createFileRoute('/download')({
  loader: () => {
    const locale = getLocale();
    return { locale, data: getDownloadPage(locale) };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const data = loaderData?.data ?? getDownloadPage(locale);
    const head = legacyPageHead(data);
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/download`, { locale: loc as any })
        .href;

    return {
      ...head,
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
  component: DownloadPage,
});

function DownloadPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
