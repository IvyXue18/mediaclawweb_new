# MediaClaw 官网内链建设方案与执行台账

> 文档状态：执行中
> 建立日期：2026-08-13
> 最近更新：2026-08-17
> 适用范围：MediaClaw 官网首页、平台 Hub、功能页、集成页、Docs、Blog、下载页及中英文版本

## 0. 文档用途与关联资料

本文档是 MediaClaw 内链建设的唯一执行台账，负责记录：

1. 页面之间应该如何链接，以及为什么链接。
2. 哪些链接已经上线、待实施或因页面未发布而阻塞。
3. 每批内链改动的来源页、目标页、锚文本、位置和上线日期。
4. 如何把内链改动与后续 SEO 周报、GSC/Bing 数据及下载转化做关联分析。

本文档不替代页面 SEO、内容或 Docs 方案，而是把它们连接起来：

- 官网与 SEO 总方案：[`v0.2-content-workflow-website-plan.md`](./v0.2-content-workflow-website-plan.md)
- 平台 Hub 关键词实证研究：[`research/platform-hub-keyword-research.md`](./research/platform-hub-keyword-research.md)
- 小红书 Hub 页面与素材设计：[`xiaohongshu-hub-page-design.md`](./xiaohongshu-hub-page-design.md)
- Docs 信息架构：[`docs-site-information-architecture-plan.md`](./docs-site-information-architecture-plan.md)
- TDK/H1/H2 基线：[`tdk-h1-h2-audit.md`](./tdk-h1-h2-audit.md)
- 功能页关键词与文案映射：[`seo-keyword-copy-review.md`](./seo-keyword-copy-review.md)
- 小红书采集页专项方案：[`scraper-seo-optimization-plan.md`](./scraper-seo-optimization-plan.md)

后续每份 SEO 周报应引用本文档中的“变更批次 ID”；本文档则在对应批次下补回 7/14/28 天结果，形成双向追踪。

---

## 1. 目标与非目标

### 1.1 目标

- 让用户和搜索引擎清楚理解“首页 → 平台 → 功能 → 教程/案例”的关系。
- 让所有需要收录的页面都能通过真实 HTML 链接被发现，不依赖站内搜索或 sitemap 单独发现。
- 将更多上下文内链分配给当前业务和 SEO 重点页，而不是让所有功能页获得完全相同的全站链接。
- 让功能页、教程和博客形成双向关系，同时保留下载转化的最短路径。
- 记录每批改动，避免同时修改 TDK、正文、导航和内链后无法归因。

### 1.2 非目标

- 不为了增加跳转次数而延长用户路径。
- 不把所有关键词都做成独立页面。
- 不通过重复、隐藏或关键词堆砌链接操纵排名。
- 不在教程未正式发布时创建指向教程的入口。
- 不把 sitemap 的 `priority` 当作页面权重控制手段。

---

## 2. 权威方法论基线

本方案采用以下 Google Search Central 原则：

1. Google 主要根据页面之间的链接关系理解站点结构和页面相对重要性，而不是只看 URL 目录层级。
2. 每个重要页面至少应从站内另一个可索引页面获得一个可抓取链接。
3. 内链使用真实的 `<a href>`，不能只依赖点击事件或站内搜索表单。
4. 锚文本应简洁、具体、与目标页面和当前上下文相关；避免“点击这里”“了解更多”等脱离上下文的通用文字。
5. 栏目/Hub 应链接到所属的重要详情页；相关内容页应在正文中自然互链。
6. sitemap 用于辅助 URL 发现，不替代站内导航和上下文链接。
7. Google 不使用 sitemap 中的 `priority` 和 `changefreq`；准确的 canonical、hreflang、`lastmod` 与真实内链更重要。

参考资料：

- [Help Google understand your site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- [Link best practices for Google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Sitelinks best practices](https://developers.google.com/search/docs/appearance/sitelinks)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

---

## 3. 目标页面架构

### 3.1 主层级

```text
首页 /
├── 小红书 Hub /xiaohongshu
│   ├── 小红书功能页 /xiaohongshu/*
│   ├── 对应 Docs /docs/*
│   └── 对应 Blog /blog/*
├── 抖音 Hub /douyin
│   ├── 抖音功能页 /douyin/*
│   ├── 对应 Docs /docs/*
│   └── 对应 Blog /blog/*
├── 集成 Hub /integrations                         [未来]
│   ├── 飞书集成 /features/feishu-integration      [保留现有 URL]
│   └── Codex / WorkBuddy / Trae 等                [发布后加入]
├── Docs /docs
├── Blog /blog
├── 下载 /download
└── 定价 /pricing
```

### 3.2 用户路径

探索型用户：

```text
首页/导航 → 平台 Hub → 功能页 → 下载
```

目标明确用户：

```text
导航具体功能 → 功能页 → 下载
```

学习型用户：

```text
Google/Blog/Docs → 教程或文章 → 对应功能页 → 下载
```

“场景”只作为平台 Hub 内的分类和正文路径，当前不增加必须经过的场景 URL。

---

## 4. 全局向首页传递权重的方案

### 4.1 原则

全站确实应该存在稳定的首页回链，但不应在一个页面内机械重复多个“首页”链接。站点级链接建立基础回流，上下文链接表达语义关系，两者作用不同。

### 4.2 必须保留的首页回链

| 位置          | 实现规则                                                                          | 覆盖范围                   | 目的                         |
| ------------- | --------------------------------------------------------------------------------- | -------------------------- | ---------------------------- |
| Header Logo   | Logo 使用可抓取的 locale-aware `<a href="/">`；可访问名称为 `MediaClaw 首页/Home` | 所有公开页                 | 最稳定的全站首页回链         |
| 面包屑首项    | 深层页面使用 `首页 → 平台/栏目 → 当前页`                                          | 功能页、Docs、Blog、集成页 | 建立明确的向上层级           |
| 平台 Hub 上行 | Hub 面包屑和必要的品牌说明链接回首页                                              | `/xiaohongshu`、`/douyin`  | 完成首页与平台中心的双向连接 |
| Footer 品牌区 | 品牌名称/Logo 链接首页；不再额外堆多条“返回首页”                                  | 所有公开页                 | 兜底导航和品牌归属           |

### 4.3 不建议的做法

- 不在每篇正文结尾强行增加“返回首页”。
- 不在同一页用“官网、首页、MediaClaw、主页”等多个锚文本反复链接 `/`。
- 不给站内首页链接添加 `nofollow`。
- 不用带追踪参数的首页 URL 作为 SEO 内链，例如 `/?source=footer`；埋点通过事件属性完成。
- 不把中文页链接到错误语言的首页；内部 URL 由 locale-aware Link 统一处理。

### 4.4 权重不是单向汇集

首页不应成为只进不出的“权重仓库”。正确结构是循环流动：

```text
深层页面 ──Logo/面包屑──→ 首页
首页 ──平台入口/重点功能──→ Hub 与战略页面
Hub ──全部功能/场景路径──→ 功能页
功能页 ──上下游/教程/案例──→ 相关深层页面
```

外部链接若指向博客、教程或某个功能页，也可以通过面包屑和平台 Hub 回流到首页；因此不必要求所有站外链接只指向首页。

### 4.5 首页回链验收

- 每个公开页面的渲染 HTML 中至少存在一个指向当前语言首页的 `<a href>`。
- 功能页与 Docs 详情页的面包屑首项可以点击首页。
- Logo 与面包屑链接不带临时参数。
- `/` 与 `/en` 的 canonical/hreflang 和站内语言链接一致。
- 同一模板中不制造多个无语义差异的首页链接。

当前实现基线（2026-08-13）：

- [x] Header Logo 已使用 locale-aware `Link href="/"`，全站公开模板可以稳定回到当前语言首页。
- [x] 现有功能页的面包屑已普遍包含可点击“首页”。
- [x] Footer 底部品牌名已改为唯一一个品牌首页链接（2026-08-17）。
- [ ] Docs 与 Blog 详情页当前主要依赖 Header Logo 回到站点首页；重做面包屑时再补站点首页层级，避免额外增加重复按钮。
- [x] 功能页面包屑的“小红书/抖音”已成为指向对应 Hub 的真实上级链接（2026-08-17）。

---

## 5. 各页面类型的内链职责

| 页面类型  | 必须链接                             | 建议链接                                | 不应承担                   |
| --------- | ------------------------------------ | --------------------------------------- | -------------------------- |
| 首页      | 小红书 Hub、抖音 Hub、下载、核心集成 | 4-6 个战略功能、最新/重点内容           | 平铺所有功能和所有文章     |
| 平台 Hub  | 当前平台全部已发布功能               | 重点教程、案例、另一平台 Hub            | 复制所有功能页正文         |
| 功能页    | 首页、平台 Hub、下载                 | 2-4 个上下游功能、1-3 个已发布教程/案例 | 头部用教程取代转化 CTA     |
| Docs 首页 | 主要文档栏目、首页                   | 平台 Hub、下载                          | 复制营销页内容             |
| Docs 详情 | 首页、Docs 首页、上级分组            | 对应功能页、前后教程、下载              | 未经发布验收就获得全站入口 |
| Blog 首页 | 首页、分类页、文章页                 | 平台 Hub、重点功能                      | 只按时间排列、无主题关系   |
| Blog 详情 | 首页、Blog 首页、相关文章            | 1 个主功能、0-2 个辅助功能/教程         | 每篇统一塞入相同商业链接   |
| 集成页    | 首页、集成 Hub、下载                 | 涉及的功能和工作流教程                  | 与功能页争抢相同主关键词   |
| 下载页    | 首页、定价、安装 Docs（发布后）      | 平台 Hub、常见问题                      | 向大量低相关页面分散转化   |

---

## 6. 平台 Hub 与导航链接规则

### 6.1 Hub 场景分组

两个平台沿用相同信息模型，但功能名称和曝光顺序允许不同。首版排序依据
2026-05-01 至 2026-08-11 的 GSC Query × Page、Bing Query Stats、页面成熟度和产品战略共同决定：

1. 找方向与研究样本：关键词洞察、爆款分析、账号分析。
2. 采集数据与素材：笔记/视频采集、评论采集、去水印下载。
3. 提取、洞察与转化：图文文案、视频逐字稿、客资采集。
4. 持续跟踪与协作：竞品监控、飞书及未来 Agent 集成。

Hub 必须链接当前平台所有已发布功能，不能让“更多功能”只存在于站内搜索中。

### 6.2 顶部导航

推荐一级导航：

```text
产品与功能 | 集成 | 资源 | 下载 | 定价
```

“产品与功能”内部使用平台 Tab。点击具体功能直接进功能页；点击平台名称或“查看全部功能”进入 Hub。

首版直接曝光：

| 小红书       | 抖音       |
| ------------ | ---------- |
| 账号分析     | 账号分析   |
| 爆款分析     | 爆款分析   |
| 笔记采集     | 视频逐字稿 |
| 去水印下载   | 视频采集   |
| 图文文案提取 | 评论采集   |
| 视频逐字稿   | 去水印下载 |

其余功能原地展开。折叠只影响视觉展示，链接应保留在渲染后的 HTML 中。

本次排序不是永久配置：账号分析、爆款分析是新战略页；其余入口来自当前真实搜索需求。
导航点击、下载转化和新页面 28 天搜索数据齐备后再复盘，不按单周波动频繁调整。

### 6.3 页脚

页脚按平台拆成两个同级栏目，栏目标题本身链接平台 Hub，不再额外使用
“核心功能 → 平台”这一层说明。每个平台栏目列出 10 个已发布功能页，并保留：

- 集成、Docs、Blog、下载、定价。
- 法律和品牌链接。

这样页脚承担全站功能入口兜底，平台 Hub 负责按场景解释完整工作流；两处使用同一套
功能名称与排序，避免锚文本和信息架构漂移。

---

## 7. 功能页、Docs 与 Blog 的互链规则

### 7.1 功能页

Hero 固定规则：

- 主按钮：中文 `我要使用`，英文 `Get Started`，指向下载页。
- 次按钮：`效果演示`，仅在真实视频或动图可用时显示。
- Hero 不放教程按钮。

正文内链规则：

- 在具体步骤、比较表或“下一步”模块中加入链接。
- 每页目标为 3-5 个上下文内链，不含 Header、Footer 和 Breadcrumb。
- 其中至少 1 个链接回平台 Hub；2-4 个链接指向真实上下游页面。
- 锚文本包含平台和任务，例如“小红书账号分析”，不使用孤立的“了解更多”。

### 7.2 Docs

教程只有同时满足以下条件才允许被功能页链接：

- URL 返回 200。
- 正文、截图和步骤通过验收。
- canonical、语言版本和 sitemap 状态正确。
- 页面没有占位内容或失效操作。

教程正式发布后建立双向映射：

```text
功能页步骤 → 精确教程
教程“本教程使用的功能” → 对应功能页
```

### 7.3 Blog

每篇文章增加或维护以下逻辑字段：

```yaml
primary_feature: /xiaohongshu/account-analysis
supporting_features:
  - /xiaohongshu/monitoring
related_docs:
  - /docs/benchmark/find-accounts
```

规则：

- 每篇文章只指定一个主商业页面。
- 正文相关段落自然链接一次，文末可再展示“相关功能”。
- `supporting_features` 最多 2 个。
- 双平台文章可分别链接两个对应功能，但必须有平台上下文。
- “相关文章”算法继续负责 Blog ↔ Blog，不替代 Blog → 功能页映射。

---

## 8. SEO 周报关联与归因方法

### 8.1 每批内链变更必须记录

| 字段              | 说明                                                       |
| ----------------- | ---------------------------------------------------------- |
| Batch ID          | 唯一批次，如 `IL-2026-08-13-A`                             |
| 上线时间          | 精确到日期；重大部署记录版本/commit                        |
| 来源页            | 新增链接所在 URL                                           |
| 目标页            | 接收链接的 URL                                             |
| 链接类型          | 导航、Hub 卡片、面包屑、正文、相关推荐、Docs、Blog、Footer |
| 锚文本            | 中英文分别记录                                             |
| 位置              | 首屏、中段步骤、文末、全站模板等                           |
| 同批其他 SEO 改动 | TDK、H1、正文、结构化数据是否同时变化                      |
| 预期              | 收录、排名、CTR、导航点击或下载转化                        |
| 观察窗口          | D+7、D+14、D+28                                            |

### 8.2 周报必须增加的字段

后续 SEO 报告按 URL 增加：

| 字段                      | 数据来源              |
| ------------------------- | --------------------- |
| Internal Link Batch IDs   | 本文档执行台账        |
| 首次获得内链日期          | 本文档                |
| 当前站内来源页数          | 内链爬取/构建审计     |
| 主要锚文本                | 内链爬取/本文档       |
| GSC 展现、点击、CTR、排名 | GSC，比较前后等长窗口 |
| Bing 展现、点击、排名     | Bing Webmaster        |
| 目标页收录状态            | GSC/Bing URL 检查     |
| Hub/上下文链接点击        | 官网事件分析          |
| `我要使用`/下载转化       | 官网事件分析          |

### 8.3 分析规则

1. 使用上线前 14 天与上线后 14 天的等长窗口；D+7 只看抓取和方向，不下排名结论。
2. 同批若修改 TDK、H1 或大段正文，标记为“混合变更”，不得把结果单独归因于内链。
3. 记录目标页变化，也观察来源页是否因导出链接而受到影响。
4. 区分品牌词和非品牌词，避免首页品牌查询增长掩盖功能词表现。
5. 检查同一查询是否从一个页面分散到多个页面，防止平台 Hub 与功能页关键词内耗。
6. 低样本页面不因单周波动撤销链接，至少观察 28 天或两个完整 14 天窗口。

### 8.4 建议判断标签

- `positive`：收录/排名/点击或转化有一致改善，没有明显内耗。
- `neutral`：已抓取但数据变化不足，继续观察。
- `mixed`：搜索指标改善但转化下降，或目标页提升但来源页明显下降。
- `negative`：出现错误跳转、语言错链、关键词内耗或持续下降。
- `inconclusive`：样本不足或同批改动过多，无法归因。

---

## 9. 埋点与产品数据

需要补充事件：

```text
nav_open
nav_platform_select
nav_feature_impression
nav_feature_click
nav_more_expand
hub_feature_click
contextual_link_click
feature_download_click
```

共同属性：

```text
platform
feature
source_page
target_page
placement
position
expanded
locale
```

导航直接曝光排序不只看原始点击次数，使用：

- 菜单点击率。
- 功能页下载转化率。
- GSC/Bing 搜索需求。
- 页面成熟度和产品战略权重。

建议导航 UI 每 2-4 周复盘一次；SEO 架构至少观察 8-12 周，不频繁重排。

---

## 10. 当前基线审计（2026-08-13）

### 10.1 已具备

- [x] 20 个小红书/抖音功能页均存在稳定 URL。
- [x] 功能页已普遍具备 3-5 个“相关功能”链接。
- [x] 首页、Header、Footer 已能链接功能页。
- [x] Blog 详情页已具备 Blog ↔ Blog 的相关文章推荐。
- [x] Docs 已具备 Docs 首页、分组、面包屑及前后篇结构（正式发布状态仍需逐页验收）。
- [x] Sitemap 已覆盖现有功能页和 Blog，并输出中英文 hreflang。
- [x] 账号分析与爆款分析中英文页面的失效教程入口已移除。
- [x] GrowthOps 已能使用现有凭据拉取 GSC 与 Bing 数据；首轮 Hub 查询研究已完成。
- [x] 已确定 Hub 宽泛类目语义与功能页强任务词的边界。

### 10.2 主要缺口

- [x] `/xiaohongshu` 平台 Hub 已上线（含 canonical/hreflang、CollectionPage/ItemList/BreadcrumbList/FAQPage）。
- [x] `/douyin` 平台 Hub 已上线，复用同一信息模型。
- [x] 功能页面包屑中的平台项已统一链接到对应 Hub（20 页 × 中英文 = 40 份配置）。
- [x] Header 已按平台分组曝光 6 个重点功能，其余 4 个原地展开；平台标题与“查看全部功能”指向 Hub。
- [x] Footer 已改为两个平台 Hub 标题 + 各平台 10 个已发布功能页，名称与 Hub 目录一致。
- [ ] Docs → 功能页的商业映射尚未建立；教程发布门槛尚未程序化。
- [ ] Blog → 功能页缺少统一的 `primary_feature` 映射字段。
- [x] 分析事件白名单已包含 Hub 与导航事件；`contextual_link_click` 已放行，等第三批正文内链接入时开始上报。
- [ ] BreadcrumbList 结构化数据仅覆盖两个 Hub；功能页、Docs 与 Blog 待补（第三批）。
- [x] Sitemap 已移除 Google 不使用的 `priority`、`changefreq`，并收录两个 Hub。
- [ ] Sitemap 的 Docs 详情覆盖仍需复核。

### 10.3 当前内链分布提示

功能页之间的站内链接目前明显偏向既有采集页：

| 页面           | 来自同平台功能页的链接数（中文配置基线） |
| -------------- | ---------------------------------------: |
| 小红书笔记采集 |                                        9 |
| 小红书评论采集 |                                        7 |
| 小红书账号分析 |                                        3 |
| 小红书爆款分析 |                                        2 |
| 抖音视频采集   |                                        9 |
| 抖音账号分析   |                                        3 |
| 抖音爆款分析   |                                        2 |

这不代表要删除采集页链接，而是说明 Hub 与相关正文上线后，应补足账号分析、爆款分析等战略页的自然来源。

---

## 11. 执行台账

状态：`planned` / `in_progress` / `blocked` / `live` / `measuring` / `reviewed`

| Batch ID          | 状态          | 日期       | 变更                                                                                                                                                                     | 关联 SEO 计划                                     | D+7      | D+14   | D+28   |
| ----------------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------- | ------ | ------ |
| `IL-2026-08-12-A` | `live`        | 2026-08-12 | 小红书/抖音账号分析、爆款分析共 4 个功能页（中英文 8 份配置）移除未发布教程链接；Hero 主 CTA 统一到下载页                                                                | N0/N1/N2 页面发布与错误链接清理；commit `80eca33` | 待周报   | 待周报 | 待周报 |
| `IL-2026-08-13-A` | `in_progress` | 待定       | 上线 `/xiaohongshu` Hub；首页、导航、面包屑与相关功能链接接入 Hub。Hub 页面、首页入口与面包屑已完成（见 `IL-2026-08-17-A`）；导航入口留在 `IL-2026-08-13-B`              | N0 小红书 Hub                                     | —        | —      | —      |
| `IL-2026-08-13-B` | `in_progress` | 待部署     | 重构“核心功能”导航：平台分组标题指向 Hub、6 个直接曝光、其余原地展开（见 `IL-2026-08-17-B`）                                                                             | 官网 IA + 导航点击实验                            | —        | —      | —      |
| `IL-2026-08-13-C` | `in_progress` | 待部署     | Footer 重组：平台 Hub 成为同级栏目标题，各自完整列出 10 个已发布功能页（见 `IL-2026-08-17-B`）                                                                           | 全站功能入口兜底与栏目对齐                        | —        | —      | —      |
| `IL-2026-08-13-D` | `in_progress` | 待定       | 上线 `/douyin` Hub，并复用小红书 Hub 信息模型。Hub 页面与本批内链已完成（见 `IL-2026-08-17-A`）                                                                          | N1 抖音 Hub                                       | —        | —      | —      |
| `IL-2026-08-13-E` | `blocked`     | 待定       | 功能页 ↔ Docs 双向链接                                                                                                                                                   | 阻塞：教程需逐页达到正式发布门槛                  | —        | —      | —      |
| `IL-2026-08-13-F` | `planned`     | 待定       | Blog 增加 `primary_feature`/`supporting_features`/`related_docs` 映射                                                                                                    | Blog SEO 与商业转化                               | —        | —      | —      |
| `IL-2026-08-14-A` | `reviewed`    | 2026-08-14 | 复用 GrowthOps 拉取 2026-05-01 至 2026-08-11 的 GSC/Bing 数据；完成 Hub/功能页关键词边界、重点入口排序及错位查询清单                                                     | 平台 Hub 关键词实证研究                           | 基线完成 | —      | —      |
| `IL-2026-08-17-A` | `in_progress` | 待部署     | 站内接入第一批：首页平台卡改指 Hub、40 份功能页面包屑接 Hub、Hub 互链、sitemap/llms 收录 Hub 并移除 `priority`/`changefreq`                                              | `IL-2026-08-13-A` / `IL-2026-08-13-D` 的内链部分  | —        | —      | —      |
| `IL-2026-08-17-B` | `in_progress` | 待部署     | 站内接入第二批：Header 平台分组接 Hub + 6 个直接曝光 + 其余原地展开；Footer 以两个 Hub 为栏目标题并全量链接已发布功能页，同时补 `/docs`；Footer 品牌区首页链接；导航埋点 | `IL-2026-08-13-B` / `IL-2026-08-13-C`             | —        | —      | —      |

### IL-2026-08-17-A

- 状态：in_progress（代码完成，待部署）
- 上线时间：待填
- Commit / Deployment：待填
- 目标：让两个平台 Hub 从首页和 20 个功能页获得稳定的真实入链，并进入 sitemap / `llms.txt`
- 来源页：`/`、`/en`、20 个平台功能页（中英文共 40 个 URL）、`/xiaohongshu`、`/douyin`
- 目标页：`/xiaohongshu`、`/douyin`（含 `/en` 版本）
- 中文锚文本：`小红书能力集`、`抖音能力集`（首页卡片）；`小红书`、`抖音`（功能页面包屑）；`查看抖音工具`、`查看小红书工具`（Hub 互链）
- 英文锚文本：`Xiaohongshu (RedNote)`、`Douyin (TikTok China)`；`Xiaohongshu`、`Douyin`；`See Douyin tools`、`See RedNote tools`
- 链接位置：首页平台区块整卡链接、功能页首屏面包屑第二项、Hub FAQ 与最终 CTA 之间的次级条
- 同批其他 SEO 改动：sitemap 移除 `priority`/`changefreq` 并新增两个 Hub URL；`llms.txt`/`llms-full.txt` 新增两个 Hub 条目。TDK、H1、正文未改动
- 附带修复：功能页面包屑父级链接改为精确匹配，避免子页面上出现错误的 `aria-current="page"`；Hub 埋点的 `platform` 属性改为按平台取值（此前抖音 Hub 也上报 `xiaohongshu`），并把 `hub_secondary_cta_click`、`hub_cross_platform_click` 加入事件白名单
- 上线前 14 天基线：待 GrowthOps 拉取
- D+7：
- D+14：
- D+28：
- 结论：
- 下一步：第二批（Header 平台 Tab + 6 个直接曝光、Footer 平台栏目重组、导航埋点）

### IL-2026-08-17-B

- 状态：in_progress（代码完成，待部署）
- 上线时间：待填
- Commit / Deployment：待填
- 目标：让 Header 负责重点功能发现，Footer 以两个平台 Hub 为同级栏目标题，并为各自 10 个已发布功能页提供稳定的全站兜底入口
- 来源页：全站公开模板（Header、Footer）
- 目标页：`/xiaohongshu`、`/douyin`、两个平台各 10 个已发布功能页、`/features/feishu-integration`、`/docs`、`/`
- 中文锚文本：`小红书 查看全部功能` / `抖音 查看全部功能`（导航分组标题行）、`小红书内容工作流` / `抖音内容工作流`（Footer 栏目标题）、Hub 目录中的 20 个功能名称、`产品文档`
- 英文锚文本：`Xiaohongshu See all features` / `Douyin See all features`、`RedNote Workflow` / `Douyin Workflow`、Hub 目录中的 20 个英文功能名称、`Docs`
- 链接位置：Header 下拉“核心功能”两个平台列的标题行、Footer 两个平台栏目与资源列、Footer 品牌区
- 具体改动：
  - Header 每个平台按 §6.2 首版顺序曝光 6 个功能，其余 4 个通过“更多 N 项功能”原地展开；折叠项仍以 `class="hidden"` 出现在 SSR HTML 中，链接不依赖客户端运行
  - 平台名与“查看全部功能”合并为同一行链接指向 Hub。§6.2 写的是两个入口并存，实测两条独立链接在列底堆成两行小字，视觉上很差；合并后平台名和“查看全部功能”仍然都可点击，语义不变，每列只产生一条 Hub 链接
  - 面板由三列（生态列只有一项，空掉三分之一）改为两列平台 + 底部整条生态区
  - Footer 移除“核心功能 → 小红书/抖音/集成”说明层；`小红书内容工作流`、`抖音内容工作流` 直接成为同级可点击栏目标题
  - 两个平台栏目按各自 Hub 目录的名称与顺序，完整列出 10 个已有独立页面的功能；Codex / WorkBuddy 尚无独立页面，不创建空链接，飞书保留在独立“集成”栏目
  - Footer 资源列补 `/docs`
  - Footer 底部品牌名成为唯一的品牌区首页链接（§4.2）
  - 下拉面板加 `max-height` + 内部滚动：展开后在矮屏笔记本上不会溢出到视口外（悬停面板一旦移出指针就关闭）
  - 面板背景由 `bg-card/95` 改为不透明 `bg-popover`，移动端抽屉展开时同样转不透明——半透明在满屏尺寸下会把页面内容透出来
- 同批其他 SEO 改动：无 TDK / H1 / 正文改动；仅模板链接结构与导航顺序
- 埋点：新增 `nav_open`（每页每菜单一次）、`nav_platform_select`（`placement: group_header`）、`nav_feature_click`（带 `platform` / `feature` / `position` / `expanded`）、`nav_more_expand`；`contextual_link_click` 已放行待第三批使用
- 与 §9 的偏差：未实现逐条 `nav_feature_impression`。事件接口对同名事件限流 50ms，一次菜单打开触发 12 条会被丢弃大半；菜单点击率的分母改用 `nav_open`（每页每菜单去重一次）。若后续确实需要逐条曝光，应先做客户端批量上报
- 上线前 14 天基线：待 GrowthOps 拉取（重点：两个 Hub 与 20 个功能页的收录、点击及站内入口变化）
- D+7：
- D+14：
- D+28：
- 结论：
- 下一步：第三批（功能页 BreadcrumbList、正文上下文内链补足账号分析与爆款分析来源）
- 回滚方式：本批仅改 `header.tsx` / `footer.tsx` / `site-footer.tsx` 与 `site.footer.*` message keys，可单独 revert 而不影响 `IL-2026-08-17-A`

### 批次明细模板

复制以下模板记录每次实施：

```markdown
### IL-YYYY-MM-DD-X

- 状态：planned / live / measuring / reviewed
- 上线时间：
- Commit / Deployment：
- 目标：
- 来源页：
- 目标页：
- 中文锚文本：
- 英文锚文本：
- 链接位置：
- 同批其他 SEO 改动：无 / TDK / H1 / 正文 / Schema
- 上线前 14 天基线：
- D+7：
- D+14：
- D+28：
- 结论：positive / neutral / mixed / negative / inconclusive
- 下一步：
```

---

## 12. 实施顺序

### Phase 1：建立平台骨架

1. [x] 完成 GSC/Bing 关键词实证研究与首版关键词边界。
2. [x] 上线小红书 Hub。
3. [x] Header 改为平台分组 + 重点功能曝光。
4. [x] 首页、Breadcrumb、Hub 互链、Header、Footer 全部接入平台 Hub。
5. [x] Hub 与导航埋点已上线（`nav_feature_impression` 的偏差见 `IL-2026-08-17-B`）。

### Phase 2：复制与去重

1. [x] 基于相同组件上线抖音 Hub。
2. [x] Footer 以两个 Hub 为同级栏目标题，并完整列出各平台已发布功能页。
3. [ ] 重做功能页上下文内链，补足账号分析和爆款分析来源。
4. [ ] 加入 BreadcrumbList 并复核 canonical/hreflang。

### Phase 3：内容网络

1. Docs 正式发布后建立功能 ↔ 教程双向映射。
2. Blog 增加主功能映射与内容内链审核。
3. 集成页面与相关工作流互链。
4. 按周报补回 D+7/D+14/D+28 结果。

---

## 13. 每批发布检查

- [ ] 来源页和目标页均返回 200。
- [ ] 链接为真实 `<a href>`，不是只有 JavaScript 点击事件。
- [ ] 中文与英文跳转到正确语言版本。
- [ ] 锚文本自然、具体，没有关键词堆砌。
- [ ] 不链接未发布、空白或报错教程。
- [ ] 新 Hub/页面进入 sitemap、`llms.txt` 和 `llms-full.txt`。
- [ ] canonical、hreflang 与实际内链 URL 一致。
- [ ] 面包屑可见路径与 BreadcrumbList 一致。
- [ ] 记录 Batch ID、上线日期、commit/deployment。
- [ ] 建立上线前 14 天 GSC/Bing/转化基线。
- [ ] 安排 D+7、D+14、D+28 复盘。

---

## 14. 一句话执行准则

> 全站模板建立稳定层级，Hub 负责完整发现，正文链接表达真实关系，教程与博客支撑商业页面，下载 CTA 始终保持最短转化路径；每一次改动都必须可追踪、可复盘、可撤销。
