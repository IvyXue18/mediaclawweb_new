import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enDoubaoPage from '@/content/legacy-pages/en/features/doubao-integration.json';
import zhDoubaoPage from '@/content/legacy-pages/zh/features/doubao-integration.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enDoubaoPage,
  zh: zhDoubaoPage,
};

export const Route = createFileRoute('/features/doubao-integration')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/features/doubao-integration', pages, loaderData),
  component: DoubaoIntegrationPage,
});

function DoubaoIntegrationPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
