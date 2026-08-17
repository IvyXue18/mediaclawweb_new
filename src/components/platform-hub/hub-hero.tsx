import { ArrowDown, ArrowRight, CheckCircle2, Chrome } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';

import type { PlatformHubContent } from './types';

const DEFAULT_PANEL_IMAGE = {
  src: '/imgs/auth-story/extension-panel.webp',
  width: 576,
  height: 1440,
};

function renderTitle(text: string, highlight?: string) {
  if (!highlight) return text;
  const index = text.indexOf(highlight);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-primary whitespace-nowrap">{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
}

export function HubHero({
  content,
  platform,
}: {
  content: PlatformHubContent['hero'];
  platform: PlatformHubContent['platformSlug'];
}) {
  const panelImage = content.image ?? DEFAULT_PANEL_IMAGE;
  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-14 lg:pt-16 lg:pb-28">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_80%_20%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_38%),radial-gradient(circle_at_18%_30%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_28%)]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12 lg:px-10">
        <div>
          <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-[0.12em] uppercase">
            <Chrome className="size-3.5" />
            {content.eyebrow}
          </div>
          <h1 className="text-foreground mt-7 max-w-3xl text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[4.35rem]">
            {content.mobileTitleLines ? (
              <>
                <span className="sm:hidden">
                  {content.mobileTitleLines.map((line) => (
                    <span key={line} className="block">
                      {renderTitle(line, content.titleHighlight)}
                    </span>
                  ))}
                </span>
                <span className="hidden sm:inline">
                  {renderTitle(content.title, content.titleHighlight)}
                </span>
              </>
            ) : (
              renderTitle(content.title, content.titleHighlight)
            )}
          </h1>
          <p className="text-muted-foreground mt-7 max-w-2xl text-lg leading-8 sm:text-xl sm:leading-9">
            {content.description}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={content.primaryHref}
              onClick={() =>
                recordAnalyticsEventSafe('hub_primary_cta_click', {
                  platform,
                  placement: 'hero',
                })
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-0.5"
            >
              {content.primaryAction}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={content.secondaryHref}
              onClick={() =>
                recordAnalyticsEventSafe('hub_secondary_cta_click', {
                  platform,
                  placement: 'hero',
                })
              }
              className="border-border bg-background/60 text-foreground hover:bg-muted inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-all hover:-translate-y-0.5"
            >
              {content.secondaryAction}
              <ArrowDown className="size-4" />
            </a>
          </div>
          <p className="text-muted-foreground mt-5 flex items-center gap-2 text-sm">
            <CheckCircle2 className="text-primary size-4 shrink-0" />
            {content.microcopy}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 bg-[radial-gradient(58%_55%_at_72%_40%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_72%)]"
          />

          {/* Analysis dashboard — the "research & analyze" surface */}
          <div className="border-border/70 bg-card relative overflow-hidden rounded-[1.6rem] border shadow-2xl shadow-slate-950/10 dark:shadow-black/40">
            <div className="border-border/50 flex items-center gap-2 border-b px-4 py-3">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </span>
              <div className="bg-muted text-muted-foreground mx-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium">
                <Chrome className="size-3" />
                MediaClaw
              </div>
            </div>
            <div className="bg-muted/20 aspect-[16/10] overflow-hidden">
              <img
                src="/imgs/features/content-analysis-workflow-v20260719.png"
                alt={content.title}
                width={2146}
                height={1384}
                decoding="async"
                fetchPriority="high"
                className="size-full object-cover object-top"
              />
            </div>
          </div>

          {/* Extension panel with collected data, hugging the left edge */}
          <div className="border-border/60 ring-border/50 bg-card absolute -bottom-[126px] -left-3 max-h-[250px] w-40 overflow-hidden rounded-2xl border shadow-2xl ring-1 shadow-slate-950/30 sm:-bottom-[110px] sm:-left-8 sm:max-h-[300px] sm:w-56 dark:shadow-black/60">
            <img
              src={panelImage.src}
              alt={content.title}
              width={panelImage.width}
              height={panelImage.height}
              decoding="async"
              fetchPriority="high"
              className="w-full"
            />
            <div className="from-card pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
