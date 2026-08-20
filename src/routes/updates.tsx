import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';

import { getLocale } from '@/paraglide/runtime.js';
import {
  LegacyDynamicPage,
  type LegacyPageData,
} from '@/blocks/legacy-dynamic-page';
import enUpdatesPage from '@/content/legacy-pages/en/updates.json';
import zhUpdatesPage from '@/content/legacy-pages/zh/updates.json';
import { getLocalLogs } from '@/content/logs';

import {
  getLocalizedLegacyData,
  localizedLegacyHead,
} from './-legacy-page-route';

const pages = {
  en: enUpdatesPage,
  zh: zhUpdatesPage,
};

function withReleaseLogItems(data: LegacyPageData, locale: string) {
  const logs = getLocalLogs(locale);
  const sections = data.page?.sections || {};
  const updates = sections.updates || {};

  return {
    ...data,
    page: {
      ...data.page,
      title: data.page?.title || updates.title,
      show_sections: data.page?.show_sections || ['updates'],
      sections: {
        ...sections,
        updates: {
          ...updates,
          id: updates.id || 'updates',
          block: 'timeline',
          items: logs.map((log) => ({
            title: log.title,
            description: log.description,
            date: log.date,
            version: log.version || log.slug,
            tags: log.tags,
            button: {
              title: locale === 'zh' ? '查看详情' : 'Read details',
              url: `/updates/${log.slug}`,
              icon: 'ArrowRight',
            },
          })),
        },
      },
    },
  } satisfies LegacyPageData;
}

export const Route = createFileRoute('/updates')({
  loader: () => {
    const locale = getLocale();
    const data = getLocalizedLegacyData(pages, locale);
    if (!data) {
      throw new Error('Updates content is missing.');
    }
    return {
      locale,
      data: withReleaseLogItems(data, locale),
    };
  },
  head: ({ loaderData, params }) => {
    if ((params as { slug?: string }).slug) {
      return {};
    }

    return loaderData
      ? localizedLegacyHead('/updates', pages, loaderData)
      : localizedLegacyHead('/updates', pages);
  },
  component: UpdatesPage,
});

function UpdatesPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
  if (normalizedPathname !== '/updates' && normalizedPathname !== '/updates/') {
    return <Outlet />;
  }

  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
