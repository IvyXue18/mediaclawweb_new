import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enWelfarePage from '@/content/legacy-pages/en/welfare.json';
import zhWelfarePage from '@/content/legacy-pages/zh/welfare.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from './-legacy-page-route';

const pages = {
  en: enWelfarePage,
  zh: zhWelfarePage,
};

export const Route = createFileRoute('/welfare')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) => localizedLegacyHead('/welfare', pages, loaderData),
  component: WelfarePage,
});

function WelfarePage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
