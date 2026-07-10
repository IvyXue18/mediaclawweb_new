# MediaClaw 功能页关键词文案审核稿

> 状态：待审核。本文档只整理文案方案，暂不批量修改源码。
> 范围：`src/content/legacy-pages/{zh,en}/{xiaohongshu,douyin}/*.json`
> 目标：让小红书、抖音 16 个功能落地页的中英文版本都满足 4 个 SEO 文案要求。

## 验收标准

每个页面检查 4 个位置：

1. `metadata.title` 里有主词。
2. `page.sections.hero.title`，也就是 H1，里有主词或近义完整词。
3. 首屏说明文案自然出现主词。中文控制在约 100-150 字；英文控制在约 45-75 words，保证可读性。
4. Top 10 关键词里至少出现 2 个完整意图词，而不是只有“采集 / 内容 / 视频 / 分析”这类泛词。

## 总体规则

- 中文主词格式：`平台 + 具体任务 + 工具/插件`。
- 英文主词格式：`Platform + task + Chrome extension / tool / extractor`。
- 小红书英文页优先使用 `RedNote`，同时在 title 或首屏中带一次 `Xiaohongshu`，避免丢旧搜索词。
- “小红书客资采集工具”改为“**小红书评论区获客工具**”。
- 抖音对应页也建议改为“**抖音评论区获客工具**”，保持产品结构一致。
- 对比表标题要服务本页主词，避免“浏览器插件 / 云端采集 / API”这些对比对象抢走页面语义重心。
- `leads` 页当前 `show_sections` 包含 `compare` 和 `safety`，但 sections 里没有定义，建议本轮补齐或从 `show_sections` 移除。更建议补齐，因为“评论区获客”很适合做方案对比和合规说明。

## 中文页面

### 小红书

#### `/xiaohongshu/scraper`

- 主词：小红书笔记采集插件
- 辅助词：小红书数据采集工具、小红书搜索结果采集、小红书主页数据采集
- `metadata.title`：`小红书笔记采集插件_免费采集主页、笔记和搜索结果 | MediaClaw`
- H1：`小红书笔记采集插件：批量抓取笔记、主页和搜索结果`
- 首屏说明：`MediaClaw 是免费的浏览器端小红书笔记采集插件，支持单篇笔记深度采集、博主主页批量采集和关键词搜索结果采集。采集后可导出 CSV/Excel/Markdown，也能继续补齐配图文案、视频逐字稿和评论数据，帮助运营团队快速建立可复用的小红书数据样本库。`
- 表格标题：`小红书数据采集方式对比：插件、云端服务、脚本和 API`
- 表格描述：`如果你的目标是批量采集小红书笔记、主页作品和搜索结果，下面对比不同方案在配置成本、导出能力和风控上的差异。`
- 预期 Top 10 完整意图词：小红书笔记采集插件、小红书数据采集工具、小红书搜索结果采集

#### `/xiaohongshu/comments`

- 主词：小红书评论采集工具
- 辅助词：小红书评论导出 Excel、小红书评论数据采集、评论数据分析
- `metadata.title`：`小红书评论采集工具_免费导出评论数据到 Excel | MediaClaw`
- H1：`小红书评论采集工具：批量采集评论并导出 Excel`
- 首屏说明：`MediaClaw 是免费的浏览器端小红书评论采集工具，打开任意笔记即可自动滚动采集评论内容、点赞数、发布时间、用户昵称和主页链接。评论数据可一键导出 Excel/CSV，也能同步飞书，继续做评论数据分析、需求挖掘、选题洞察和高意向评论筛选。`
- 表格标题：`小红书评论采集方式对比：插件采集、手动复制和云端服务`
- 表格描述：`围绕小红书评论采集、评论导出和评论数据分析，对比三种方式在效率、字段完整度和后续处理上的差异。`
- 预期 Top 10 完整意图词：小红书评论采集工具、小红书评论导出 Excel、评论数据分析

#### `/xiaohongshu/leads`

- 主词：小红书评论区获客工具
- 辅助词：小红书评论区客资挖掘、高意向客户筛选、评论区获客
- `metadata.title`：`小红书评论区获客工具_筛选高意向客户并导出 Excel | MediaClaw`
- H1：`小红书评论区获客工具：从评论里筛选高意向客户`
- 首屏说明：`MediaClaw 是面向品牌、电商和本地商家的小红书评论区获客工具。先采集笔记评论区数据，再用购买意向关键词、IP 属地和评论内容自动筛选高意向客户，生成可跟进的客资名单。单篇笔记可免费导出 Excel/CSV，也能同步飞书给销售或私域团队跟进。`
- 建议补充表格标题：`小红书评论区获客方式对比：插件筛选、手动翻评论和外包整理`
- 建议补充表格描述：`评论区获客的核心不是把所有评论搬出来，而是快速找到“哪里买、求链接、多少钱、想要”这类高意向信号。`
- 预期 Top 10 完整意图词：小红书评论区获客工具、小红书评论区客资挖掘、高意向客户筛选

#### `/xiaohongshu/keywords`

- 主词：小红书关键词挖掘工具
- 辅助词：小红书赛道机会判断、小红书对标账号、小红书长尾词挖掘
- `metadata.title`：`小红书关键词挖掘工具_判断赛道机会并找对标账号 | MediaClaw`
- H1：`小红书关键词挖掘工具：判断赛道机会并找到对标账号`
- 首屏说明：`MediaClaw 是面向内容运营的小红书关键词挖掘工具。从一个种子词出发，先判断主词是否值得做，再自动发现搜索结果里的对标账号，继续扩展 200+ 长尾词并按需求意图聚类。关键词结果还能一键触发搜索结果采集，沉淀选题和样本笔记。`
- 表格标题：`小红书关键词挖掘适合哪些内容决策场景`
- 表格描述：`从赛道机会判断、对标账号发现到长尾词扩展，把关键词研究直接接到选题和采集流程。`
- 预期 Top 10 完整意图词：小红书关键词挖掘工具、小红书赛道机会判断、小红书对标账号

#### `/xiaohongshu/monitoring`

- 主词：小红书竞品监控工具
- 辅助词：小红书对标账号监控、小红书内容预警、竞品内容监控
- `metadata.title`：`小红书竞品监控工具_自动追踪对标账号并推送飞书 | MediaClaw`
- H1：`小红书竞品监控工具：自动追踪对标账号内容更新`
- 首屏说明：`MediaClaw 是小红书竞品监控工具，可按规则自动追踪对标账号的发文、互动数据和爆款内容变化。命中点赞、收藏、评论、发布时间等条件后，系统生成 AI 摘要并推送飞书日报，让运营团队不用每天手动巡检，也能及时发现竞品内容动作。`
- 表格标题：`小红书竞品监控在运营团队中的典型应用`
- 表格描述：`围绕对标账号监控、爆款内容预警和飞书日报，说明不同团队如何把竞品监控变成日常情报流程。`
- 预期 Top 10 完整意图词：小红书竞品监控工具、小红书对标账号监控、小红书内容预警

#### `/xiaohongshu/downloader`

- 主词：小红书无水印下载工具
- 辅助词：小红书视频下载、小红书图片下载、小红书素材下载
- `metadata.title`：`小红书无水印下载工具_免费批量保存视频和图片 | MediaClaw`
- H1：`小红书无水印下载工具：批量保存视频、图片和 Live 图`
- 首屏说明：`MediaClaw 是免费的浏览器端小红书无水印下载工具，支持批量保存小红书视频、图文图片、封面和 Live 图，尽量保留原始画质。下载后的素材可用于内容拆解、选题分析、竞品复盘和视觉参考库建设，适合运营、创作者和素材整理团队。`
- 表格标题：`小红书无水印下载方式对比：插件、在线解析、小程序和录屏`
- 表格描述：`围绕画质、批量能力、操作成本和素材完整度，对比不同小红书下载方案。`
- 预期 Top 10 完整意图词：小红书无水印下载工具、小红书视频下载、小红书图片下载

#### `/xiaohongshu/image-text`

- 主词：小红书图文文案提取工具
- 辅助词：小红书图片文字提取、小红书 OCR、配图文案提取
- `metadata.title`：`小红书图文文案提取工具_图片文字 OCR 一键转文本 | MediaClaw`
- H1：`小红书图文文案提取工具：识别封面和配图文字`
- 首屏说明：`MediaClaw 是小红书图文文案提取工具，内置图片文字 OCR，可识别封面、配图、步骤卡、书单、价格表和商品参数。识别结果会回填到采集记录，后续复制、导出 CSV/Markdown 或同步飞书时一起带走，适合拆解图文笔记和沉淀文案素材。`
- 表格标题：`小红书图文文案提取适合哪些运营场景`
- 表格描述：`从封面关键词、商品卡、教程步骤到竞品图文拆解，说明图片文字识别如何补齐正文看不到的数据。`
- 预期 Top 10 完整意图词：小红书图文文案提取工具、小红书图片文字提取、小红书 OCR

#### `/xiaohongshu/transcript`

- 主词：小红书视频逐字稿提取工具
- 辅助词：小红书视频转文字、带时间戳逐字稿、口播文案提取
- `metadata.title`：`小红书视频逐字稿提取工具_口播转文字并带时间戳 | MediaClaw`
- H1：`小红书视频逐字稿提取工具：一键把口播转成文字`
- 首屏说明：`MediaClaw 是小红书视频逐字稿提取工具，可在采集记录里直接把视频口播转成文字，一次输出完整逐字稿和带时间戳的分句稿。适合拆解爆款开头、口播节奏、转折结构和结尾召唤，也方便把视频脚本交给 AI 做改写、仿写和素材沉淀。`
- 表格标题：`小红书视频逐字稿提取方式对比：插件内提取和飞书批量`
- 表格描述：`少量视频适合插件内直接提取，批量视频可走飞书字段捷径；两条路径覆盖不同规模的转写需求。`
- 预期 Top 10 完整意图词：小红书视频逐字稿提取工具、小红书视频转文字、带时间戳逐字稿

### 抖音

#### `/douyin/scraper`

- 主词：抖音数据采集插件
- 辅助词：抖音视频采集工具、抖音搜索结果采集、抖音主页数据采集
- `metadata.title`：`抖音数据采集插件_免费采集视频、主页和搜索结果 | MediaClaw`
- H1：`抖音数据采集插件：批量采集视频、主页和搜索结果`
- 首屏说明：`MediaClaw 是免费的浏览器端抖音数据采集插件，支持单条视频深度采集、账号主页批量采集和关键词搜索结果采集。采集结果可导出 CSV/Excel/Markdown，也能继续补齐视频逐字稿、评论数据和互动字段，帮助团队建立抖音内容样本库。`
- 表格标题：`抖音数据采集方式对比：插件、云端服务、脚本和 API`
- 表格描述：`围绕抖音视频采集、主页采集和搜索结果采集，对比不同方案在配置成本、字段完整度和导出能力上的差异。`
- 预期 Top 10 完整意图词：抖音数据采集插件、抖音视频采集工具、抖音搜索结果采集

#### `/douyin/comments`

- 主词：抖音评论采集工具
- 辅助词：抖音评论导出 Excel、抖音评论数据采集、评论数据分析
- `metadata.title`：`抖音评论采集工具_免费导出视频评论到 Excel | MediaClaw`
- H1：`抖音评论采集工具：批量采集视频评论并导出 Excel`
- 首屏说明：`MediaClaw 是免费的浏览器端抖音评论采集工具，打开任意公开视频即可自动滚动采集评论文本、点赞数、发布时间、用户昵称和主页链接。评论数据可导出 Excel/CSV，也能同步飞书继续做评论数据分析、用户需求挖掘、选题洞察和获客筛选。`
- 表格标题：`抖音评论采集方式对比：插件采集、手动复制和云端服务`
- 表格描述：`围绕抖音评论采集、评论导出和评论数据分析，对比三种方式在效率、字段完整度和后续处理上的差异。`
- 预期 Top 10 完整意图词：抖音评论采集工具、抖音评论导出 Excel、评论数据分析

#### `/douyin/leads`

- 主词：抖音评论区获客工具
- 辅助词：抖音评论区客资挖掘、高意向客户筛选、评论区获客
- `metadata.title`：`抖音评论区获客工具_筛选高意向客户并导出 Excel | MediaClaw`
- H1：`抖音评论区获客工具：从视频评论里筛选高意向客户`
- 首屏说明：`MediaClaw 是面向电商、本地生活和私域团队的抖音评论区获客工具。先采集视频评论区数据，再用购买意向关键词、IP 属地和评论内容自动筛选高意向客户，生成可跟进的客资名单。单条视频可免费导出 Excel/CSV，也能同步飞书分配跟进。`
- 建议补充表格标题：`抖音评论区获客方式对比：插件筛选、手动翻评论和外包整理`
- 建议补充表格描述：`评论区获客的关键是快速找到问价格、求链接、问库存、想预约这类高意向信号，而不是把所有评论简单搬进表格。`
- 预期 Top 10 完整意图词：抖音评论区获客工具、抖音评论区客资挖掘、高意向客户筛选

#### `/douyin/keywords`

- 主词：抖音关键词挖掘工具
- 辅助词：抖音赛道机会判断、抖音对标账号、抖音长尾词挖掘
- `metadata.title`：`抖音关键词挖掘工具_判断赛道机会并找对标账号 | MediaClaw`
- H1：`抖音关键词挖掘工具：判断赛道机会并找到对标账号`
- 首屏说明：`MediaClaw 是面向内容团队的抖音关键词挖掘工具。从一个种子词出发，先判断这个赛道是否值得做，再自动发现搜索样本里的对标账号，继续扩展搜索联想词并按需求意图聚类。关键词结果还能触发视频样本采集，辅助选题和发布节奏设计。`
- 表格标题：`抖音关键词挖掘适合哪些内容决策场景`
- 表格描述：`从赛道机会判断、对标账号发现到长尾词扩展，把关键词研究接到视频选题和样本采集流程。`
- 预期 Top 10 完整意图词：抖音关键词挖掘工具、抖音赛道机会判断、抖音对标账号

#### `/douyin/monitoring`

- 主词：抖音竞品监控工具
- 辅助词：抖音对标账号监控、抖音内容预警、竞品内容监控
- `metadata.title`：`抖音竞品监控工具_自动追踪对标账号并推送飞书 | MediaClaw`
- H1：`抖音竞品监控工具：自动追踪对标账号内容更新`
- 首屏说明：`MediaClaw 是抖音竞品监控工具，可按规则持续追踪对标账号的发布动态、互动数据变化和高互动视频。命中点赞、评论、发布时间或账号条件后，系统生成 AI 摘要并推送飞书，让团队更快发现竞品动作、爆款趋势和内容机会。`
- 表格标题：`抖音竞品监控在运营团队中的典型应用`
- 表格描述：`围绕对标账号监控、爆款视频预警和飞书日报，说明不同团队如何把竞品监控变成日常情报流程。`
- 预期 Top 10 完整意图词：抖音竞品监控工具、抖音对标账号监控、抖音内容预警

#### `/douyin/downloader`

- 主词：抖音无水印下载工具
- 辅助词：抖音视频下载、抖音 MP4 直链、抖音素材下载
- `metadata.title`：`抖音无水印下载工具_免费批量保存视频 MP4 和图文素材 | MediaClaw`
- H1：`抖音无水印下载工具：批量保存视频、封面和图文素材`
- 首屏说明：`MediaClaw 是免费的浏览器端抖音无水印下载工具，可直接提取公开视频的原始 MP4 链接，批量保存无水印视频、封面和图文合集素材。下载后的素材可用于混剪二创、卡点参考、内容拆解和竞品素材库建设。`
- 表格标题：`抖音无水印下载方式对比：插件、在线解析、小程序和录屏`
- 表格描述：`围绕画质、批量能力、操作成本和素材完整度，对比不同抖音下载方案。`
- 预期 Top 10 完整意图词：抖音无水印下载工具、抖音视频下载、抖音 MP4 直链

#### `/douyin/image-text`

- 主词：抖音图文文案提取工具
- 辅助词：抖音图片文字提取、抖音 OCR、配图文案提取
- `metadata.title`：`抖音图文文案提取工具_合集图 OCR 一键转文本 | MediaClaw`
- H1：`抖音图文文案提取工具：识别封面和合集图文字`
- 首屏说明：`MediaClaw 是抖音图文文案提取工具，内置图片文字 OCR，可识别封面、合集图、商品卡、教程步骤、价格表和参数清单。识别结果会回填到采集记录，后续复制、导出 CSV/Markdown 或同步飞书时一起带走，适合选品拆解和图文内容归档。`
- 表格标题：`抖音图文文案提取适合哪些运营场景`
- 表格描述：`从商品卡、教程合集、封面关键词到竞品图文拆解，说明图片文字识别如何补齐正文看不到的数据。`
- 预期 Top 10 完整意图词：抖音图文文案提取工具、抖音图片文字提取、抖音 OCR

#### `/douyin/transcript`

- 主词：抖音视频逐字稿提取工具
- 辅助词：抖音视频转文字、带时间戳逐字稿、抖音口播文案提取
- `metadata.title`：`抖音视频逐字稿提取工具_口播转文字并带时间戳 | MediaClaw`
- H1：`抖音视频逐字稿提取工具：一键把口播转成文字`
- 首屏说明：`MediaClaw 是抖音视频逐字稿提取工具，可在采集记录里直接把视频口播转成文字，一次输出完整逐字稿和带时间戳的分句稿。适合拆解爆款开头、口播节奏、转折结构和结尾话术，也方便把短视频脚本交给 AI 做改写和仿写。`
- 表格标题：`抖音视频逐字稿提取方式对比：插件内提取和飞书批量`
- 表格描述：`少量视频适合插件内直接提取，批量视频可走飞书字段捷径；两条路径覆盖不同规模的转写需求。`
- 预期 Top 10 完整意图词：抖音视频逐字稿提取工具、抖音视频转文字、带时间戳逐字稿

## English Pages

### RedNote / Xiaohongshu

#### `/en/xiaohongshu/scraper`

- Primary keyword: RedNote scraper Chrome extension
- Secondary keywords: Xiaohongshu scraper, RedNote data export, RedNote profile scraper
- `metadata.title`: `Free RedNote Scraper Chrome Extension for Xiaohongshu | MediaClaw`
- H1: `RedNote Scraper Chrome Extension for Posts, Profiles and Search Results`
- Hero copy: `MediaClaw is a free RedNote scraper Chrome extension for collecting public Xiaohongshu posts, creator profiles, and keyword search results in your own browser. Export clean data to CSV, Excel, or Markdown, sync records to Lark Base, and backfill image text, video transcripts, comments, and engagement fields for repeatable content research.`
- Compare title: `RedNote scraper options: Chrome extension, cloud scraper, scripts and APIs`
- Compare description: `Compare ways to scrape RedNote data by setup cost, export quality, maintenance effort, and workflow fit.`
- Expected complete Top 10 terms: RedNote scraper Chrome extension, Xiaohongshu scraper, RedNote data export

#### `/en/xiaohongshu/comments`

- Primary keyword: RedNote comment scraper
- Secondary keywords: Xiaohongshu comment scraper, export RedNote comments, comment analysis
- `metadata.title`: `Free RedNote Comment Scraper - Export Xiaohongshu Comments to Excel`
- H1: `RedNote Comment Scraper for Exporting Xiaohongshu Comments`
- Hero copy: `MediaClaw is a free RedNote comment scraper that collects public Xiaohongshu comment text, likes, timestamps, usernames, and profile links from your browser. Export comments to Excel or CSV, sync them to Lark Base, and use the dataset for comment analysis, user-need mining, topic planning, competitor review, and high-intent comment filtering.`
- Compare title: `RedNote comment scraping options: extension, manual copy and cloud scraper`
- Compare description: `Compare RedNote comment collection methods by field completeness, speed, export quality, and analysis readiness.`
- Expected complete Top 10 terms: RedNote comment scraper, Xiaohongshu comment scraper, export RedNote comments

#### `/en/xiaohongshu/leads`

- Primary keyword: RedNote comment lead generation tool
- Secondary keywords: Xiaohongshu lead scraper, comment lead extraction, intent keyword filtering
- `metadata.title`: `RedNote Comment Lead Generation Tool for Xiaohongshu | MediaClaw`
- H1: `RedNote Comment Lead Generation Tool for High-Intent Prospects`
- Hero copy: `MediaClaw turns Xiaohongshu comment sections into a RedNote comment lead generation workflow. Collect comments first, then use buying-intent keywords, IP location, and raw comment text to surface high-intent prospects. Export lead-ready lists to Excel or CSV, or sync them to Lark Base for sales, private traffic, or local business follow-up.`
- Suggested compare title: `RedNote comment lead generation: extension filtering, manual review and outsourced sorting`
- Suggested compare description: `Lead generation from comments is about finding buying signals such as “where to buy”, “send link”, “price”, or “DM me”, not just exporting every comment.`
- Expected complete Top 10 terms: RedNote comment lead generation tool, Xiaohongshu lead scraper, comment lead extraction

#### `/en/xiaohongshu/keywords`

- Primary keyword: RedNote keyword research tool
- Secondary keywords: Xiaohongshu keyword tool, niche opportunity analysis, benchmark account finder
- `metadata.title`: `RedNote Keyword Research Tool for Xiaohongshu Niche Strategy`
- H1: `RedNote Keyword Research Tool for Niche Opportunity and Benchmark Accounts`
- Hero copy: `MediaClaw is a RedNote keyword research tool for planning Xiaohongshu content from one seed keyword. Judge whether a niche is worth pursuing, find benchmark accounts from search samples, expand long-tail autocomplete suggestions, cluster demand with AI, and trigger search result scraping to build a post sample library.`
- Table title: `Where RedNote keyword research fits into content decisions`
- Table description: `Connect keyword expansion, niche opportunity analysis, benchmark account discovery, and post scraping into one planning workflow.`
- Expected complete Top 10 terms: RedNote keyword research tool, Xiaohongshu keyword tool, benchmark account finder

#### `/en/xiaohongshu/monitoring`

- Primary keyword: RedNote competitor monitoring tool
- Secondary keywords: Xiaohongshu account monitoring, competitor content alerts, Lark alerts
- `metadata.title`: `RedNote Competitor Monitoring Tool with Xiaohongshu Lark Alerts`
- H1: `RedNote Competitor Monitoring Tool for Xiaohongshu Accounts`
- Hero copy: `MediaClaw is a RedNote competitor monitoring tool that tracks Xiaohongshu benchmark accounts, publishing activity, engagement changes, and high-performing posts. Set rules once, receive AI-summarized Lark alerts, and turn competitor content monitoring into a daily intelligence workflow without manually checking feeds.`
- Table title: `How teams use RedNote competitor monitoring`
- Table description: `Show how benchmark account tracking, content alerts, and Lark reports support weekly reviews, campaign planning, and competitive intelligence.`
- Expected complete Top 10 terms: RedNote competitor monitoring tool, Xiaohongshu account monitoring, competitor content alerts

#### `/en/xiaohongshu/downloader`

- Primary keyword: RedNote downloader without watermark
- Secondary keywords: Xiaohongshu video downloader, RedNote image downloader, batch media download
- `metadata.title`: `RedNote Downloader Without Watermark - Save Xiaohongshu Videos and Images`
- H1: `RedNote Downloader Without Watermark for Xiaohongshu Videos and Images`
- Hero copy: `MediaClaw is a free RedNote downloader without watermark for saving Xiaohongshu videos, image posts, covers, and Live Photos from your browser. Batch-download original media where available, keep a visual reference library, and use saved assets for content breakdowns, competitor research, and creative planning.`
- Compare title: `RedNote download options: extension, online parser, mini app and screen recording`
- Compare description: `Compare Xiaohongshu media download methods by quality, batch capability, watermark handling, and workflow cost.`
- Expected complete Top 10 terms: RedNote downloader without watermark, Xiaohongshu video downloader, RedNote image downloader

#### `/en/xiaohongshu/image-text`

- Primary keyword: RedNote image text extractor
- Secondary keywords: Xiaohongshu OCR, image copy extraction, card text OCR
- `metadata.title`: `RedNote Image Text Extractor - Xiaohongshu OCR for Image Cards`
- H1: `RedNote Image Text Extractor for Xiaohongshu Covers and Image Cards`
- Hero copy: `MediaClaw is a RedNote image text extractor that runs OCR on Xiaohongshu covers, image cards, book lists, pricing tables, tutorial steps, and product specs. The extracted text is written back to the collected record, then carried through copy, CSV export, Markdown export, or Lark Base sync for easier content analysis.`
- Table title: `Where RedNote image text extraction helps content teams`
- Table description: `Show how Xiaohongshu OCR fills the text gap in covers, image cards, product lists, tutorials, and competitor image posts.`
- Expected complete Top 10 terms: RedNote image text extractor, Xiaohongshu OCR, image copy extraction

#### `/en/xiaohongshu/transcript`

- Primary keyword: RedNote video transcript extractor
- Secondary keywords: Xiaohongshu video to text, timestamped transcript, voiceover script extraction
- `metadata.title`: `RedNote Video Transcript Extractor - Xiaohongshu Video to Text`
- H1: `RedNote Video Transcript Extractor for Xiaohongshu Voiceovers`
- Hero copy: `MediaClaw is a RedNote video transcript extractor that turns Xiaohongshu voiceovers into text from the collected record. Get a full transcript plus timestamped sentence-level output, then use it to study hooks, pacing, setup, turns, and closing lines or feed the script into AI for rewriting and content remixing.`
- Compare title: `RedNote video transcript extraction: in-extension extraction and Lark batch`
- Compare description: `Use in-extension extraction for a few videos and Lark batch transcription for larger workloads; both paths support Xiaohongshu video-to-text workflows.`
- Expected complete Top 10 terms: RedNote video transcript extractor, Xiaohongshu video to text, timestamped transcript

### Douyin

#### `/en/douyin/scraper`

- Primary keyword: Douyin scraper Chrome extension
- Secondary keywords: Douyin video scraper, Douyin data export, Douyin profile scraper
- `metadata.title`: `Free Douyin Scraper Chrome Extension for Videos, Profiles and Search`
- H1: `Douyin Scraper Chrome Extension for Videos, Profiles and Search Results`
- Hero copy: `MediaClaw is a free Douyin scraper Chrome extension for collecting public videos, creator profiles, and keyword search results in your browser. Export clean data to CSV, Excel, or Markdown, sync records to Lark Base, and backfill video transcripts, comments, engagement fields, and competitor signals for repeatable content research.`
- Compare title: `Douyin scraper options: Chrome extension, cloud scraper, scripts and APIs`
- Compare description: `Compare ways to collect Douyin data by setup cost, export quality, maintenance effort, and workflow fit.`
- Expected complete Top 10 terms: Douyin scraper Chrome extension, Douyin video scraper, Douyin data export

#### `/en/douyin/comments`

- Primary keyword: Douyin comment scraper
- Secondary keywords: export Douyin comments, Douyin comment analysis, Douyin comment scraper Chrome extension
- `metadata.title`: `Free Douyin Comment Scraper - Export Video Comments to Excel`
- H1: `Douyin Comment Scraper for Exporting Video Comments`
- Hero copy: `MediaClaw is a free Douyin comment scraper that collects public video comments, likes, timestamps, usernames, and profile links from your browser. Export comments to Excel or CSV, sync them to Lark Base, and use the dataset for sentiment analysis, audience research, topic planning, competitor review, and high-intent comment filtering.`
- Compare title: `Douyin comment scraping options: extension, manual copy and cloud scraper`
- Compare description: `Compare Douyin comment collection methods by field completeness, speed, export quality, and analysis readiness.`
- Expected complete Top 10 terms: Douyin comment scraper, export Douyin comments, Douyin comment analysis

#### `/en/douyin/leads`

- Primary keyword: Douyin comment lead generation tool
- Secondary keywords: Douyin lead scraper, Douyin comment leads, intent keyword filtering
- `metadata.title`: `Douyin Comment Lead Generation Tool for High-Intent Prospects`
- H1: `Douyin Comment Lead Generation Tool for Video Comment Sections`
- Hero copy: `MediaClaw turns Douyin comment sections into a comment lead generation workflow. Collect video comments first, then use buying-intent keywords, IP location, and raw comment text to surface high-intent prospects. Export lead-ready lists to Excel or CSV, or sync them to Lark Base for sales, private traffic, local business, or livestream commerce follow-up.`
- Suggested compare title: `Douyin comment lead generation: extension filtering, manual review and outsourced sorting`
- Suggested compare description: `Lead generation from Douyin comments is about finding buying signals such as price, link, stock, booking, or consultation intent, not just exporting every comment.`
- Expected complete Top 10 terms: Douyin comment lead generation tool, Douyin lead scraper, Douyin comment leads

#### `/en/douyin/keywords`

- Primary keyword: Douyin keyword research tool
- Secondary keywords: Douyin niche opportunity analysis, benchmark account finder, Douyin search suggestions
- `metadata.title`: `Douyin Keyword Research Tool for Niche Opportunity and Content Planning`
- H1: `Douyin Keyword Research Tool for Niche Opportunity and Benchmark Accounts`
- Hero copy: `MediaClaw is a Douyin keyword research tool for planning short-video content from one seed keyword. Judge whether a niche is worth pursuing, find benchmark accounts from search samples, expand autocomplete suggestions, cluster demand with AI, and trigger video sample scraping to build a reusable content research library.`
- Table title: `Where Douyin keyword research fits into content decisions`
- Table description: `Connect keyword expansion, niche opportunity analysis, benchmark account discovery, and video sample scraping into one planning workflow.`
- Expected complete Top 10 terms: Douyin keyword research tool, Douyin niche opportunity analysis, benchmark account finder

#### `/en/douyin/monitoring`

- Primary keyword: Douyin competitor monitoring tool
- Secondary keywords: Douyin account monitoring, competitor content alerts, Lark alerts
- `metadata.title`: `Douyin Competitor Monitoring Tool with Lark Alerts | MediaClaw`
- H1: `Douyin Competitor Monitoring Tool for Benchmark Accounts`
- Hero copy: `MediaClaw is a Douyin competitor monitoring tool that tracks benchmark accounts, publishing activity, engagement changes, and high-performing videos. Set rules once, receive AI-summarized Lark alerts, and turn competitor content monitoring into a daily intelligence workflow without manually checking feeds.`
- Table title: `How teams use Douyin competitor monitoring`
- Table description: `Show how benchmark account tracking, viral video alerts, and Lark reports support weekly reviews, campaign planning, and competitive intelligence.`
- Expected complete Top 10 terms: Douyin competitor monitoring tool, Douyin account monitoring, competitor content alerts

#### `/en/douyin/downloader`

- Primary keyword: Douyin downloader without watermark
- Secondary keywords: Douyin video downloader, Douyin MP4 link, batch video download
- `metadata.title`: `Douyin Downloader Without Watermark - Batch Save MP4 Videos`
- H1: `Douyin Downloader Without Watermark for Videos, Covers and Images`
- Hero copy: `MediaClaw is a free Douyin downloader without watermark for saving public videos, MP4 links, covers, and carousel images from your browser. Batch-save source media where available, then use the downloaded assets for remixing, beat-sync editing, content breakdowns, competitor research, and visual reference libraries.`
- Compare title: `Douyin download options: extension, online parser, mini app and screen recording`
- Compare description: `Compare Douyin download methods by quality, batch capability, watermark handling, and workflow cost.`
- Expected complete Top 10 terms: Douyin downloader without watermark, Douyin video downloader, Douyin MP4 link

#### `/en/douyin/image-text`

- Primary keyword: Douyin image text extractor
- Secondary keywords: Douyin OCR, carousel OCR, product card text recognition
- `metadata.title`: `Douyin Image Text Extractor - OCR Carousel Images to Text`
- H1: `Douyin Image Text Extractor for Covers and Carousel Posts`
- Hero copy: `MediaClaw is a Douyin image text extractor that runs OCR on covers, carousel images, product cards, tutorial steps, pricing tables, and specification lists. The extracted text is written back to the collected record, then carried through copy, CSV export, Markdown export, or Lark Base sync for easier product research and content analysis.`
- Table title: `Where Douyin image text extraction helps content teams`
- Table description: `Show how Douyin OCR fills the text gap in product cards, tutorial carousels, cover copy, and competitor image posts.`
- Expected complete Top 10 terms: Douyin image text extractor, Douyin OCR, product card text recognition

#### `/en/douyin/transcript`

- Primary keyword: Douyin video transcript extractor
- Secondary keywords: Douyin video to text, timestamped transcript, Douyin script extractor
- `metadata.title`: `Douyin Video Transcript Extractor - Video to Text with Timestamps`
- H1: `Douyin Video Transcript Extractor for Timestamped Short-Video Scripts`
- Hero copy: `MediaClaw is a Douyin video transcript extractor that turns public video voiceovers into text from the collected record. Get a full transcript plus timestamped sentence-level output, then use it to study hooks, pacing, setup, turns, and closing lines or feed the script into AI for rewriting and content remixing.`
- Compare title: `Douyin video transcript extraction: in-extension extraction and Lark batch`
- Compare description: `Use in-extension extraction for a few videos and Lark batch transcription for larger workloads; both paths support Douyin video-to-text workflows.`
- Expected complete Top 10 terms: Douyin video transcript extractor, Douyin video to text, timestamped transcript

## 批量修改建议

审核通过后，建议按以下顺序改：

1. 先改 32 个 `metadata.title`、32 个 H1、32 个 hero description。
2. 同步改 hero label / page title，让页面顶部、面包屑和导航语义一致。
3. 改已有 `compare` 或 `data-table` 标题/描述，避免对比对象抢主词。
4. 给小红书/抖音 `leads` 页补齐 `compare` 和 `safety` section，或者从 `show_sections` 移除未定义 section。
5. 本地重新跑关键词密度脚本，确认每页 Top 10 至少出现 2 个完整意图词。
6. 跑 `pnpm run build`，再跑 public-page smoke 或对应 e2e。
