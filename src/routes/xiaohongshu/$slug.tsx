import { createFileRoute, notFound } from '@tanstack/react-router';

import { getLocale } from '@/paraglide/runtime.js';
import {
  LegacyDynamicPage,
  type LegacyPageData,
} from '@/blocks/legacy-dynamic-page';
import enCommentsPage from '@/content/legacy-pages/en/xiaohongshu/comments.json';
import enDownloaderPage from '@/content/legacy-pages/en/xiaohongshu/downloader.json';
import enImageTextPage from '@/content/legacy-pages/en/xiaohongshu/image-text.json';
import enKeywordsPage from '@/content/legacy-pages/en/xiaohongshu/keywords.json';
import enLeadsPage from '@/content/legacy-pages/en/xiaohongshu/leads.json';
import enMonitoringPage from '@/content/legacy-pages/en/xiaohongshu/monitoring.json';
import enScraperPage from '@/content/legacy-pages/en/xiaohongshu/scraper.json';
import enTranscriptPage from '@/content/legacy-pages/en/xiaohongshu/transcript.json';
import zhCommentsPage from '@/content/legacy-pages/zh/xiaohongshu/comments.json';
import zhDownloaderPage from '@/content/legacy-pages/zh/xiaohongshu/downloader.json';
import zhImageTextPage from '@/content/legacy-pages/zh/xiaohongshu/image-text.json';
import zhKeywordsPage from '@/content/legacy-pages/zh/xiaohongshu/keywords.json';
import zhLeadsPage from '@/content/legacy-pages/zh/xiaohongshu/leads.json';
import zhMonitoringPage from '@/content/legacy-pages/zh/xiaohongshu/monitoring.json';
import zhScraperPage from '@/content/legacy-pages/zh/xiaohongshu/scraper.json';
import zhTranscriptPage from '@/content/legacy-pages/zh/xiaohongshu/transcript.json';

import {
  getLocalizedLegacyData,
  legacyPageHead,
  localizedLegacyHead,
  type LocalizedLegacyPages,
} from '../-legacy-page-route';

const pages: Record<string, LocalizedLegacyPages> = {
  comments: { en: enCommentsPage, zh: zhCommentsPage },
  downloader: { en: enDownloaderPage, zh: zhDownloaderPage },
  'image-text': { en: enImageTextPage, zh: zhImageTextPage },
  keywords: { en: enKeywordsPage, zh: zhKeywordsPage },
  leads: { en: enLeadsPage, zh: zhLeadsPage },
  monitoring: { en: enMonitoringPage, zh: zhMonitoringPage },
  scraper: { en: enScraperPage, zh: zhScraperPage },
  transcript: { en: enTranscriptPage, zh: zhTranscriptPage },
};

export const Route = createFileRoute('/xiaohongshu/$slug')({
  loader: ({ params }) => {
    const locale = getLocale();
    const localePages = pages[params.slug];
    const data = localePages
      ? getLocalizedLegacyData(localePages, locale)
      : null;
    if (!data) throw notFound();
    return { locale, data };
  },
  head: ({ loaderData, params }) =>
    loaderData
      ? localizedLegacyHead(
          `/xiaohongshu/${params.slug}`,
          pages[params.slug] ?? { [loaderData.locale]: loaderData.data },
          {
            locale: loaderData.locale,
            data: loaderData.data,
          }
        )
      : legacyPageHead({} as LegacyPageData),
  component: XiaohongshuPage,
});

function XiaohongshuPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
