import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enFeishuPage from '@/content/legacy-pages/en/features/feishu-integration.json';
import zhFeishuPage from '@/content/legacy-pages/zh/features/feishu-integration.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enFeishuPage,
  zh: zhFeishuPage,
};

export const Route = createFileRoute('/features/feishu-integration')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/features/feishu-integration', pages, loaderData),
  component: FeishuIntegrationPage,
});

function FeishuIntegrationPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
