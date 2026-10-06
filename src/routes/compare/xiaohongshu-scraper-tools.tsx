import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enPage from '@/content/legacy-pages/en/compare/xiaohongshu-scraper-tools.json';
import zhPage from '@/content/legacy-pages/zh/compare/xiaohongshu-scraper-tools.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enPage,
  zh: zhPage,
};

export const Route = createFileRoute('/compare/xiaohongshu-scraper-tools')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead(
      '/compare/xiaohongshu-scraper-tools',
      pages,
      loaderData
    ),
  component: XiaohongshuScraperToolsPage,
});

function XiaohongshuScraperToolsPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
