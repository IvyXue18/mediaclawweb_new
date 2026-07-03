import { useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Database,
  Download,
  Grid2X2,
  Languages,
  MessageCircle,
  Moon,
  Play,
  Radar,
  Rocket,
  Search,
  Sparkles,
  Table2,
  TrendingUp,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';

type FeatureCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  alt: string;
  href?: string;
};

type PricingPlan = {
  title: string;
  description: string;
  price: string;
  unit?: string;
  label?: string;
  featured?: boolean;
  features: string[];
  button: string;
  href: string;
};

const platforms: FeatureCard[] = [
  {
    title: '小红书能力集',
    description:
      '笔记采集 · 评论采集 · 客资采集 · 赛道策略 · 找对标账号 · 竞品监控 · 去水印下载',
    icon: BookOpen,
    image: '/imgs/features/platform-xiaohongshu.webp',
    alt: 'MediaClaw 小红书爆款笔记数据采集与运营增强插件功能概览',
    href: '/xiaohongshu/scraper',
  },
  {
    title: '抖音能力集',
    description:
      '视频采集 · 评论采集 · 搜索采集 · 赛道策略 · 找对标账号 · 竞品监控',
    icon: Clapperboard,
    image: '/imgs/features/platform-douyin.webp',
    alt: 'MediaClaw 抖音爆款短视频数据提取与客资获取插件概览',
    href: '/douyin/scraper',
  },
];

const scenarios: FeatureCard[] = [
  {
    title: '运营：竞品内容分析',
    description:
      '每周一早上，运营要整理竞品爆款周报。现在先用赛道策略找出反复出现的对标账号，再用关键词搜索采集本周高互动内容，同步飞书后直接进入周报复盘。',
    icon: Users,
    image: '/imgs/features/7-v20260309.webp',
    alt: '内容运营使用 MediaClaw 根据点赞量、收藏量、评论量批量获取小红书竞品爆款笔记生成周报',
  },
  {
    title: 'MCN：博主质量评估',
    description:
      '签约前要评估 50 个博主，逐个翻主页算互动率太慢。用博主主页采集批量抓取历史内容，导出飞书做横向评估，投放决策从 2 天缩到 2 小时。',
    icon: Rocket,
    image: '/imgs/features/2-v20260309.webp',
    alt: 'MCN 机构利用 MediaClaw 批量评估小红书和抖音博主质量',
  },
  {
    title: '创作者：爆款内容拆解',
    description:
      '发了 20 篇还是没爆，不知道该继续打主词还是换方向。先跑赛道机会判断，再分析长尾需求和低粉爆款样本，下一篇不靠灵感硬猜。',
    icon: Sparkles,
    image: '/imgs/features/3-v20260309.webp',
    alt: '自媒体创作者利用 MediaClaw 抓取工具拆解同赛道高赞爆文提炼流量选题结构',
  },
  {
    title: '分析师：行业趋势研究',
    description:
      '客户要一份趋势报告，数据全靠手动太不专业。用关键词搜索采集批量抓取高互动内容，再结合找对标账号和长尾需求分析，快速建立样本库。',
    icon: TrendingUp,
    image: '/imgs/features/4-v20260309.webp',
    alt: '通过 MediaClaw 围绕核心行业搜索词批量寻找同行对标笔记并拓展长尾选题',
  },
];

const capabilities: FeatureCard[] = [
  {
    title: '笔记/视频深度提取',
    description:
      '一键抓取标题、正文、互动数据、配图与视频信息，核心数据字段完整保留，便于后续分析复盘。',
    icon: Database,
    image: '/imgs/features/9-v20260424.webp',
    alt: '使用 MediaClaw 一键批量导出小红书笔记与抖音视频详细内容互动数据',
    href: '/xiaohongshu/scraper',
  },
  {
    title: '博主主页批量采集',
    description:
      '批量拉取博主资料与历史内容，自动翻页采集，帮助你快速完成账号横向评估。',
    icon: Users,
    image: '/imgs/features/2-v20260309.webp',
    alt: 'MediaClaw 博主主页全量历史内容自动化下拉收集与导出工具',
    href: '/xiaohongshu/scraper',
  },
  {
    title: '评论采集与客资挖掘',
    description:
      '批量采集评论数据并筛选高意向词，快速定位潜在客户线索与高价值讨论主题。',
    icon: MessageCircle,
    image: '/imgs/features/10-v20260424.webp',
    alt: '小红书与抖音评论采集下载工具及高意向潜在客户意向词自动筛选',
    href: '/xiaohongshu/comments',
  },
  {
    title: '赛道策略与关键词洞察',
    description:
      '在搜索页先判断主词机会，再自动发现对标账号，继续扩展长尾需求词并触发搜索结果采集。',
    icon: Search,
    image: '/imgs/features/11-v20260424.webp',
    alt: 'MediaClaw 赛道策略在搜索页判断内容机会、寻找对标账号并拓展长尾选题',
    href: '/xiaohongshu/keywords',
  },
  {
    title: '竞品监控与内容预警',
    description:
      '订阅对标账号动态，自动监控内容更新和互动变化，命中规则后即时提醒。',
    icon: Radar,
    image: '/imgs/features/12-v20260424.webp',
    alt: '小红书与抖音竞争对手账号最新内容动态追踪与爆款内容自动化提醒设置',
    href: '/xiaohongshu/monitoring',
  },
  {
    title: '无水印素材下载',
    description:
      '支持图文与视频素材批量下载，方便后续做内容拆解、素材沉淀与复用。',
    icon: Download,
    image: '/imgs/features/13-v20260424.webp',
    alt: '小红书优质图文与超清短视频素材高清无水印一键批量下载器',
    href: '/xiaohongshu/downloader',
  },
  {
    title: '采集增强与诊断追踪',
    description:
      '基础采集后可继续补采详情、账号指标、评论和客资；同步失败时可复制脱敏诊断信息定位具体阶段。',
    icon: Activity,
    image: '/imgs/features/1-v20260424.webp',
    alt: 'MediaClaw 执行历史与复制诊断信息帮助定位采集数量不足、评论漏采和飞书同步失败',
    href: '/updates',
  },
  {
    title: '飞书多维表同步与协作',
    description:
      '采集结果一键同步飞书多维表，团队成员实时共享，减少手工搬运与对齐成本。',
    icon: Table2,
    image: '/imgs/features/14-v20260424.webp',
    alt: 'MediaClaw 支持一键将获取的小红书抖音详细数据同步向飞书多维表格实现团队在线云协作',
    href: '/features/feishu-integration',
  },
];

const pricingGroups = [
  { key: 'month', label: '月付', hint: '灵活' },
  { key: 'quarter', label: '季付' },
  { key: 'year', label: '年付', hint: '立省30%' },
  { key: 'credits', label: '积分包' },
] as const;

const pricing: Record<(typeof pricingGroups)[number]['key'], PricingPlan[]> = {
  month: [
    {
      title: '免费版',
      description: '个人用户，零门槛开始采集',
      price: '¥0',
      unit: '/ 月',
      button: '免费安装插件',
      href: '/download',
      features: [
        '批量采集小红书爆款笔记 / 对标账号主页笔记 / 行业关键词笔记',
        '本地数据存储',
        '无水印视频、图片下载',
        '无限制导出 CSV / XLSX',
        '单浏览器设备使用',
      ],
    },
    {
      title: '个人版',
      description: '内容运营 / 个人创作者的效率加速器',
      price: '¥49',
      unit: '/ 月',
      label: '最受欢迎',
      featured: true,
      button: '选择购买',
      href: '/pricing',
      features: [
        '包含免费版全部功能',
        '批量采集笔记评论',
        '含 180 积分，可用于对标账号监控和插件内 AI 能力',
        '数据同步飞书多维表格',
        '飞书多维表格 AI 分析模板',
      ],
    },
    {
      title: '团队版',
      description: 'MCN / 品牌团队，多人协作无上限',
      price: '¥129',
      unit: '/ 月',
      button: '选择购买',
      href: '/pricing',
      features: [
        '包含免费版全部功能',
        '含 700 积分',
        '监控约 5 个小红书对标账号持续 30 天',
        '数据同步飞书多维表格',
        '支持 3 个浏览器设备同时使用',
      ],
    },
  ],
  quarter: [
    {
      title: '个人版',
      description: '季度套餐，适合稳定内容产出',
      price: '¥118',
      unit: '/ 季',
      label: '推荐',
      featured: true,
      button: '选择购买',
      href: '/pricing',
      features: [
        '含 600 积分',
        '单浏览器设备使用',
        '飞书同步与 AI 模板',
        '适合个人创作者和单人运营',
      ],
    },
    {
      title: '团队版',
      description: '季度团队协作套餐',
      price: '¥318',
      unit: '/ 季',
      button: '选择购买',
      href: '/pricing',
      features: [
        '含 2000 积分',
        '3 个浏览器设备',
        '团队飞书协作',
        '适合代运营和小型团队',
      ],
    },
  ],
  year: [
    {
      title: '个人版',
      description: '年付立省 ¥189',
      price: '¥399',
      unit: '/ 年',
      label: '推荐',
      featured: true,
      button: '选择购买',
      href: '/pricing',
      features: [
        '含 2500 积分',
        '长周期监控额度',
        '飞书同步与 AI 模板',
        '适合长期运营账号',
      ],
    },
    {
      title: '团队版',
      description: '年付立省 ¥460',
      price: '¥1088',
      unit: '/ 年',
      button: '选择购买',
      href: '/pricing',
      features: [
        '含 9000 积分',
        '3 个浏览器设备',
        '更长监控周期',
        '适合 MCN 和品牌团队',
      ],
    },
  ],
  credits: [
    {
      title: '紧急补量积分包',
      description: '适合临时加监控额度，活动冲刺期',
      price: '¥29',
      label: '最受欢迎',
      featured: true,
      button: '购买积分',
      href: '/pricing',
      features: [
        '1000 积分',
        '可用于对标账号监控和插件内 AI 能力',
        '需在插件有效期内使用',
      ],
    },
    {
      title: '创作者常用包',
      description: '适合个人自媒体创作者、单人运营',
      price: '¥79',
      button: '购买积分',
      href: '/pricing',
      features: ['3000 积分', '适合持续内容拆解', '需在插件有效期内使用'],
    },
    {
      title: '多内容线团队包',
      description: '适合小团队、代运营、MCN',
      price: '¥360',
      label: '高容量',
      button: '购买积分',
      href: '/pricing',
      features: ['15000 积分', '支持多内容线监控', '需在插件有效期内使用'],
    },
  ],
};

const testimonials = [
  [
    'Dayou',
    'MCN团队运营',
    '我平时是做内容流量的，之前靠扣子工作流蛮多人在小红书抖音推，你这个产品比之前的好用太多了。',
  ],
  ['liberté', '文旅自媒体操盘手', '我试了好方便！比以前配置容易很多。'],
  ['诗诗', '副业-营养师', '太好用了！我已经夸了一上午了哈哈哈哈。'],
  [
    '木一',
    '教培行业自媒体矩阵运营',
    '哇这个好好用啊，正是我需要的！感觉快成功了哈哈哈',
  ],
  ['Jane', '新媒体从业者', '真的很好上手哎！现在的功能挺不错，用得好爽。'],
  ['ZSJ', '品牌运营', '用上了挺好的，怎么续费。'],
];

const faqs = [
  [
    '使用 MediaClaw 采集数据，平台会检测到吗？',
    'MediaClaw 做的事，本质上和你手动刷小红书一样：打开页面、向下滚动、记录看到的内容。我们故意加入随机延迟，让采集节奏更接近真实浏览。',
  ],
  [
    '我不懂技术，上手难吗？',
    '不需要技术背景。安装插件后打开小红书或抖音，侧边栏会根据当前页面显示对应操作，点击开始采集后等待进度完成即可。',
  ],
  [
    '采集的数据存储在哪里？',
    '默认存储在 Chrome 浏览器本地，不会主动上传到第三方服务器。只有你选择同步飞书时，数据才会发送到你的私人飞书多维表格。',
  ],
  [
    '目前支持哪些平台？',
    '当前已支持小红书与抖音，覆盖笔记/视频采集、评论客资、赛道机会判断、找对标账号、关键词洞察与竞品监控等能力。',
  ],
  [
    'MediaClaw 可以免费使用吗？',
    '可以。核心采集功能永久免费，付费版主要解锁账号监控、团队协作、赛道判断、找对标账号和插件内 AI 能力。',
  ],
];

export function LegacyHome() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [activePricing, setActivePricing] =
    useState<(typeof pricingGroups)[number]['key']>('month');
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <LegacyHeader />
      <main>
        <HeroSection onPlay={() => setVideoOpen(true)} />
        <PlatformSection />
        <ScenarioSection
          activeScenario={activeScenario}
          onChange={setActiveScenario}
        />
        <CapabilitiesSection />
        <PricingSection active={activePricing} onChange={setActivePricing} />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection onPlay={() => setVideoOpen(true)} />
      </main>
      <LegacyFooter />
      {videoOpen ? <VideoDialog onClose={() => setVideoOpen(false)} /> : null}
    </div>
  );
}

function LegacyHeader() {
  const nav = [
    { label: '核心功能', href: '#features', icon: Grid2X2, hasMenu: true },
    { label: '资源', href: '/blog', icon: BarChart3, hasMenu: true },
    { label: '下载', href: '/download', icon: Download },
    { label: '更新', href: '/updates', icon: Activity },
    { label: '定价', href: '/pricing', icon: CreditCard },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f8fafc]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <img src="/logo.png" alt="" className="size-9 rounded-xl shadow-sm" />
          <span className="text-lg">MediaClaw</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {nav.map(({ label, href, icon: Icon, hasMenu }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              <Icon className="size-4 text-slate-500" />
              {label}
              {hasMenu ? <ChevronDown className="size-3" /> : null}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center border-l border-slate-200 text-slate-900 disabled:opacity-100"
            aria-label="Switch to dark mode"
            disabled
          >
            <Moon className="size-5" />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center text-slate-900 disabled:opacity-100"
            aria-label="Switch language"
            disabled
          >
            <Languages className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="relative isolate overflow-hidden">
      <GridBackdrop />
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 text-center sm:px-6 lg:pt-24">
        <Link
          href="#features"
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-pink-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-800 shadow-lg shadow-pink-950/10"
        >
          <span className="size-2 rounded-full bg-[#db3ca3]" />
          新增找对标账号与复制诊断信息
          <ChevronDown className="size-4 -rotate-90" />
        </Link>
        <h1 className="mx-auto max-w-5xl text-5xl leading-[0.98] font-black tracking-tight text-slate-950 sm:text-7xl lg:text-[86px]">
          小红书/抖音采集、赛道判断
          <br />
          与对标监控一套搞定
          <span className="mt-3 block text-[#db3ca3]">10倍提效</span>
        </h1>
        <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 font-semibold text-slate-500 sm:text-xl">
          覆盖小红书与抖音两大平台：笔记/视频采集、评论客资、赛道机会判断、找对标账号、长尾需求分析、竞品监控与飞书协同。重复工作交出去，让自己回归创作与增长。
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/download"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#db3ca3] px-8 text-base font-bold text-white shadow-xl shadow-pink-500/25 transition hover:-translate-y-0.5 hover:bg-[#c92f94]"
          >
            <Download className="size-5" />
            免费开始
            <ChevronDown className="size-4 -rotate-90" />
          </Link>
          <button
            type="button"
            onClick={onPlay}
            className="inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-8 text-base font-bold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:border-slate-400"
          >
            <Play className="size-5" />
            观看演示
          </button>
        </div>
        <div className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/15">
          <img
            src="/imgs/features/1-v20260424.webp"
            alt="MediaClaw 在小红书页面右侧弹出采集侧边栏，可一键提取笔记页、账号页、搜索页数据并进入数据池"
            className="w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function PlatformSection() {
  return (
    <section className="bg-slate-100/80 px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="双平台覆盖"
        title="一个插件，同时覆盖"
        description="不再分平台切换工具，统一采集、统一分析、统一协作。"
      />
      <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-2">
        {platforms.map((item) => (
          <FeatureTile key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function ScenarioSection({
  activeScenario,
  onChange,
}: {
  activeScenario: number;
  onChange: (index: number) => void;
}) {
  const item = scenarios[activeScenario];
  const Icon = item.icon;

  return (
    <section className="px-4 py-24 sm:px-6">
      <SectionHeading
        title="不同角色，都能快速落地"
        description="从内容运营到 MCN，再到创作者和分析师，都有可复用工作流。"
      />
      <div className="mx-auto mt-10 flex max-w-5xl flex-wrap justify-center gap-3">
        {scenarios.map((scenario, index) => (
          <button
            key={scenario.title}
            type="button"
            onClick={() => onChange(index)}
            className={cn(
              'rounded-xl px-5 py-3 text-sm font-bold transition',
              activeScenario === index
                ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/20'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:text-slate-950'
            )}
          >
            {scenario.title}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-12 grid max-w-6xl items-center gap-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
        <div>
          <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-pink-50 text-[#db3ca3]">
            <Icon className="size-6" />
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">
            {item.title}
          </h3>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {item.description}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={item.image}
            alt={item.alt}
            className="w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section
      id="features"
      className="bg-slate-950 px-4 py-24 text-white sm:px-6"
    >
      <SectionHeading
        title="核心能力与业务价值"
        description="把采集、赛道策略、对标发现、监控、协作和诊断追踪合并到一个工作流里。"
        dark
      />
      <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href || '#'}
              className="group overflow-hidden rounded-2xl bg-white/6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <Icon className="mb-4 size-6 text-[#f05bb8]" />
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PricingSection({
  active,
  onChange,
}: {
  active: (typeof pricingGroups)[number]['key'];
  onChange: (key: (typeof pricingGroups)[number]['key']) => void;
}) {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6">
      <SectionHeading
        title="选择方案"
        description="核心采集功能永久免费，按需升级解锁高级功能"
      />
      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3 rounded-2xl bg-slate-100 p-2">
        {pricingGroups.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onChange(group.key)}
            className={cn(
              'rounded-xl px-5 py-3 text-sm font-black transition',
              active === group.key
                ? 'bg-white text-slate-950 shadow'
                : 'text-slate-500 hover:text-slate-950'
            )}
          >
            {group.label}
            {group.hint ? (
              <span className="ml-2 rounded-full bg-pink-100 px-2 py-0.5 text-xs text-[#db3ca3]">
                {group.hint}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-3">
        {pricing[active].map((plan) => (
          <article
            key={plan.title}
            className={cn(
              'relative flex flex-col rounded-3xl border bg-white p-7 shadow-lg shadow-slate-950/5',
              plan.featured
                ? 'border-[#db3ca3] ring-4 ring-pink-100'
                : 'border-slate-200'
            )}
          >
            {plan.label ? (
              <div className="absolute -top-4 right-6 rounded-full bg-[#db3ca3] px-4 py-1 text-xs font-black text-white">
                {plan.label}
              </div>
            ) : null}
            <h3 className="text-2xl font-black">{plan.title}</h3>
            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
            <div className="mt-7 flex items-end gap-1">
              <span className="text-5xl font-black tracking-tight">
                {plan.price}
              </span>
              {plan.unit ? (
                <span className="pb-2 text-sm font-semibold text-slate-500">
                  {plan.unit}
                </span>
              ) : null}
            </div>
            <Link
              href={plan.href}
              className={cn(
                'mt-7 inline-flex h-12 items-center justify-center rounded-xl text-sm font-black transition',
                plan.featured
                  ? 'bg-[#db3ca3] text-white hover:bg-[#c92f94]'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              )}
            >
              {plan.button}
            </Link>
            <ul className="mt-7 space-y-3 text-sm leading-6 text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#db3ca3]" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-100/80 px-4 py-24 sm:px-6">
      <SectionHeading
        title="用户怎么说"
        description="来自真实用户的一线反馈。"
      />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map(([name, role, quote]) => (
          <figure
            key={name}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <blockquote className="text-base leading-7 text-slate-700">
              “{quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <img src="/logo.png" alt="" className="size-10 rounded-xl" />
              <div>
                <div className="font-black text-slate-950">{name}</div>
                <div className="text-sm text-slate-500">{role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="px-4 py-24 sm:px-6">
      <SectionHeading
        title="常见问题"
        description="你最关心的问题，这里一次说清。"
      />
      <div className="mx-auto mt-12 max-w-4xl divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6 shadow-lg shadow-slate-950/5">
        {faqs.map(([question, answer]) => (
          <details
            key={question}
            className="group py-6"
            open={question === faqs[0][0]}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-black text-slate-950">
              {question}
              <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-4 leading-7 text-slate-600">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ onPlay }: { onPlay: () => void }) {
  return (
    <section className="bg-slate-100 px-4 py-24 text-center sm:px-6">
      <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
        无论是谁，皆可提效
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
        免费安装 MediaClaw，先跑通你的第一套数据工作流。
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/download"
          className="inline-flex h-14 items-center gap-3 rounded-xl bg-[#db3ca3] px-8 font-black text-white shadow-lg shadow-pink-500/20"
        >
          <Download className="size-5" />
          免费安装插件
        </Link>
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex h-14 items-center gap-3 rounded-xl border border-slate-300 bg-white px-8 font-black text-slate-950 shadow-sm"
        >
          <Play className="size-5" />
          观看演示
        </button>
      </div>
    </section>
  );
}

function LegacyFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="size-9 rounded-xl" />
          <span className="font-black">MediaClaw</span>
        </div>
        <p className="text-sm text-slate-500">
          © 2026 MediaClaw. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FeatureTile({ item }: { item: FeatureCard }) {
  const Icon = item.icon;
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-pink-50 text-[#db3ca3]">
          <Icon className="size-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
          <p className="mt-2 text-slate-600">{item.description}</p>
        </div>
      </div>
      <img
        src={item.image}
        alt={item.alt}
        className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover"
      />
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-950/5 transition hover:-translate-y-1"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-950/5">
      {content}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  dark,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p
          className={cn(
            'mb-3 text-sm font-black',
            dark ? 'text-pink-300' : 'text-[#db3ca3]'
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-4xl font-black tracking-tight sm:text-5xl',
          dark ? 'text-white' : 'text-slate-950'
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'mt-5 text-lg leading-8',
          dark ? 'text-slate-300' : 'text-slate-600'
        )}
      >
        {description}
      </p>
    </div>
  );
}

function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:64px_64px]"
    />
  );
}

function VideoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-950 p-3 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-12 right-0 inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-950"
        >
          <X className="size-5" />
        </button>
        <video
          controls
          autoPlay
          className="aspect-video w-full rounded-2xl bg-black"
          src="https://media.mediaclaw.app/videos/mediaclaw-demo-20260424.mp4"
        />
      </div>
    </div>
  );
}
