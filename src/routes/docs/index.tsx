import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Sparkles } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { baseLocale, localizeUrl } from '@/paraglide/runtime.js';
import { docGroups } from '@/content/docs/registry';

const PAGE_TITLE = 'MediaClaw 使用文档';
const PAGE_DESCRIPTION =
  '从安装和采集开始，用插件或 Agent 完成内容研究与创作，并把原始数据、分析结果和稿件沉淀为可持续复用的内容资产。';

export const Route = createFileRoute('/docs/')({
  head: () => {
    const canonicalUrl = localizeUrl(`${envConfigs.app_url}/docs`, {
      locale: baseLocale,
    }).href;
    return {
      meta: [
        { title: `${PAGE_TITLE} | ${envConfigs.app_name}` },
        { name: 'description', content: PAGE_DESCRIPTION },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', hrefLang: baseLocale, href: canonicalUrl },
        { rel: 'alternate', hrefLang: 'x-default', href: canonicalUrl },
      ],
    };
  },
  component: DocsHomePage,
});

const capabilityLadder = [
  { label: '下载', desc: '保存无水印原始素材' },
  { label: '结构化采集', desc: '笔记、视频、评论、逐字稿批量入库' },
  { label: '判断', desc: '筛选低粉爆款、识别高意向线索' },
  { label: '洞察', desc: '账号研究、爆款拆解、趋势判断' },
  { label: '创作与复用', desc: '用插件或 Agent 创作，把结果写回资产' },
];

const identityCards = [
  {
    title: '博主 / OPC',
    desc: '一个人跑通从选题到发布的完整内容生产线。',
    href: '/docs/getting-started/first-draft',
  },
  {
    title: '品牌 / 企业',
    desc: '在内容生产主线之上，额外覆盖舆情监测与线索获取。',
    href: '/docs/reuse/content-assets',
  },
];

const goalShortcuts = [
  { label: '采集内容', href: '/docs/collect/single-post' },
  { label: '找选题', href: '/docs/topics/keyword-trends' },
  { label: '找对标', href: '/docs/benchmark/find-accounts' },
  { label: '拆爆款', href: '/docs/viral-research/single-post-breakdown' },
  { label: '内容创作', href: '/docs/create/overview' },
  { label: '接入 Agent', href: '/docs/create/agent-workflow' },
  { label: '管理资产', href: '/docs/reuse/content-assets' },
  { label: '获客', href: '/docs/brand/leads' },
  { label: '舆情', href: '/docs/brand/sentiment' },
];

const mainLineGroup = docGroups.find(
  (group) => group.id === 'content-workflow'
);
const mainLineSteps = (mainLineGroup?.subgroups ?? [])
  .slice()
  .sort((a, b) => a.step - b.step);

function DocsHomePage() {
  return (
    <div className="flex flex-col gap-14">
      {/* 1. 一句话定位 */}
      <section>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
          {PAGE_TITLE}
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
          {PAGE_DESCRIPTION}
        </p>
        <Link
          href="/docs/getting-started/first-draft"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          10 分钟从采集到初稿
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* 2. 能力阶梯 */}
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold tracking-tight">
          能力阶梯
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {capabilityLadder.map((item) => (
            <div
              key={item.label}
              className="border-border rounded-lg border p-3"
            >
              <p className="text-foreground text-sm font-medium">
                {item.label}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 内容研究与创作 */}
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold tracking-tight">
          内容研究与创作
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mainLineSteps.map((step) => {
            const firstItem = step.items[0];
            return (
              <Link
                key={step.id}
                href={firstItem ? `/docs/${firstItem.slug}` : '/docs'}
                className="border-border hover:border-primary/40 hover:bg-muted/50 rounded-lg border p-4 transition-colors"
              >
                <p className="text-foreground text-sm font-medium">
                  {step.label}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. 两类身份提示 */}
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold tracking-tight">
          从你的身份开始
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {identityCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="border-border hover:border-primary/40 hover:bg-muted/50 rounded-lg border p-4 transition-colors"
            >
              <p className="text-foreground text-sm font-medium">
                {card.title}
              </p>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. 按目的直达 */}
      <section>
        <h2 className="text-foreground mb-4 text-lg font-semibold tracking-tight">
          按目的直达
        </h2>
        <div className="flex flex-wrap gap-2">
          {goalShortcuts.map((goal) => (
            <Link
              key={goal.href}
              href={goal.href}
              className="border-border hover:border-primary/40 hover:bg-muted/50 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            >
              {goal.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="border-border bg-muted/30 rounded-lg border p-5">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold">
          <Sparkles className="size-3.5" />
          跨平台教程
        </p>
        <p className="text-foreground mt-2 text-sm leading-6">
          功能入口和操作流程保持一致。涉及平台页面的教程会提供小红书与抖音示例切换，不重复拆成两套目录。
        </p>
      </section>
    </div>
  );
}
