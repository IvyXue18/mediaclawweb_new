import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enReferralPage from '@/content/legacy-pages/en/referral.json';
import zhReferralPage from '@/content/legacy-pages/zh/referral.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from './-legacy-page-route';

const pages = {
  en: enReferralPage,
  zh: zhReferralPage,
};

export const Route = createFileRoute('/referral')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) => localizedLegacyHead('/referral', pages, loaderData),
  component: ReferralPage,
});

function ReferralPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
