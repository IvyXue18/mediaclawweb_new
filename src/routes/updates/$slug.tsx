import { createFileRoute, notFound } from '@tanstack/react-router';
import { MDXProvider } from '@mdx-js/react';
import { ArrowLeft, Calendar } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { mdxComponents } from '@/components/mdx-components';
import { loadLocalLog } from '@/content/logs';

function formatLogDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export const Route = createFileRoute('/updates/$slug')({
  loader: ({ params }) => {
    const locale = getLocale();
    const log = loadLocalLog(params.slug, locale);
    if (!log) throw notFound();
    return {
      locale,
      slug: params.slug,
      meta: log.meta,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};

    const { locale, slug, meta } = loaderData;
    const path = `/updates/${slug}`;
    const urlFor = (loc: string) =>
      localizeUrl(`${envConfigs.app_url}${path}`, {
        locale: loc as (typeof locales)[number],
      }).href;

    return {
      meta: [
        { title: `${meta.title} | ${envConfigs.app_name}` },
        { name: 'description', content: meta.description },
      ],
      links: [
        { rel: 'canonical', href: urlFor(locale) },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: urlFor(loc),
        })),
      ],
    };
  },
  component: UpdateDetailPage,
});

function UpdateDetailPage() {
  const { locale, slug, meta } = Route.useLoaderData();
  const Content = loadLocalLog(slug, locale)?.default;
  const versionLabel = meta.version
    ? /^v/i.test(meta.version)
      ? meta.version
      : `v${meta.version}`
    : '';

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-muted/20 border-border/60 border-b px-6 py-16 md:px-8 md:py-24">
          <div className="mx-auto w-full max-w-4xl">
            <Link
              href="/updates"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              {locale === 'zh' ? '返回更新日志' : 'Back to updates'}
            </Link>

            <header className="mt-10 text-center">
              {versionLabel ? (
                <span className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-sm font-semibold">
                  {versionLabel}
                </span>
              ) : null}
              <h1 className="mt-5 text-3xl leading-tight font-bold text-balance md:text-5xl">
                {meta.title}
              </h1>
              <p className="text-muted-foreground mx-auto mt-5 max-w-3xl text-base leading-7 md:text-lg">
                {meta.description}
              </p>
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
                <span className="bg-background/80 border-border inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {formatLogDate(meta.date, locale)}
                </span>
              </div>
            </header>
          </div>
        </section>

        <section className="px-6 py-10 md:px-8 md:py-14">
          <article className="mx-auto w-full max-w-4xl text-[15px] leading-7 [&_img]:my-6 [&_img]:w-full [&_img]:rounded-xl [&_img]:object-cover">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : null}
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
