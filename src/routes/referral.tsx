import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import {
  DEFAULT_REFERRAL_CONFIG,
  type ReferralProgramConfig,
} from '@/lib/referral-config';
import {
  LegacyDynamicPage,
  type LegacyPageData,
} from '@/blocks/legacy-dynamic-page';
import enReferralPage from '@/content/legacy-pages/en/referral.json';
import zhReferralPage from '@/content/legacy-pages/zh/referral.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from './-legacy-page-route';

const pageTemplates = {
  en: enReferralPage,
  zh: zhReferralPage,
};

const getReferralPageConfig = createServerFn().handler(async () => {
  const { getReferralConfig } = await import('@/modules/referral/service');
  return getReferralConfig();
});

function applyReferralConfig(
  data: LegacyPageData,
  config: ReferralProgramConfig
): LegacyPageData {
  const replacements: Record<string, string> = {
    '{{firstOrderRate}}': String(config.firstOrderRate),
    '{{renewalRate}}': String(config.renewalRate),
    '{{inviteeDiscount}}': String(config.inviteeDiscount),
  };
  const replace = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return Object.entries(replacements).reduce(
        (text, [token, replacement]) => text.replaceAll(token, replacement),
        value
      );
    }
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, replace(item)])
      );
    }
    return value;
  };

  return replace(data) as LegacyPageData;
}

const fallbackPages = {
  en: applyReferralConfig(enReferralPage, DEFAULT_REFERRAL_CONFIG),
  zh: applyReferralConfig(zhReferralPage, DEFAULT_REFERRAL_CONFIG),
};

export const Route = createFileRoute('/referral')({
  loader: async () => {
    const localized = localizedLegacyLoader(pageTemplates);
    const config = await getReferralPageConfig();
    return {
      ...localized,
      data: applyReferralConfig(localized.data, config),
    };
  },
  head: ({ loaderData }) =>
    localizedLegacyHead('/referral', fallbackPages, loaderData),
  component: ReferralPage,
});

function ReferralPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
