import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enCodexPage from '@/content/legacy-pages/en/features/codex-integration.json';
import zhCodexPage from '@/content/legacy-pages/zh/features/codex-integration.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enCodexPage,
  zh: zhCodexPage,
};

export const Route = createFileRoute('/features/codex-integration')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/features/codex-integration', pages, loaderData),
  component: CodexIntegrationPage,
});

function CodexIntegrationPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
