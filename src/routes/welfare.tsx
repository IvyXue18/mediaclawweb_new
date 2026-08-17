import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  ExternalLink,
  HandCoins,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Wifi,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { apiGet, apiPost } from '@/lib/api-client';
import { getBrowserInstallId } from '@/lib/browser-install-id';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import {
  researchExampleLinks,
  type ResearchEntryConfig,
} from '@/lib/research-entry-config';
import { baseLocale, getLocale, localizeUrl } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Button } from '@/components/ui/button';
import zhFeishuPage from '@/content/legacy-pages/zh/features/feishu-integration.json';

type StarterStatus = {
  eligible: boolean;
  reason:
    | ''
    | 'has_free_trial'
    | 'has_paid_trial'
    | 'has_pending_order'
    | 'browser_already_used';
  pendingOrder: {
    orderNo: string;
    status: string;
    checkoutUrl: string | null;
  } | null;
  paidTrial: { code: string; expiresAt: string | null; active: boolean } | null;
  surveyCompleted: boolean;
};
type StarterProduct = {
  enabled?: boolean;
  priceInCents: number;
  durationDays: number;
  credits: number;
  currency: string;
  surveyEnabled?: boolean;
  surveyBonusDays?: number;
};
type SceneLinkKey =
  | 'feishuTemplate'
  | 'accountAnalysisExample'
  | 'noteBreakdownExample';
type ExperiencePoint = {
  text: string;
  linkKey?: SceneLinkKey;
  linkLabel?: string;
  inlineLink?: boolean;
};

const feishuTemplateUrl =
  zhFeishuPage.page.sections.hero.buttons.find(
    (button) => button.title === '获取飞书模板'
  )?.url || '';

const experienceScenes: Array<{
  eyebrow: string;
  title: string;
  description: string;
  points: ExperiencePoint[];
  image: string;
  imageAlt: string;
  imagePosition: string;
  imageFit?: string;
}> = [
  {
    eyebrow: '先把内容拿回来',
    title: '无限量采集/下载',
    description:
      '先解决最直接的需求：把小红书、抖音上想要的数据和素材快速收集到一起。',
    points: [
      {
        text: '批量采集笔记、视频、账号主页和评论，自动补全正文、标签与互动数据',
      },
      {
        text: '按粉丝数和互动表现筛选低粉爆款，快速建立自己的内容样本库',
      },
      { text: '下载无水印视频和图片，提取视频逐字稿与图片文案' },
      {
        text: '导出 Excel / Markdown，或一键同步到',
        linkKey: 'feishuTemplate',
        linkLabel: '飞书多维表格 AI 模板',
        inlineLink: true,
      },
    ],
    image: '/imgs/features/1-v20260424.webp',
    imageAlt: 'MediaClaw 在小红书搜索页批量采集笔记与评论',
    imagePosition: 'object-right',
  },
  {
    eyebrow: '再把数据用起来',
    title: '采集只是第一步，把数据变成选题和成稿',
    description:
      '不用停在表格和素材文件夹里，MediaClaw 还能继续帮你分析、拆解和创作。',
    points: [
      {
        text: '批量分析自己或对标账号的真实作品，提炼高表现选题、标题公式和内容结构',
        linkKey: 'accountAnalysisExample',
        linkLabel: '查看示例',
      },
      {
        text: '拆解单篇爆款为什么有效，结合评论反馈生成 9 个由近及远的新选题',
        linkKey: 'noteBreakdownExample',
        linkLabel: '查看示例',
      },
      {
        text: '从一个关键词分析近半年内容趋势，拓展长尾词，看见真实搜索需求',
      },
      { text: '沉淀可复用的账号风格，辅助生成自己的图文稿和视频脚本' },
    ],
    image: '/imgs/features/content-analysis-workflow-v20260719.png',
    imageAlt: 'MediaClaw 将账号分析结果沉淀为选题库和内容创作工作流',
    imagePosition: 'object-center',
    imageFit: 'object-contain bg-white',
  },
  {
    eyebrow: '最后持续盯机会',
    title: '不用每天刷账号，也能及时发现爆款和线索',
    description: '让高价值账号、潜在爆款和评论线索持续进入同一套跟进流程。',
    points: [
      { text: '监控对标账号更新和潜在爆款，自动生成飞书日报' },
      { text: '批量采集评论，通过关键词和 IP 属地筛选高意向客资' },
      { text: '批量获取达人主页和内容表现，辅助种草、投放与合作前调研' },
      { text: '沉淀监控历史与命中内容，方便做周报、复盘和后续跟进' },
    ],
    image: '/imgs/features/10-v20260425.webp',
    imageAlt: 'MediaClaw 对标账号监控报告与飞书内容日报',
    imagePosition: 'object-center',
  },
];

const unlimitedCapabilities = [
  '笔记采集',
  '评论采集',
  '详情补全',
  '导出数据',
  '同步飞书',
];

export const Route = createFileRoute('/welfare')({
  loader: () => ({ locale: getLocale() }),
  head: ({ loaderData }) => {
    const locale = loaderData?.locale ?? baseLocale;
    const canonicalUrl = localizeUrl(`${envConfigs.app_url}/welfare`, {
      locale: baseLocale,
    }).href;
    return {
      meta: [
        { title: '全能卡 - MediaClaw 福利中心' },
        {
          name: 'description',
          content: '付费全能体验卡，包含会员时长、AI 积分和首次订阅抵扣。',
        },
        ...(locale !== baseLocale
          ? [{ name: 'robots', content: 'noindex,follow' }]
          : []),
      ],
      links: [
        { rel: 'canonical', href: canonicalUrl },
        { rel: 'alternate', hrefLang: baseLocale, href: canonicalUrl },
        { rel: 'alternate', hrefLang: 'x-default', href: canonicalUrl },
      ],
    };
  },
  component: WelfarePage,
});

function WelfarePage() {
  const { data: session, isPending } = useSession();
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<StarterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [browserInstallId, setBrowserInstallId] = useState('');
  const [researchEntryConfig, setResearchEntryConfig] =
    useState<ResearchEntryConfig | null>(null);
  const [product, setProduct] = useState<StarterProduct>({
    priceInCents: 900,
    durationDays: 5,
    credits: 50,
    currency: 'cny',
  });

  useEffect(() => {
    setHydrated(true);
    setBrowserInstallId(getBrowserInstallId());
    recordAnalyticsEventSafe('trial_card_view', { source: 'welfare' });
    void Promise.all([
      apiGet<StarterProduct>('/api/starter/product')
        .then(setProduct)
        .catch(() => {}),
      apiGet<ResearchEntryConfig>('/api/research-entry-config')
        .then(setResearchEntryConfig)
        .catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    if (!session?.user || !browserInstallId) return;
    void apiGet<StarterStatus>(
      `/api/starter/status?browser_install_id=${encodeURIComponent(browserInstallId)}`
    )
      .then(setStatus)
      .catch(() => {});
  }, [browserInstallId, session?.user]);

  async function purchase() {
    if (!session?.user) {
      window.location.href = `/sign-in?callbackUrl=${encodeURIComponent('/welfare')}`;
      return;
    }
    setLoading(true);
    try {
      const result = await apiPost<{ checkout_url?: string }>(
        '/api/payment/checkout',
        {
          product_id: 'trial-starter',
          redirect: '/welfare/claim',
          metadata: { source: 'welfare' },
          browser_install_id: browserInstallId || getBrowserInstallId(),
        }
      );
      if (result.checkout_url) window.location.href = result.checkout_url;
    } catch (error: any) {
      toast.error(error?.message || '暂时无法发起支付，请稍后重试');
      const installId = browserInstallId || getBrowserInstallId();
      void apiGet<StarterStatus>(
        `/api/starter/status?browser_install_id=${encodeURIComponent(installId)}`
      )
        .then(setStatus)
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  }

  const publicConfig = usePublicConfig().data;
  const parsedReferralRate = Number.parseInt(
    publicConfig?.referral_first_order_rate ?? '',
    10
  );
  const referralRate =
    Number.isFinite(parsedReferralRate) && parsedReferralRate > 0
      ? parsedReferralRate
      : 20;
  const parsedInviteeDiscount = Number.parseInt(
    publicConfig?.referral_invitee_discount ?? '',
    10
  );
  const inviteeDiscount =
    Number.isFinite(parsedInviteeDiscount) && parsedInviteeDiscount > 0
      ? parsedInviteeDiscount
      : 10;
  const referralEnabled = publicConfig?.referral_enabled !== 'false';

  const action = getAction(status, !hydrated || isPending, product);
  const sceneLinks: Record<SceneLinkKey, string> = {
    feishuTemplate: feishuTemplateUrl,
    ...researchExampleLinks(researchEntryConfig),
  };

  function claimCta(className: string) {
    if (action.kind === 'link') {
      return (
        <Link href={action.href} className={className}>
          {action.label}
          <ArrowRight className="ml-2 size-4" />
        </Link>
      );
    }

    return (
      <Button
        className={className}
        onClick={purchase}
        disabled={loading || product.enabled === false}
      >
        {loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
        {action.label}
        {!loading && product.enabled !== false ? (
          <ArrowRight className="ml-2 size-4" />
        ) : null}
      </Button>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-12 md:pt-32 md:pb-20">
        <section className="border-primary/25 bg-card overflow-hidden rounded-[2rem] border shadow-[0_30px_90px_-45px_oklch(var(--primary)/0.55)]">
          <div className="relative overflow-hidden px-6 py-8 sm:px-9 md:px-12 md:py-12">
            <div className="bg-primary/10 absolute -top-32 -right-28 size-80 rounded-full blur-3xl" />
            <div className="bg-primary/5 absolute -bottom-36 -left-28 size-72 rounded-full blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
              <div>
                <span className="border-primary/20 bg-primary/8 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold">
                  <Sparkles className="size-4" />
                  同一账号限购 1 次
                </span>
                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                  {product.priceInCents / 100} 元全能卡
                </h1>
                <p className="text-muted-foreground mt-3 text-lg font-medium sm:text-xl">
                  {product.durationDays} 天会员 + {product.credits} 积分
                </p>

                <div className="mt-8 grid max-w-xl grid-cols-[4px_minmax(0,1fr)] gap-4">
                  <span className="from-primary/35 via-primary to-primary/35 block rounded-full bg-gradient-to-b" />
                  <p className="py-1 text-lg font-black tracking-tight sm:text-xl">
                    如果觉得好用，有效期内升级订阅，已付{' '}
                    {product.priceInCents / 100} 元
                    <span className="text-primary">全额抵扣</span>
                  </p>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[380px] lg:mx-0">
                <div className="absolute -inset-10 bg-[radial-gradient(closest-side,rgba(251,191,36,0.25),transparent_70%)] blur-2xl" />

                <div className="relative aspect-[8/5] -rotate-2 overflow-hidden rounded-2xl border border-amber-200/25 bg-[linear-gradient(135deg,#2a2a2e_0%,#0b0b0d_50%,#231c0e_100%)] shadow-[0_35px_70px_-25px_rgba(0,0,0,0.75)] transition-transform duration-500 ease-out hover:scale-[1.02] hover:rotate-0">
                  <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_90%_-10%,rgba(251,191,36,0.2),transparent_55%)]" />
                  <div className="absolute top-[-60%] left-[14%] h-[220%] w-24 rotate-[24deg] bg-white/5" />
                  <div className="absolute -right-14 -bottom-24 size-60 rounded-full border border-amber-200/10" />
                  <div className="absolute -right-24 -bottom-14 size-60 rounded-full border border-amber-200/10" />

                  <div className="relative flex h-full flex-col justify-between p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black tracking-widest text-white/90">
                        MediaClaw
                      </span>
                      <Wifi className="size-5 rotate-90 text-amber-200/70" />
                    </div>

                    <div className="relative h-8 w-11 overflow-hidden rounded-md border border-amber-100/40 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-black/25" />
                    </div>

                    <div>
                      <p className="bg-gradient-to-r from-amber-100 via-yellow-300 to-amber-400 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                        全能卡
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold tracking-[0.4em] text-amber-200/60">
                        ALL-IN-ONE PASS
                      </p>
                    </div>

                    <div className="flex items-end justify-between">
                      <p className="text-sm font-semibold tracking-wide text-white/80">
                        {product.durationDays} 天会员 · {product.credits} 积分
                      </p>
                      <p className="bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-3xl leading-none font-black text-transparent">
                        <span className="mr-0.5 align-top text-base">¥</span>
                        {product.priceInCents / 100}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-7">
                  {claimCta(
                    'inline-flex h-12 w-full items-center justify-center rounded-md bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-4 text-base font-black text-zinc-950 shadow-[0_14px_30px_-12px_rgba(251,191,36,0.65)] hover:from-amber-200 hover:via-yellow-300 hover:to-amber-400'
                  )}
                  <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
                    <ShieldCheck className="text-primary size-3.5 shrink-0" />
                    一次性购买，到期结束，不自动续费
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-border/70 border-t px-6 py-12 sm:px-9 md:px-12 md:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-primary text-sm font-black tracking-[0.2em]">
                5 天内全能卡可以体验到
              </span>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                从采集下载，到分析创作，再到持续增长
              </h2>
              <p className="text-muted-foreground mt-4 text-base leading-7 md:text-lg">
                先满足眼前最需要的采集和下载，再把拿到的数据变成下一条内容和下一个机会。
              </p>
            </div>

            <div className="mt-12 space-y-10 md:mt-16 md:space-y-16">
              {experienceScenes.map((scene, index) => (
                <article
                  className="grid items-center gap-7 lg:grid-cols-2 lg:gap-12"
                  key={scene.title}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : undefined}>
                    <div className="text-primary flex items-center gap-3 text-sm font-black tracking-[0.12em]">
                      <span className="border-primary/25 bg-primary/8 flex size-9 items-center justify-center rounded-full border tracking-normal">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {scene.eyebrow}
                    </div>
                    <h3 className="mt-5 text-2xl font-black tracking-tight md:text-3xl">
                      {scene.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 leading-7">
                      {scene.description}
                    </p>
                    <ul className="mt-6 space-y-3.5">
                      {scene.points.map((point: ExperiencePoint) => (
                        <li className="flex gap-3 leading-7" key={point.text}>
                          <Check className="text-primary mt-1 size-4 shrink-0" />
                          <span>
                            {point.text}
                            {point.linkKey && sceneLinks[point.linkKey] ? (
                              <a
                                href={sceneLinks[point.linkKey]}
                                target="_blank"
                                rel="noreferrer"
                                className={`text-primary inline-flex items-center gap-0.5 font-bold whitespace-nowrap underline decoration-current/35 underline-offset-4 hover:decoration-current ${
                                  point.inlineLink ? '' : 'ml-2'
                                }`}
                              >
                                {point.linkLabel}
                                <ExternalLink className="size-3.5" />
                              </a>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-7">
                      {claimCta(
                        'border-primary/30 text-primary hover:bg-primary/8 inline-flex h-10 items-center justify-center rounded-full border bg-transparent px-5 text-sm font-black'
                      )}
                    </div>
                  </div>

                  <div
                    className={`border-border/80 bg-muted/40 overflow-hidden rounded-3xl border p-2 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] ${
                      index % 2 === 1 ? 'lg:order-1' : ''
                    }`}
                  >
                    <div className="border-border/60 bg-background flex items-center gap-1.5 rounded-t-[1.15rem] border border-b-0 px-4 py-3">
                      <span className="size-2.5 rounded-full bg-rose-400/70" />
                      <span className="size-2.5 rounded-full bg-amber-400/70" />
                      <span className="size-2.5 rounded-full bg-emerald-400/70" />
                      <span className="text-muted-foreground ml-2 text-xs font-medium">
                        MediaClaw 工作流
                      </span>
                    </div>
                    <img
                      src={scene.image}
                      alt={scene.imageAlt}
                      loading="lazy"
                      className={`border-border/60 aspect-[4/3] w-full rounded-b-[1.15rem] border ${scene.imageFit ?? 'object-cover'} ${scene.imagePosition}`}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="border-primary/20 bg-primary/6 mt-12 rounded-3xl border p-6 md:mt-16 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-black tracking-[0.12em]">
                    体验期间不限量
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    基础采集和同步不消耗积分，放心跑完整个工作流。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {unlimitedCapabilities.map((capability) => (
                    <span
                      className="border-primary/15 bg-background inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold shadow-sm"
                      key={capability}
                    >
                      <Check className="text-primary size-3.5" />
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 md:mt-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-primary text-sm font-black tracking-[0.2em]">
              更多福利
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
              全能卡之外，还能再多拿一点
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {(
              [
                ...(product.surveyEnabled !== false
                  ? [
                      {
                        icon: ClipboardCheck,
                        title: '渠道问卷',
                        badge: `+${product.surveyBonusDays ?? 2} 天会员`,
                        description: `完成全能卡支付后的 30 秒渠道问卷，额外增加 ${product.surveyBonusDays ?? 2} 天会员时长，自动叠加到账。`,
                        hint: '支付成功后自动进入问卷',
                      },
                    ]
                  : []),
                {
                  icon: MessageSquareText,
                  title: '使用体验反馈',
                  badge: '额外奖励',
                  description:
                    '真实体验采集、导出同步或监控等功能后，在插件内提交使用反馈，即可领取额外奖励。',
                  hint: '在插件福利中心提交',
                },
                ...(referralEnabled
                  ? [
                      {
                        icon: HandCoins,
                        title: '佣金推荐',
                        badge: `${referralRate}% 返佣`,
                        description: `邀请朋友使用 MediaClaw：朋友首购享 ${inviteeDiscount}% 优惠，你拿首单和续费 ${referralRate}% 返佣，满额即可提现。`,
                        hint: '了解伙伴计划',
                        href: '/referral',
                      },
                    ]
                  : []),
              ] as const
            ).map((benefit) => (
              <div
                className="border-border/80 bg-card flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md"
                key={benefit.title}
              >
                <div className="flex items-center justify-between">
                  <span className="border-primary/20 bg-primary/8 text-primary flex size-11 items-center justify-center rounded-xl border">
                    <benefit.icon className="size-5" />
                  </span>
                  <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-black">
                    {benefit.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-black tracking-tight">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground mt-2 flex-1 text-sm leading-6">
                  {benefit.description}
                </p>
                {'href' in benefit ? (
                  <Link
                    href={benefit.href}
                    className="text-primary mt-4 inline-flex items-center gap-1 text-xs font-black underline-offset-4 hover:underline"
                  >
                    {benefit.hint}
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : (
                  <p className="text-muted-foreground/80 mt-4 flex items-center gap-1.5 text-xs font-semibold">
                    <Check className="text-primary size-3.5 shrink-0" />
                    {benefit.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function getAction(
  status: StarterStatus | null,
  pending: boolean,
  product: StarterProduct
) {
  if (product.enabled === false) {
    return { kind: 'buy' as const, label: '暂未开放' };
  }
  if (pending) return { kind: 'buy' as const, label: '加载中…' };
  if (!status)
    return {
      kind: 'buy' as const,
      label: '立即领取',
    };
  if (status.paidTrial) {
    if (
      product.surveyEnabled !== false &&
      !status.surveyCompleted &&
      status.paidTrial.active
    )
      return {
        kind: 'link' as const,
        label: `补填问卷 +${product.surveyBonusDays ?? 2} 天`,
        href: '/welfare/claim',
      };
    return {
      kind: 'link' as const,
      label: '已领取，查看激活码',
      href: '/welfare/claim',
    };
  }
  if (status.reason === 'has_free_trial')
    return {
      kind: 'link' as const,
      label: '你已体验过试用，直接订阅',
      href: '/pricing',
    };
  if (status.reason === 'browser_already_used')
    return {
      kind: 'link' as const,
      label: '当前浏览器已领取过，直接订阅',
      href: '/pricing',
    };
  if (status.reason === 'has_pending_order') {
    if (status.pendingOrder?.status === 'paid') {
      return {
        kind: 'link' as const,
        label: '支付成功，查看领取结果',
        href: `/welfare/claim?order_no=${encodeURIComponent(status.pendingOrder.orderNo)}`,
      };
    }
    return { kind: 'buy' as const, label: '继续支付' };
  }
  return {
    kind: 'buy' as const,
    label: '立即领取',
  };
}
