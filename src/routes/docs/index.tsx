import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  HelpCircle,
  MessageCircle,
  Radar,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';
import { baseLocale, getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { DotPattern } from '@/components/ui/dot-pattern';
import {
  DOCS_PUBLISHED_AT,
  findDocLeaf,
  getAllDocSlugs,
} from '@/content/docs/registry';

const PAGE_TITLE = 'MediaClaw 使用文档';
const PAGE_DESCRIPTION = '自媒体插件工作流一站完成：采集——分析——选题——创作';

export const Route = createFileRoute('/docs/')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const isCanonicalLocale = locale === baseLocale;
    const canonicalUrl = localizeUrl(`${envConfigs.app_url}/docs`, {
      locale: baseLocale,
    }).href;
    const markdownUrl = localizeUrl(`${envConfigs.app_url}/docs.md`, {
      locale: baseLocale,
    }).href;
    const items = getAllDocSlugs().map((slug, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: findDocLeaf(slug)?.navTitle ?? slug,
      url: localizeUrl(`${envConfigs.app_url}/docs/${slug}`, {
        locale: baseLocale,
      }).href,
    }));

    return {
      meta: [
        { title: `${PAGE_TITLE} | ${envConfigs.app_name}` },
        { name: 'description', content: PAGE_DESCRIPTION },
        {
          name: 'robots',
          content: isCanonicalLocale
            ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
            : 'noindex,follow',
        },
        { property: 'og:title', content: PAGE_TITLE },
        { property: 'og:description', content: PAGE_DESCRIPTION },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:site_name', content: envConfigs.app_name },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: PAGE_TITLE },
        { name: 'twitter:description', content: PAGE_DESCRIPTION },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', hrefLang: baseLocale, href: canonicalUrl },
        { rel: 'alternate', hrefLang: 'x-default', href: canonicalUrl },
        { rel: 'alternate', type: 'text/markdown', href: markdownUrl },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
            url: canonicalUrl,
            inLanguage: baseLocale,
            datePublished: DOCS_PUBLISHED_AT,
            dateModified: DOCS_PUBLISHED_AT,
            isPartOf: {
              '@type': 'WebSite',
              name: envConfigs.app_name,
              url: envConfigs.app_url,
            },
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: items.length,
              itemListElement: items,
            },
          }),
        },
      ],
    };
  },
  component: DocsHomePage,
});

// This page is NOT a directory — DocSidebar (lg+) and DocMobileNav (below lg)
// already are. It runs three weights:
//
//   L1 filled panel   the one guided path, for people who arrived with no
//                     specific task. Deliberately NOT frequency-ranked: it's
//                     the product's shape, and every L2/L3 entry sits on it.
//   L2 outlined cards the three tasks people most often arrive already trying
//                     to do — ranked by demand.
//   L3 bare links     everything else, also ranked by demand.
//
// Demand numbers below come from channel_survey_response (n=268,
// 2026-06-14 → 2026-08-24). Persona-based cards were removed: the
// role × use_case crosstab shows all six roles share the same top intents,
// so splitting by identity sorted nobody (and brand_team, which used to have
// a card, is the smallest role at 7.8%).

// Each step carries what you walk away with, so the strip reads as the actual
// path rather than four labels — and so the early steps (which is what most
// people arrive for) state their own payoff instead of being a lead-in to the
// draft at the end.
const mainPathSteps = [
  { label: '采集一篇作品', hint: '正文、数据和评论入库' },
  { label: '发起单篇拆解', hint: '看清它为什么有效' },
  { label: '挑一个扩展选题', hint: '得到一批可做的选题' },
  { label: '生成第一版稿件', hint: '标题、封面与逐字稿' },
];

// These shortcuts span the three recurring jobs users come to the docs for:
// collecting audience signals, extracting source material, and following
// benchmark accounts over time.
const topTasks = [
  {
    title: '提取作品评论',
    desc: '批量拉取评论区，按关键词和 IP 属地筛出高意向留言。',
    href: '/docs/collect/comments',
    icon: MessageCircle,
  },
  {
    title: '提取逐字稿与图文文案',
    desc: '视频转文字、图片转文案，单篇或整批都可以。',
    href: '/docs/collect/transcript',
    icon: FileText,
  },
  {
    title: '监控对标账号',
    desc: '持续追踪账号的新作品，自动发现更新和潜在爆款。',
    href: '/docs/benchmark/monitoring',
    icon: Radar,
  },
];

// Ordered by the use_case multi-select: 找选题 62% · 采集爆款样本 55% ·
// 分析对标 50% · 获客线索 35% · 素材 34% · 达人调研 27%. Creation and Agent
// trail all of them, so they sit at the end.
const goalShortcuts = [
  { label: '找选题', href: '/docs/topics/keyword-trends' },
  { label: '拆爆款', href: '/docs/viral-research/single-post-breakdown' },
  { label: '找对标账号', href: '/docs/benchmark/find-accounts' },
  { label: '挖客资线索', href: '/docs/brand/high-intent' },
  { label: '下载无水印素材', href: '/docs/collect/no-watermark' },
  { label: '导出到本地', href: '/docs/collect/export-local' },
  { label: '同步到飞书', href: '/docs/collect/feishu-sync' },
  { label: '内容创作', href: '/docs/create/overview' },
  { label: 'Agent 工作流', href: '/docs/agent/setup' },
  { label: '提问案例', href: '/docs/agent/prompt-examples' },
  { label: '品牌舆情', href: '/docs/brand/sentiment' },
];

function DocsHomePage() {
  return (
    <div className="xl:grid xl:min-h-[calc(100dvh-5.5rem)] xl:grid-rows-[minmax(270px,1.45fr)_minmax(180px,0.75fr)_minmax(150px,0.8fr)] xl:gap-3">
      {/* L1 — the cover. The rest of /docs is a quiet reading surface, so this
          is the one place that gets the marketing site's display voice
          (font-serif + wide-tracked masthead + DotPattern, same recipe as
          blocks/hero.tsx). The contrast is the point: a loud cover over a
          quiet contents list. Everything below it stays deliberately plain. */}
      <section className="border-border bg-accent/40 relative isolate overflow-hidden rounded-2xl border xl:flex xl:flex-col">
        <DotPattern
          className={cn(
            '[mask-image:radial-gradient(ellipse_at_top_left,white,transparent_70%)]',
            'text-foreground/15'
          )}
        />

        <div className="relative flex px-5 py-5 sm:px-7 lg:items-center lg:px-8 xl:flex-1">
          <div className="w-full">
            <p className="text-muted-foreground text-[11px] tracking-[0.25em] uppercase">
              {envConfigs.app_name} · 使用文档
            </p>

            <h1 className="text-foreground mt-3 max-w-3xl font-serif text-3xl leading-[1.08] font-normal tracking-tight sm:text-4xl lg:text-[2.75rem]">
              10 分钟，
              <br className="hidden sm:block" />
              从一条爆款到你的初稿
            </h1>

            <div className="mt-3 flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-3">
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base">
                {PAGE_DESCRIPTION}
              </p>
              <Link
                href="/docs/getting-started/first-draft"
                className="text-primary group/cta inline-flex shrink-0 items-center gap-2 text-sm font-semibold"
              >
                开始第一次上手
                <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full transition-transform group-hover/cta:translate-x-0.5">
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Cover lines — the four steps as an editorial strip along the
            bottom edge, oversized serif numerals doing the sequencing so no
            chevron has to float in a half-empty column. */}
        <ol className="border-border relative grid grid-cols-2 border-t md:grid-cols-4">
          {mainPathSteps.map((step, index) => (
            <li
              key={step.label}
              className={cn(
                'border-border px-5 py-3 sm:px-6',
                index % 2 === 1 && 'border-l',
                index < 2 && 'border-b md:border-b-0',
                index === 2 && 'md:border-l',
                index === 3 && 'md:border-l'
              )}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-primary/70 font-serif text-xl leading-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-foreground text-sm font-medium">
                  {step.label}
                </p>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                {step.hint}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* L2 — the three tasks people most often arrive already trying to do. */}
      <section className="border-border bg-muted/25 mt-4 rounded-2xl border p-3 xl:mt-0 xl:flex xl:min-h-0 xl:flex-col">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="bg-primary/10 text-primary rounded-full px-2 py-1 text-[10px] font-medium tracking-[0.16em] uppercase">
              常用指南
            </p>
            <h2 className="text-foreground text-lg font-semibold tracking-tight sm:text-xl">
              最常被问到的三件事
            </h2>
          </div>
          <p className="text-muted-foreground hidden text-xs sm:block">
            从真实使用需求出发
          </p>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-h-0 xl:flex-1">
          {topTasks.map((task) => {
            const Icon = task.icon;

            return (
              <Link
                key={task.href}
                href={task.href}
                className="group border-border bg-card hover:border-primary/40 hover:shadow-primary/5 relative flex h-full flex-col justify-center overflow-hidden rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="bg-primary/8 absolute -top-10 -right-10 size-28 rounded-full transition-transform duration-500 group-hover:scale-125" />
                <span className="bg-primary/70 absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="relative flex items-center justify-between">
                  <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <span className="border-border bg-background text-muted-foreground group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground flex size-7 items-center justify-center rounded-full border transition-colors">
                    <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <p className="text-foreground relative mt-2 text-sm font-semibold sm:text-base">
                  {task.title}
                </p>
                <p className="text-muted-foreground relative mt-1 text-xs leading-4">
                  {task.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)] xl:mt-0 xl:min-h-0">
        {/* L3 — compact shortcuts for people who already know their goal. */}
        <section className="border-border bg-muted/35 relative isolate h-full overflow-hidden rounded-2xl border p-5">
          <DotPattern
            className={cn(
              '[mask-image:radial-gradient(ellipse_at_top_right,white,transparent_68%)]',
              'text-foreground/10'
            )}
          />
          <div className="relative flex h-full flex-col justify-center">
            <h2 className="text-foreground text-lg font-semibold tracking-tight">
              按目的直达
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-5 sm:text-sm">
              已经知道想做什么？直接进入对应指南。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {goalShortcuts.map((goal) => (
                <Link
                  key={goal.href}
                  href={goal.href}
                  className="border-border bg-background/90 text-foreground/75 hover:border-primary/40 hover:bg-primary/8 hover:text-primary inline-flex rounded-full border px-3 py-1.5 text-xs shadow-xs transition-colors"
                >
                  {goal.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Link
          href="/docs/settings/faq"
          className="group bg-foreground text-background relative isolate flex h-full flex-col overflow-hidden rounded-2xl p-5"
        >
          <span className="bg-primary/35 absolute -top-16 -right-12 size-52 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125" />
          <div className="relative flex items-center gap-2.5">
            <span className="bg-background/10 flex size-7 items-center justify-center rounded-full">
              <HelpCircle className="size-3.5" />
            </span>
            <p className="text-background/55 text-[11px] font-medium tracking-[0.2em] uppercase">
              常见问题
            </p>
          </div>
          <h2 className="relative mt-3 max-w-sm text-lg leading-snug font-semibold tracking-tight sm:text-xl">
            你遇到的 <span className="text-primary">95%</span>{' '}
            的问题，在这里能找到答案。
          </h2>
          <span className="relative mt-auto inline-flex items-center gap-2 pt-3 text-xs font-medium sm:text-sm">
            查看常见问题
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>
    </div>
  );
}
