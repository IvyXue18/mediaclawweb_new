import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enWorkBuddyPage from '@/content/legacy-pages/en/features/workbuddy-integration.json';
import zhWorkBuddyPage from '@/content/legacy-pages/zh/features/workbuddy-integration.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enWorkBuddyPage,
  zh: zhWorkBuddyPage,
};

export const Route = createFileRoute('/features/workbuddy-integration')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/features/workbuddy-integration', pages, loaderData),
  component: WorkBuddyIntegrationPage,
});

function WorkBuddyIntegrationPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
