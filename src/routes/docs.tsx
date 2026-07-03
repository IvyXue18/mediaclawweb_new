import type { ComponentType } from 'react';
import {
  createFileRoute,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';

import { envConfigs } from '@/config';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';

type DocsMeta = {
  title?: string;
  description?: string;
};

type DocsModule = {
  default: ComponentType;
  meta?: DocsMeta;
};

const docsModules = import.meta.glob<DocsModule>('/src/content/docs/*.mdx', {
  eager: true,
});

function loadDocs(locale: string) {
  return (
    docsModules[`/src/content/docs/index.${locale}.mdx`] ??
    docsModules[`/src/content/docs/index.${baseLocale}.mdx`] ??
    docsModules['/src/content/docs/index.mdx'] ??
    null
  );
}

export const Route = createFileRoute('/docs')({
  loader: () => {
    const locale = getLocale();
    const docs = loadDocs(locale);
    return {
      locale,
      title: docs?.meta?.title || 'Docs',
      description:
        docs?.meta?.description || 'MediaClaw documentation and usage guides.',
    };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}/docs`, {
        locale: loc as (typeof locales)[number],
      }).href;
    return {
      meta: [
        {
          title: `${loaderData?.title || 'Docs'} | ${envConfigs.app_name}`,
        },
        {
          name: 'description',
          content:
            loaderData?.description ||
            'MediaClaw documentation and usage guides.',
        },
      ],
      links: [
        {
          rel: 'canonical',
          href: urlFor(locale),
        },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
        { rel: 'alternate', hrefLang: 'x-default', href: urlFor(baseLocale) },
      ],
    };
  },
  component: DocsPage,
});

function DocsPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(?=\/)/, '');
  if (normalizedPathname !== '/docs' && normalizedPathname !== '/docs/') {
    return <Outlet />;
  }

  const { locale, title, description } = Route.useLoaderData();
  const docs = loadDocs(locale);
  const Content = docs?.default;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-16 sm:py-24">
        <article className="mx-auto max-w-3xl">
          <header className="border-border mb-8 border-b pb-6">
            <h1 className="text-foreground text-4xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground mt-3">{description}</p>
          </header>
          <div className="text-foreground/90 text-[15px] leading-7">
            {Content ? <Content /> : null}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
