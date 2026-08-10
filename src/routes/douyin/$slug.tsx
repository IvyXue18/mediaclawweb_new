import { createFileRoute, notFound } from '@tanstack/react-router';

import { getLocale } from '@/paraglide/runtime.js';
import {
  LegacyDynamicPage,
  type LegacyPageData,
} from '@/blocks/legacy-dynamic-page';
import enAccountAnalysisPage from '@/content/legacy-pages/en/douyin/account-analysis.json';
import enCommentsPage from '@/content/legacy-pages/en/douyin/comments.json';
import enDownloaderPage from '@/content/legacy-pages/en/douyin/downloader.json';
import enImageTextPage from '@/content/legacy-pages/en/douyin/image-text.json';
import enKeywordsPage from '@/content/legacy-pages/en/douyin/keywords.json';
import enLeadsPage from '@/content/legacy-pages/en/douyin/leads.json';
import enMonitoringPage from '@/content/legacy-pages/en/douyin/monitoring.json';
import enScraperPage from '@/content/legacy-pages/en/douyin/scraper.json';
import enTranscriptPage from '@/content/legacy-pages/en/douyin/transcript.json';
import zhAccountAnalysisPage from '@/content/legacy-pages/zh/douyin/account-analysis.json';
import zhCommentsPage from '@/content/legacy-pages/zh/douyin/comments.json';
import zhDownloaderPage from '@/content/legacy-pages/zh/douyin/downloader.json';
import zhImageTextPage from '@/content/legacy-pages/zh/douyin/image-text.json';
import zhKeywordsPage from '@/content/legacy-pages/zh/douyin/keywords.json';
import zhLeadsPage from '@/content/legacy-pages/zh/douyin/leads.json';
import zhMonitoringPage from '@/content/legacy-pages/zh/douyin/monitoring.json';
import zhScraperPage from '@/content/legacy-pages/zh/douyin/scraper.json';
import zhTranscriptPage from '@/content/legacy-pages/zh/douyin/transcript.json';

import {
  getLocalizedLegacyData,
  legacyPageHead,
  localizedLegacyHead,
  type LocalizedLegacyPages,
} from '../-legacy-page-route';

const pages: Record<string, LocalizedLegacyPages> = {
  'account-analysis': { en: enAccountAnalysisPage, zh: zhAccountAnalysisPage },
  comments: { en: enCommentsPage, zh: zhCommentsPage },
  downloader: { en: enDownloaderPage, zh: zhDownloaderPage },
  'image-text': { en: enImageTextPage, zh: zhImageTextPage },
  keywords: { en: enKeywordsPage, zh: zhKeywordsPage },
  leads: { en: enLeadsPage, zh: zhLeadsPage },
  monitoring: { en: enMonitoringPage, zh: zhMonitoringPage },
  scraper: { en: enScraperPage, zh: zhScraperPage },
  transcript: { en: enTranscriptPage, zh: zhTranscriptPage },
};

export const Route = createFileRoute('/douyin/$slug')({
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
          `/douyin/${params.slug}`,
          pages[params.slug] ?? { [loaderData.locale]: loaderData.data },
          {
            locale: loaderData.locale,
            data: loaderData.data,
          }
        )
      : legacyPageHead({} as LegacyPageData),
  component: DouyinPage,
});

function DouyinPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
