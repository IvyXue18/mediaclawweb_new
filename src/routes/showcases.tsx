import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enShowcasesPage from '@/content/legacy-pages/en/showcases.json';
import zhShowcasesPage from '@/content/legacy-pages/zh/showcases.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from './-legacy-page-route';

const pages = {
  en: enShowcasesPage,
  zh: zhShowcasesPage,
};

export const Route = createFileRoute('/showcases')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/showcases', pages, loaderData),
  component: ShowcasesPage,
});

function ShowcasesPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
