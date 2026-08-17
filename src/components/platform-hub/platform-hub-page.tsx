import { useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';

import { HubFaq } from './hub-faq';
import { HubFeatureDirectory } from './hub-feature-directory';
import { HubHero } from './hub-hero';
import { HubWorkflowShowcase } from './hub-workflow-showcase';
import type { PlatformHubContent } from './types';

export function PlatformHubPage({ content }: { content: PlatformHubContent }) {
  const platform = content.platformSlug;

  useEffect(() => {
    const seen = new Set<string>();
    const impressionQueue: string[] = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    const flushImpression = () => {
      const feature = impressionQueue.shift();
      if (feature) {
        recordAnalyticsEventSafe('hub_feature_impression', {
          platform,
          feature,
        });
      }
      flushTimer = impressionQueue.length
        ? setTimeout(flushImpression, 160)
        : null;
    };
    const nodes = document.querySelectorAll<HTMLElement>('[data-hub-feature]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const feature = (entry.target as HTMLElement).dataset.hubFeature;
          if (!feature || seen.has(feature)) return;
          seen.add(feature);
          impressionQueue.push(feature);
          if (!flushTimer) flushTimer = setTimeout(flushImpression, 0);
        });
      },
      { threshold: 0.35 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      if (flushTimer) clearTimeout(flushTimer);
    };
  }, [platform]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <main>
        <div className="mx-auto max-w-7xl px-5 pt-28 sm:px-8 lg:px-10 lg:pt-32">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground flex items-center gap-2 text-xs font-medium"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              {content.breadcrumbs.home}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">
              {content.breadcrumbs.current}
            </span>
          </nav>
        </div>

        <HubHero content={content.hero} platform={platform} />
        <HubFeatureDirectory
          heading={content.directorySection}
          scenes={content.scenes}
          features={content.features}
          platform={platform}
        />
        <HubWorkflowShowcase
          heading={content.workflowSection}
          workflows={content.workflows}
          platform={platform}
        />
        <HubFaq heading={content.faqSection} faqs={content.faqs} />

        <section className="px-5 pb-16 sm:px-8 lg:px-10">
          <div className="border-border/60 bg-muted/30 mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl border px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <h2 className="text-foreground text-base font-bold">
                {content.crossPlatform.title}
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                {content.crossPlatform.description}
              </p>
            </div>
            <Link
              href={content.crossPlatform.href}
              onClick={() =>
                recordAnalyticsEventSafe('hub_cross_platform_click', {
                  platform,
                  target_page: content.crossPlatform.href,
                })
              }
              className="border-border bg-background text-foreground hover:bg-muted inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
            >
              {content.crossPlatform.actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10 lg:pb-32">
          <div className="bg-primary text-primary-foreground relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-14 text-center shadow-2xl shadow-pink-500/20 sm:px-10 sm:py-18 lg:py-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_90%_90%,rgba(255,255,255,0.12),transparent_30%)]" />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-bold tracking-[0.17em] text-white/75 uppercase">
                {content.finalCta.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl lg:text-5xl">
                {content.finalCta.title}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                {content.finalCta.description}
              </p>
              <Link
                href={content.finalCta.href}
                onClick={() =>
                  recordAnalyticsEventSafe('hub_primary_cta_click', {
                    platform,
                    placement: 'final_cta',
                  })
                }
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-slate-950 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-pink-50"
              >
                {content.finalCta.actionLabel}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
