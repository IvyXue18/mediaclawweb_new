import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enPricingPage from '@/content/legacy-pages/en/pricing.json';
import zhPricingPage from '@/content/legacy-pages/zh/pricing.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from './-legacy-page-route';

const pages = {
  en: enPricingPage,
  zh: zhPricingPage,
};

export const Route = createFileRoute('/pricing')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) => localizedLegacyHead('/pricing', pages, loaderData),
  component: PricingPage,
});

function PricingPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
