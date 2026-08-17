import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { cn } from '@/lib/utils';

import { HubIcon } from './hub-icon';
import { HubSectionHeading } from './hub-section-heading';
import type {
  PlatformHubContent,
  PlatformHubFeature,
  PlatformHubScene,
} from './types';

const featureImages: Record<
  string,
  { src: string; width: number; height: number; position?: string }
> = {
  keywords: {
    src: '/imgs/features/11-v20260424.webp',
    width: 1200,
    height: 778,
  },
  'viral-content-analysis': {
    src: '/imgs/docs/getting-started/first-draft/03-获得单篇拆解报告.webp',
    width: 1600,
    height: 1163,
  },
  'account-analysis': {
    src: '/imgs/docs/benchmark/account-research/05-拆解报告-选题归类.webp',
    width: 1600,
    height: 1187,
  },
  scraper: {
    src: '/imgs/docs/collect/single-post/01-小红书采集一批笔记-clean.webp',
    width: 800,
    height: 554,
    position: 'bottom',
  },
  comments: {
    src: '/imgs/docs/collect/comments/01-采集单篇作品评论.webp',
    width: 798,
    height: 786,
  },
  downloader: {
    src: '/imgs/features/13-v20260424.webp',
    width: 1058,
    height: 1200,
  },
  'image-text': {
    src: '/imgs/docs/collect/image-text/01-image-to-text-extract.webp',
    width: 1600,
    height: 1025,
  },
  transcript: {
    src: '/imgs/docs/collect/transcript/01-xiaohongshu-video-to-transcript.webp',
    width: 1600,
    height: 978,
  },
  leads: {
    src: '/imgs/features/10-v20260424.webp',
    width: 1200,
    height: 694,
  },
  monitoring: {
    src: '/imgs/docs/benchmark/monitoring/04-收到的日报消息.webp',
    width: 1600,
    height: 1152,
  },
  'feishu-integration': {
    src: '/imgs/auth-story/feishu-dashboard.webp',
    width: 967,
    height: 818,
  },
  'codex-agent': {
    src: '/imgs/features/2-20260816.webp',
    width: 2892,
    height: 2140,
  },
  'workbuddy-agent': {
    src: '/imgs/features/3-20260816.webp',
    width: 1280,
    height: 1032,
  },
};

function FeatureThumb({
  feature,
  className,
}: {
  feature: PlatformHubFeature;
  className?: string;
}) {
  const image = feature.image ?? featureImages[feature.id];
  if (!image) {
    return (
      <div
        className={cn(
          'bg-muted/60 relative flex items-center justify-center overflow-hidden',
          className
        )}
      >
        {!feature.href ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%)]" />
        ) : null}
        <HubIcon
          name={feature.icon}
          className={cn(
            'text-primary/60 relative size-8',
            !feature.href && 'size-12'
          )}
        />
      </div>
    );
  }
  return (
    <div className={cn('bg-muted/50 overflow-hidden', className)}>
      <img
        src={image.src}
        alt={feature.title}
        width={image.width}
        height={image.height}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: image.position ?? 'top' }}
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    </div>
  );
}

function FeatureMeta({
  feature,
  pinAction = true,
  onNavigate,
}: {
  feature: PlatformHubFeature;
  pinAction?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
          <HubIcon name={feature.icon} className="size-4" />
        </div>
        <h4 className="text-foreground text-base font-semibold">
          {feature.href ? (
            <Link
              href={feature.href}
              onClick={onNavigate}
              className="group/title hover:text-primary focus-visible:ring-primary/40 inline-flex items-center gap-1 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {feature.title}
              <ArrowUpRight className="size-3.5 transition-transform group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5" />
            </Link>
          ) : (
            feature.title
          )}
        </h4>
        {feature.badge ? (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
            {feature.badge}
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        {feature.description}
      </p>
      {!feature.href && feature.actionLabel ? (
        <span
          className={cn(
            'text-primary inline-flex items-center gap-1 pt-4 text-xs font-semibold',
            pinAction && 'mt-auto'
          )}
        >
          {feature.actionLabel}
        </span>
      ) : null}
    </>
  );
}

function FeatureCard({
  feature,
  scene,
  single,
  onNavigate,
}: {
  feature: PlatformHubFeature;
  scene: PlatformHubScene;
  single: boolean;
  onNavigate: (feature: PlatformHubFeature, scene: PlatformHubScene) => void;
}) {
  const className = cn(
    'group border-border/70 bg-card overflow-hidden rounded-2xl border shadow-sm transition-all',
    single ? 'grid md:grid-cols-2' : 'flex flex-col',
    feature.href
      ? single
        ? 'hover:border-primary/30 hover:shadow-md'
        : 'hover:border-primary/30 hover:-translate-y-1 hover:shadow-md'
      : 'border-dashed bg-card/65'
  );

  const contents = single ? (
    <>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <FeatureMeta
          feature={feature}
          pinAction={false}
          onNavigate={() => onNavigate(feature, scene)}
        />
      </div>
      <FeatureThumb
        feature={feature}
        className="order-first max-h-64 min-h-48 border-b md:order-last md:border-b-0 md:border-l"
      />
    </>
  ) : (
    <>
      <FeatureThumb feature={feature} className="aspect-[16/10] border-b" />
      <div className="flex flex-1 flex-col p-5">
        <FeatureMeta
          feature={feature}
          onNavigate={() => onNavigate(feature, scene)}
        />
      </div>
    </>
  );

  return (
    <article
      data-hub-feature={feature.id}
      aria-disabled={feature.href ? undefined : true}
      className={className}
    >
      {contents}
    </article>
  );
}

export function HubFeatureDirectory({
  heading,
  scenes,
  features,
  platform,
}: {
  heading: {
    eyebrow: string;
    title: string;
    description: string;
  };
  scenes: PlatformHubScene[];
  features: PlatformHubFeature[];
  platform: PlatformHubContent['platformSlug'];
}) {
  const featureMap = new Map(features.map((feature) => [feature.id, feature]));

  const track = (feature: PlatformHubFeature, scene: PlatformHubScene) =>
    recordAnalyticsEventSafe('hub_feature_click', {
      platform,
      feature: feature.id,
      placement: 'directory',
      scene: scene.id,
    });

  return (
    <section id="all-features" className="scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <HubSectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
        />

        <div className="mt-12 space-y-6">
          {scenes.map((scene, sceneIndex) => {
            const sceneFeatures = scene.featureIds
              .map((id) => featureMap.get(id))
              .filter((feature): feature is PlatformHubFeature =>
                Boolean(feature)
              );
            const isSingle = sceneFeatures.length === 1;
            const isPair = sceneFeatures.length === 2;

            return (
              <section
                key={scene.id}
                id={`scene-${scene.id}`}
                className="border-border/60 bg-muted/30 scroll-mt-24 rounded-[2rem] border p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-background text-primary border-border/60 flex size-12 shrink-0 items-center justify-center rounded-2xl border">
                    <HubIcon name={scene.icon} className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-muted-foreground/60 text-sm font-semibold tabular-nums">
                        0{sceneIndex + 1}
                      </span>
                      <p className="text-primary text-[11px] font-bold tracking-[0.15em] uppercase">
                        {scene.eyebrow}
                      </p>
                    </div>
                    <h3 className="text-foreground mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                      {scene.title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-6">
                      {scene.description}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    'mt-6 grid gap-4',
                    isSingle
                      ? 'grid-cols-1'
                      : isPair
                        ? 'sm:grid-cols-2'
                        : 'sm:grid-cols-2 lg:grid-cols-3'
                  )}
                >
                  {sceneFeatures.map((feature) => (
                    <FeatureCard
                      key={feature.id}
                      feature={feature}
                      scene={scene}
                      single={isSingle}
                      onNavigate={track}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
