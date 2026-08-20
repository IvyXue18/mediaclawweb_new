import type { PlatformHubContent } from '@/components/platform-hub/types';

export const zhXiaohongshuHub: PlatformHubContent = {
  locale: 'zh',
  platform: '小红书',
  platformSlug: 'xiaohongshu',
  metadata: {
    title: '小红书数据采集与内容分析工具｜MediaClaw',
    description:
      '用 MediaClaw 完成小红书账号分析、爆款分析、笔记与评论采集、视频逐字稿、图文文案提取、关键词洞察、对标账号监控和素材下载。',
    keywords:
      '小红书数据采集,小红书账号分析,小红书爆款分析,小红书运营工具,小红书评论采集,小红书视频下载',
  },
  breadcrumbs: { home: '首页', current: '小红书内容工作流' },
  hero: {
    eyebrow: '小红书内容工作流',
    title: '一站式完成小红书内容采集、分析和创作',
    titleHighlight: '小红书',
    mobileTitleLines: ['一站式完成', '小红书内容研究', '采集与分析'],
    description:
      '从关键词和爆款中找到值得研究的账号与内容，批量采集公开笔记、评论和素材，再把逐字稿、图文文案、账号规律和可写选题沉淀下来。',
    primaryAction: '我要使用',
    primaryHref: '/download',
    secondaryAction: '浏览全部功能',
    secondaryHref: '#all-features',
    microcopy: 'Chrome 插件 · 无需代码 · 支持本地导出与飞书同步',
  },
  scenes: [
    {
      id: 'research',
      eyebrow: '发现与判断',
      title: '找方向与研究样本',
      description:
        '从关键词、低粉爆款和对标账号切入，判断赛道、内容结构和可复制的增长信号。',
      icon: 'keywords',
      featureIds: ['keywords', 'viral-content-analysis', 'account-analysis'],
    },
    {
      id: 'collect',
      eyebrow: '数据与素材',
      title: '采集内容、评论与原始素材',
      description:
        '批量保存爆款笔记、互动数据、评论和无水印素材，为分析与内容复用准备完整样本。',
      icon: 'database',
      featureIds: ['scraper', 'comments', 'downloader'],
    },
    {
      id: 'extract',
      eyebrow: '提取与转化',
      title: '把素材变成可分析、可复用的文本',
      description:
        '从视频、图片和评论中提取逐字稿、图文文案与高意向线索，减少人工整理。',
      icon: 'sparkles',
      featureIds: ['image-text', 'transcript', 'leads'],
    },
    {
      id: 'automate',
      eyebrow: 'Agent 接入',
      title: '把重复步骤交给你常用的 Agent',
      description:
        '从 Codex 或 WorkBuddy 直接发起采集、分析与交付接力，把重复步骤交给你常用的 Agent 处理。',
      icon: 'bot',
      featureIds: ['codex-agent', 'workbuddy-agent'],
    },
    {
      id: 'monitor',
      eyebrow: '跟踪与协作',
      title: '持续跟踪对标账号并沉淀到团队空间',
      description:
        '定时发现竞品更新与异常信号，再通过飞书同步把数据、报告和内容资产留在团队工作流中。',
      icon: 'monitoring',
      featureIds: ['monitoring', 'feishu-integration'],
    },
  ],
  directorySection: {
    eyebrow: '全部功能',
    title: '小红书内容功能模块',
    description:
      '从采集、分析和内容提取，到 Agent 接入、账号监控与飞书协作，一套完成。',
  },
  features: [
    {
      id: 'keywords',
      title: '小红书关键词洞察',
      description: '挖掘下拉联想词，研究长尾需求，捕捉搜索流量。',
      href: '/xiaohongshu/keywords',
      icon: 'keywords',
    },
    {
      id: 'viral-content-analysis',
      title: '小红书爆款笔记分析',
      description: '筛低粉爆款，拆解互动与内容结构，找可扩展选题。',
      href: '/xiaohongshu/viral-content-analysis',
      icon: 'trending',
      proof: '从样本筛选、单篇拆解到选题沉淀',
    },
    {
      id: 'account-analysis',
      title: '小红书对标账号分析',
      description: '拆解对标账号内容规律与公开表现。',
      href: '/xiaohongshu/account-analysis',
      icon: 'users',
      proof: '定位、主题、表现规律与机会判断',
    },
    {
      id: 'scraper',
      title: '小红书笔记采集',
      description: '批量采集笔记、作者信息、互动指标和搜索结果。',
      href: '/xiaohongshu/scraper',
      icon: 'database',
    },
    {
      id: 'comments',
      title: '小红书评论采集',
      description: '采集评论，为需求研究、舆情和线索识别做铺垫。',
      href: '/xiaohongshu/comments',
      icon: 'messages',
    },
    {
      id: 'downloader',
      title: '小红书无水印下载',
      description: '保存图文与视频原始素材，建立可整理的素材库。',
      href: '/xiaohongshu/downloader',
      icon: 'download',
    },
    {
      id: 'image-text',
      title: '小红书图文文案提取',
      description: '识别配图文案，补齐图文笔记的可分析内容。',
      href: '/xiaohongshu/image-text',
      icon: 'imageText',
    },
    {
      id: 'transcript',
      title: '小红书视频逐字稿',
      description: '视频转文案，把视频内容变成可检索、可复用文本。',
      href: '/xiaohongshu/transcript',
      icon: 'audio',
    },
    {
      id: 'leads',
      title: '小红书评论区截流',
      description: '从评论中筛选高意向线索，整理可跟进的公开线索。',
      href: '/xiaohongshu/leads',
      icon: 'leads',
    },
    {
      id: 'monitoring',
      title: '小红书账号监控',
      description: '持续跟踪对标账号更新和内容表现，减少重复人工巡检。',
      href: '/xiaohongshu/monitoring',
      icon: 'monitoring',
    },
    {
      id: 'codex-agent',
      title: 'Codex 接入',
      description:
        '从 Codex 发起口头描述任务，调用插件已有的所有能力完成目标。',
      icon: 'bot',
    },
    {
      id: 'workbuddy-agent',
      title: 'WorkBuddy 接入',
      description:
        '从 WorkBuddy 发起采集与分析任务，调用插件已有的所有能力完成目标。',
      icon: 'bot',
    },
    {
      id: 'feishu-integration',
      title: '飞书集成',
      description:
        '把采集数据、分析报告和监控结果同步到飞书多维表格，继续团队协作。',
      href: '/features/feishu-integration',
      icon: 'table',
    },
  ],
  workflowSection: {
    eyebrow: '组合工作流',
    title: '小红书自媒体内容自动化流程',
    description:
      '每个工具解决一个具体步骤，按任务组合后形成从研究、采集到交付的完整流程。',
    stepLabel: '步骤',
  },
  workflows: [
    {
      id: 'discover-collect',
      label: '发现与采集',
      title: '从关键词或账号出发，建立可用的研究样本池',
      description:
        '先找到值得研究的内容，再批量采集公开数据与素材，避免把时间花在无效样本上。',
      steps: [
        '通过关键词洞察、爆款分析或账号分析筛选方向',
        '批量采集笔记、作者、互动指标和评论',
        '下载原始素材并按主题或项目整理',
      ],
      image: {
        src: '/imgs/docs/collect/search-results/01-xiaohongshu-native-filter.webp?v=20260821',
        alt: 'MediaClaw 小红书搜索结果筛选与批量采集界面',
        width: 1600,
        height: 880,
      },
    },
    {
      id: 'analyze',
      label: '分析与判断',
      title: '把账号和内容样本转成结构化判断',
      description:
        '比较账号定位、内容主题和互动表现，拆解爆款结构并识别更值得继续验证的方向。',
      steps: [
        '建立对标账号与爆款样本集合',
        '比较选题、标题、内容结构和互动规律',
        '输出账号报告、机会判断和验证清单',
      ],
      image: {
        src: '/imgs/docs/benchmark/account-research/05-拆解报告-选题归类.webp',
        alt: 'MediaClaw 小红书账号拆解报告与选题归类',
        width: 1600,
        height: 1187,
      },
    },
    {
      id: 'reuse',
      label: '提取与复用',
      title: '把视频和图文素材沉淀为可继续创作的内容资产',
      description:
        '补齐逐字稿与图文文案，将洞察、评论和素材同步到团队空间，继续生成选题或初稿。',
      steps: [
        '提取视频逐字稿、图片文字与评论信息',
        '把数据、报告和素材同步到飞书多维表格',
        '围绕已验证信号整理选题、结构和初稿',
      ],
      image: {
        src: '/imgs/auth-story/draft-result.webp',
        alt: '基于小红书研究素材生成的内容初稿',
        width: 1600,
        height: 1427,
      },
    },
    {
      id: 'agent-orchestration',
      label: 'Agent 自动接力',
      title: '用一句话描述目标，让 Agent 编排采集与分析',
      description:
        'Agent 接管是现有能力的自动化入口，而不是另一套孤立工具。描述目标即可让 Agent 衔接采集、分析与交付。',
      steps: [
        '用自然语言说明研究目标、关键词、账号或期望结果',
        'Agent 通过本机连接调用浏览器插件，让采集与分析按需接力',
        '遇到登录验证、验证码或云端积分确认时再由你接手',
      ],
      image: {
        src: '/imgs/features/2-20260816.webp',
        alt: 'MediaClaw Agent 接管：抓取评论并分析选题的对话与看板界面',
        width: 2892,
        height: 2140,
      },
    },
  ],
  faqSection: { eyebrow: '常见问题', title: '关于费用、数据与账号安全' },
  faqs: [
    {
      question: '可以先免费用吗？哪些功能需要会员或积分？',
      answer:
        '可以。免费版可长期使用单篇深度采集、单篇评论与评论区截流、搜索页和账号页基础列表采集、无水印下载以及 CSV、Markdown 导出。批量详情补全、飞书同步和完整研究工作流需要会员；视频逐字稿、AI 分析与内容创作等任务会使用积分。具体权益以价格页当前方案为准。',
    },
    {
      question: '需要把小红书账号密码或 Cookie 交给 MediaClaw 吗？',
      answer:
        '不需要。你只需在小红书网页版保持正常登录，MediaClaw 会读取你当前能够看到的公开页面内容。插件不要求你提交小红书账号密码，也不调用浏览器 Cookie 权限读取 Cookie。',
    },
    {
      question: '能采集哪些小红书页面和数据？',
      answer:
        '支持作品详情页、关键词搜索结果页和账号主页。根据页面公开信息，可采集标题、正文、作者、发布时间、链接、点赞收藏评论等互动数据，以及图片、视频和评论。列表页通常只有摘要字段；需要正文、标签、媒体链接或更完整的互动数据时，再执行详情补采。',
    },
    {
      question: '采集结果存在哪里？可以导出或同步吗？',
      answer:
        '采集结果默认保存在当前浏览器的本地数据池，不会在未操作时自动上传。你可以按当前筛选结果导出 CSV 或 Markdown；需要团队协作时，也可以主动同步到自己的飞书多维表格。卸载插件或清除扩展数据前，请先导出或同步备份。',
    },
    {
      question: '批量采集会不会触发小红书风控？',
      answer:
        '无法承诺完全没有风险。MediaClaw 会控制滚动、等待和批量操作节奏，但长时间、高频或多窗口同时采集仍可能触发验证码、限流等平台限制。建议使用默认节奏、单窗口分批执行；出现登录验证或访问限制时，先停止任务并人工处理。',
    },
    {
      question: '支持哪些浏览器和设备？',
      answer:
        '目前请在电脑端 Chrome 或 Microsoft Edge 中使用，暂不支持手机和平板。建议优先从 Chrome 或 Edge 官方商店安装，以便自动更新；商店无法访问时，也可以使用官网提供的离线安装包。',
    },
  ],
  crossPlatform: {
    title: '同一套工作流也支持抖音',
    description:
      '账号分析、爆款分析、视频采集、逐字稿和对标账号监控在抖音同样可用，采集结果保持相同的字段和导出方式。',
    actionLabel: '查看抖音工具',
    href: '/douyin',
  },
  finalCta: {
    eyebrow: '从一个真实任务开始',
    title: '先采集一批样本，再决定下一步分析什么',
    description:
      '安装 MediaClaw Chrome 插件，从小红书当前页面直接开始采集、下载或分析。',
    actionLabel: '我要使用',
    href: '/download',
  },
};

export const enXiaohongshuHub: PlatformHubContent = {
  locale: 'en',
  platform: 'RedNote / Xiaohongshu',
  platformSlug: 'xiaohongshu',
  metadata: {
    title: 'RedNote & Xiaohongshu Research Tools | MediaClaw',
    description:
      'Research creators and viral posts, collect public RedNote data and comments, extract transcripts and image text, monitor competitors, and export reusable content assets.',
    keywords:
      'RedNote tools,Xiaohongshu tools,Xiaohongshu scraper,RedNote scraper,Xiaohongshu account analysis,RedNote video downloader',
  },
  breadcrumbs: { home: 'Home', current: 'RedNote content workflow' },
  hero: {
    eyebrow: 'RedNote & Xiaohongshu Content Workflow',
    title: 'Research, collect and analyze RedNote content in one workflow',
    titleHighlight: 'RedNote',
    description:
      'Find creators and posts worth studying, collect public content and comments, then turn transcripts, image text, account patterns and source-backed ideas into reusable research assets.',
    primaryAction: 'Get Started',
    primaryHref: '/download',
    secondaryAction: 'Browse all features',
    secondaryHref: '#all-features',
    microcopy: 'Chrome extension · No code · Local export and Lark sync',
  },
  scenes: [
    {
      id: 'research',
      eyebrow: 'Discover and decide',
      title: 'Find directions and research samples',
      description:
        'Use keywords, low-follower viral posts and benchmark creators to identify niches, content patterns and signals worth testing.',
      icon: 'keywords',
      featureIds: ['keywords', 'viral-content-analysis', 'account-analysis'],
    },
    {
      id: 'collect',
      eyebrow: 'Data and media',
      title: 'Collect posts, comments and source media',
      description:
        'Save public posts, engagement data, comments and original media in batches so analysis starts from complete samples.',
      icon: 'database',
      featureIds: ['scraper', 'comments', 'downloader'],
    },
    {
      id: 'extract',
      eyebrow: 'Extract and convert',
      title: 'Turn media into searchable, reusable text',
      description:
        'Extract transcripts, image copy and high-intent comment signals instead of manually organizing every source.',
      icon: 'sparkles',
      featureIds: ['image-text', 'transcript', 'leads'],
    },
    {
      id: 'automate',
      eyebrow: 'Agent access',
      title: 'Hand repetitive steps to the agent you already use',
      description:
        'Start a controlled collection, analysis and delivery flow straight from Codex or WorkBuddy, and hand repetitive steps to the agent you already use.',
      icon: 'bot',
      featureIds: ['codex-agent', 'workbuddy-agent'],
    },
    {
      id: 'monitor',
      eyebrow: 'Track and collaborate',
      title: 'Monitor benchmark creators and keep the team aligned',
      description:
        'Track creator updates and content signals, then sync data, reports and reusable assets into Lark workflows.',
      icon: 'monitoring',
      featureIds: ['monitoring', 'feishu-integration'],
    },
  ],
  workflowSection: {
    eyebrow: 'Connected workflows',
    title: 'Each tool solves one step; together they produce an outcome',
    description:
      'The Hub does not add a required navigation layer. It shows how separate tools fit into real work, while every feature remains directly accessible.',
    stepLabel: 'Step',
  },
  workflows: [
    {
      id: 'discover-collect',
      label: 'Discover & collect',
      title: 'Build a useful research dataset from keywords or creators',
      description:
        'Find content worth studying before collecting public data and media in batches, so the sample pool stays focused.',
      steps: [
        'Use keyword, viral-content or account analysis to select a direction',
        'Collect posts, creators, engagement metrics and comments',
        'Download source media and organize it by project or topic',
      ],
      image: {
        src: '/imgs/docs/collect/search-results/01-xiaohongshu-native-filter.webp?v=20260821',
        alt: 'MediaClaw RedNote search-result filtering and batch collection',
        width: 1600,
        height: 880,
      },
    },
    {
      id: 'analyze',
      label: 'Analyze & decide',
      title: 'Turn creator and post samples into structured decisions',
      description:
        'Compare positioning, topics and public performance, break down viral patterns and identify directions worth validating next.',
      steps: [
        'Create a benchmark creator and viral-post sample set',
        'Compare topics, hooks, structures and engagement patterns',
        'Produce an account report, opportunity view and validation list',
      ],
      image: {
        src: '/imgs/docs/benchmark/account-research/05-拆解报告-选题归类.webp',
        alt: 'MediaClaw RedNote account breakdown report with topic grouping',
        width: 1600,
        height: 1187,
      },
    },
    {
      id: 'reuse',
      label: 'Extract & reuse',
      title: 'Turn video and image posts into reusable content assets',
      description:
        'Fill in transcripts and image text, sync evidence and insights to the team workspace, then continue into ideas or drafts.',
      steps: [
        'Extract video transcripts, image text and comment signals',
        'Sync data, reports and media references to Lark Base',
        'Turn validated signals into topic ideas, structures and drafts',
      ],
      image: {
        src: '/imgs/auth-story/draft-result.webp',
        alt: 'Content draft produced from RedNote research assets',
        width: 1600,
        height: 1427,
      },
    },
    {
      id: 'agent-orchestration',
      label: 'Agent handoff',
      statusLabel: 'Available',
      title: 'Describe the goal once and let an agent orchestrate the work',
      description:
        'Agent takeover is an automation layer across existing tools, not a separate silo. Describe the goal and the agent connects collection, analysis and delivery.',
      steps: [
        'Describe the research goal, keywords, creators or expected output',
        'A local agent connection asks the browser extension to collect and analyze as needed',
        'You take over for sign-in checks, CAPTCHAs or cloud-credit confirmation',
      ],
      image: {
        src: '/imgs/features/2-20260816.webp',
        alt: 'MediaClaw agent takeover: fetching comments and analyzing topic opportunities',
        width: 2892,
        height: 2140,
      },
    },
  ],
  directorySection: {
    eyebrow: 'All features',
    title: 'Go straight to the tool for your goal',
    description:
      'Available tools open their feature pages directly, and the Codex and WorkBuddy agent connections link to the agent workflow guide.',
  },
  features: [
    {
      id: 'keywords',
      title: 'Keyword Insights',
      description:
        'Expand keywords, search suggestions and long-tail demand for topic discovery.',
      href: '/xiaohongshu/keywords',
      icon: 'keywords',
    },
    {
      id: 'viral-content-analysis',
      title: 'Viral Content Analysis',
      description:
        'Find low-follower breakout posts and analyze hooks, engagement and structure.',
      href: '/xiaohongshu/viral-content-analysis',
      icon: 'trending',
      badge: 'Content research',
      proof:
        'From sample filtering and breakdowns to reusable topic directions',
    },
    {
      id: 'account-analysis',
      title: 'Account Analysis',
      description:
        'Compare positioning, themes and public performance across benchmark creators.',
      href: '/xiaohongshu/account-analysis',
      icon: 'users',
      badge: 'Creator research',
      proof: 'Positioning, topic mix, performance patterns and opportunities',
    },
    {
      id: 'scraper',
      title: 'Post Scraper',
      description:
        'Collect public posts, creator details, engagement metrics and search results.',
      href: '/xiaohongshu/scraper',
      icon: 'database',
    },
    {
      id: 'comments',
      title: 'Comment Scraper',
      description:
        'Collect public comments for demand research, sentiment and lead discovery.',
      href: '/xiaohongshu/comments',
      icon: 'messages',
    },
    {
      id: 'downloader',
      title: 'Video & Image Downloader',
      description:
        'Save original video and image media for review and organized research.',
      href: '/xiaohongshu/downloader',
      icon: 'download',
    },
    {
      id: 'image-text',
      title: 'Image Text Extraction',
      description:
        'Extract text from image posts and make visual copy searchable and reusable.',
      href: '/xiaohongshu/image-text',
      icon: 'imageText',
    },
    {
      id: 'transcript',
      title: 'Video Transcripts',
      description:
        'Convert spoken video content into searchable, reusable transcripts.',
      href: '/xiaohongshu/transcript',
      icon: 'audio',
    },
    {
      id: 'leads',
      title: 'Lead Collection',
      description:
        'Identify high-intent expressions in public comments and organize lead samples.',
      href: '/xiaohongshu/leads',
      icon: 'leads',
    },
    {
      id: 'monitoring',
      title: 'Competitor Monitoring',
      description:
        'Track benchmark creator updates and content performance without manual checks.',
      href: '/xiaohongshu/monitoring',
      icon: 'monitoring',
    },
    {
      id: 'codex-agent',
      title: 'Codex Integration',
      description:
        'Start collection and analysis from Codex, then take control when sign-in checks or cost confirmation require you.',
      icon: 'bot',
      badge: 'Agent access',
    },
    {
      id: 'workbuddy-agent',
      title: 'WorkBuddy Integration',
      description:
        'Start collection and analysis from WorkBuddy and connect repetitive steps into a controlled content workflow.',
      icon: 'bot',
      badge: 'Agent access',
    },
    {
      id: 'feishu-integration',
      title: 'Lark Integration',
      description:
        'Sync collected data, analysis reports and monitoring results to Lark Base for continued team collaboration.',
      href: '/features/feishu-integration',
      icon: 'table',
    },
  ],
  faqSection: {
    eyebrow: 'Frequently asked questions',
    title: 'Pricing, data and account safety',
  },
  faqs: [
    {
      question: 'Can I try it for free, and what requires a plan or credits?',
      answer:
        'Yes. The Free plan includes single-post deep collection, single-post comments and leads, basic search and profile lists, watermark-free downloads, and CSV or Markdown export. Batch detail enrichment, Lark sync, and full research workflows require a paid plan. Video transcripts, AI analysis, and content generation use credits. See the pricing page for current entitlements.',
    },
    {
      question: 'Do I need to give MediaClaw my RedNote password or cookies?',
      answer:
        'No. Stay signed in on the RedNote website and MediaClaw reads public content already visible in your current browser session. It does not ask for your RedNote password and does not use browser cookie permissions to read your cookies.',
    },
    {
      question: 'Which RedNote pages and fields can I collect?',
      answer:
        'MediaClaw supports post detail pages, keyword search results, and creator profiles. Depending on what the page exposes, records can include titles, body text, authors, publish time, links, engagement metrics, images, videos, and comments. List pages usually provide summary fields; run detail enrichment when you need full text, tags, media links, or more complete metrics.',
    },
    {
      question: 'Where is collected data stored, and can I export or sync it?',
      answer:
        'Collected records stay in the local data pool of your current browser by default and are not uploaded automatically. You can export the current filtered view as CSV or Markdown, or actively sync it to your own Lark Base for team workflows. Export or sync a backup before uninstalling the extension or clearing extension data.',
    },
    {
      question: 'Can batch collection trigger RedNote account restrictions?',
      answer:
        'No tool can promise zero risk. MediaClaw controls scrolling, waiting, and batch pacing, but long, high-frequency, or concurrent collection can still trigger captchas, rate limits, or other platform controls. Keep the default pacing, run one window in smaller batches, and pause for manual verification when RedNote asks for it.',
    },
    {
      question: 'Which browsers and devices are supported?',
      answer:
        'Use MediaClaw on desktop Chrome or Microsoft Edge. Phones and tablets are not currently supported. Install from the official Chrome or Edge store for automatic updates when possible; an offline package is available from the download page when store access is unavailable.',
    },
  ],
  crossPlatform: {
    title: 'The same workflow also covers Douyin',
    description:
      'Account analysis, viral video analysis, video scraping, transcripts and competitor monitoring work the same way on Douyin, with the same fields and exports.',
    actionLabel: 'See Douyin tools',
    href: '/douyin',
  },
  finalCta: {
    eyebrow: 'Start with a real task',
    title: 'Collect a useful sample first, then decide what to analyze next',
    description:
      'Install the MediaClaw Chrome extension and start collecting, downloading or analyzing from the RedNote page you already have open.',
    actionLabel: 'Get Started',
    href: '/download',
  },
};
