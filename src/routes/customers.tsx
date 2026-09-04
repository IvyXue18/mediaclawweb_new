import { createFileRoute } from '@tanstack/react-router';

import { envConfigs } from '@/config';
import { m } from '@/paraglide/messages.js';
import {
  baseLocale,
  getLocale,
  locales,
  localizeUrl,
} from '@/paraglide/runtime.js';
import { CustomerReviews } from '@/blocks/customer-reviews';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';

function pageMeta(locale: string) {
  return {
    title: m['customers.meta.title']({}, { locale }),
    description: m['customers.meta.description']({}, { locale }),
  };
}

export const Route = createFileRoute('/customers')({
  loader: () => {
    const locale = getLocale();
    return { locale, ...pageMeta(locale) };
  },
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const meta = loaderData ?? pageMeta(locale);
    const canonicalUrl = localizeUrl(`${envConfigs.app_url}/customers`, {
      locale: locale as (typeof locales)[number],
    }).href;

    return {
      meta: [
        { title: meta.title },
        { name: 'description', content: meta.description },
        { property: 'og:title', content: meta.title },
        { property: 'og:description', content: meta.description },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: localizeUrl(`${envConfigs.app_url}/customers`, { locale: loc })
            .href,
        })),
        {
          rel: 'alternate',
          hrefLang: 'x-default',
          href: localizeUrl(`${envConfigs.app_url}/customers`, {
            locale: baseLocale,
          }).href,
        },
      ],
    };
  },
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main>
        <CustomerReviews />
      </main>
      <Footer />
    </div>
  );
}
