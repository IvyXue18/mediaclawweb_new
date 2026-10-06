import { createFileRoute } from '@tanstack/react-router';

import { LegacyDynamicPage } from '@/blocks/legacy-dynamic-page';
import enMcpPage from '@/content/legacy-pages/en/features/mcp.json';
import zhMcpPage from '@/content/legacy-pages/zh/features/mcp.json';

import {
  localizedLegacyHead,
  localizedLegacyLoader,
} from '../-legacy-page-route';

const pages = {
  en: enMcpPage,
  zh: zhMcpPage,
};

export const Route = createFileRoute('/features/mcp')({
  loader: () => localizedLegacyLoader(pages),
  head: ({ loaderData }) =>
    localizedLegacyHead('/features/mcp', pages, loaderData),
  component: McpPage,
});

function McpPage() {
  const { data } = Route.useLoaderData();
  return <LegacyDynamicPage data={data} />;
}
