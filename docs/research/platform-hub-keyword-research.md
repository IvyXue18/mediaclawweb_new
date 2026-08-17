# 平台 Hub 与功能页关键词流量研究

> 状态：第一轮真实查询调研完成，进入 Hub 页面设计
> 建立日期：2026-08-14
> 最近更新：2026-08-14
> 关联文档：[`internal-link-building-and-tracking.md`](../internal-link-building-and-tracking.md)、[`seo-keyword-copy-review.md`](../seo-keyword-copy-review.md)

> 页面方案：[`xiaohongshu-hub-page-design.md`](../xiaohongshu-hub-page-design.md)

## 1. 研究结论

1. 小红书、抖音都应该建立独立平台 Hub，但 Hub 首要职责是平台总入口、功能发现和内链中枢，不是替代功能页争抢高意图流量。
2. 目前真实搜索需求集中在“平台 + 明确任务”：采集、下载、评论、逐字稿、账号查看/分析等。`小红书运营工具`、`抖音运营工具`、`Xiaohongshu tools`、`Douyin tools` 等平台集合词的本站实际数据仍弱。
3. Hub 可承接宽泛的“平台工具/插件/数据工具”意图，同时在 Title、H1 和正文中自然说明研究、采集、分析、复用等能力；不可把采集、下载或逐字稿等强任务词设为 Hub 主词。
4. 两个平台使用同一 Hub 组件和场景信息模型，但首屏重点功能的顺序应允许不同。共同结构有利于用户学习和后续复用到 TikTok，平台差异则由真实搜索需求、产品战略和页面成熟度决定。
5. 账号分析、爆款分析于 2026-08-12 前后刚上线，历史搜索数据不能用于否定这两个页面。两页先按产品战略获得 Hub 重点曝光，至少观察 28 天再判断自然搜索表现。
6. 英文 `douyin profile viewer` 已有明显需求，但历史上主要由 `/en/douyin/scraper` 错位承接；新账号分析页应逐步接管该词，不能通过一次性大改旧页制造流量风险。

## 2. 数据源与口径

本轮直接复用 `/Users/xueyangchun/Desktop/Projects/growth-ops` 中已配置的只读连接器和凭据，没有在官网项目中重复接入 API。

| 数据源                | 查询范围                 |          本轮数据量 | 用途与限制                                                                            |
| --------------------- | ------------------------ | ------------------: | ------------------------------------------------------------------------------------- |
| Google Search Console | 2026-05-01 至 2026-08-11 | 358 条 Query × Page | 可判断 Google 实际查询、当前展示页和关键词内耗；低量查询受隐私阈值影响                |
| Bing Webmaster Tools  | 2026-05-01 至 2026-08-07 |  637 条 Query Stats | 主要观察中文实际查询；当前账户未返回 Query × Page，因此页面归属以 GSC 和现有 URL 为准 |
| Similarweb 截图       | 用户提供                 |          候选词参考 | 只用于发现外部候选词，不作为本站页面主词的唯一证据                                    |

GrowthOps 连通性复核结果：

- GSC 与 Bing 均可使用现有凭据成功拉取，不需要重新申请 API。
- 旧报告中的 `fetch failed` 是历史运行问题，不代表当前凭据失效。
- 本轮数据是“本站已经产生曝光的真实需求”，不是全市场关键词搜索量。站点从未获得曝光的词仍需以后用 Semrush、DataForSEO 或广告关键词规划工具补充。

## 3. 搜索需求结构

### 3.1 Google：小红书 / RedNote

| 意图簇         | 点击 | 展现 |   CTR | 代表查询                                                       |
| -------------- | ---: | ---: | ----: | -------------------------------------------------------------- |
| 采集           |   10 |  927 |  1.1% | `red note scraper`、`xiaohongshu scraper`、`rednote scraper`   |
| 下载/去水印    |   19 |  688 |  2.8% | `小红书图片下载`、`小红书无水印图片`、`xiaohongshu downloader` |
| 图文/文字提取  |    0 |  111 |    0% | `小红书笔记文字提取`、`xiaohongshu screenshot`                 |
| 视频逐字稿     |   11 |   47 | 23.4% | `xiaohongshu video transcript`、`rednote transcript`           |
| 平台宽泛工具词 |    0 |   28 |    0% | `rednote extension`、`xiaohongshu data`、`小红书插件`          |
| 评论           |    0 |    9 |    0% | `小红书评论`、`小红书查评论`                                   |

判断：小红书现阶段最大的 Google 机会仍在 scraper 与 downloader，Hub 不应覆盖这两个词。英文 scraper 曝光高但 CTR 很低，应作为独立页面专项优化，而不是把需求转移到 Hub。

### 3.2 Google：抖音 / Douyin

| 意图簇         | 点击 | 展现 |   CTR | 代表查询                                                     |
| -------------- | ---: | ---: | ----: | ------------------------------------------------------------ |
| 采集           |   10 |  833 |  1.2% | `douyin scraper`、`抖音数据采集`                             |
| 下载/去水印    |    3 |  425 |  0.7% | `抖音无水印下载`、`douyin video downloader extension`        |
| 视频逐字稿     |   90 |  420 | 21.4% | `douyin transcript`、`douyin video transcript`               |
| 账号查看/分析  |   60 |  261 | 23.0% | `douyin profile viewer`、`douyin profile viewer online`      |
| 评论           |   11 |  132 |  8.3% | `抖音查评论`、`抖音评论`、`抖音查评论工具`                   |
| 平台宽泛工具词 |    2 |   54 |  3.7% | `douyin extension`、`douyin chrome extension`、`douyin data` |

判断：抖音搜索需求比小红书更分散，逐字稿和账号查看已经形成高 CTR 入口；Hub 应明确展示这些入口，但不能把 `Douyin transcript`、`Douyin profile viewer` 写成自己的主词。

### 3.3 Bing：中文需求

小红书的主要实际查询：

| 查询/意图        | 点击 | 展现 | 建议承接页                                               |
| ---------------- | ---: | ---: | -------------------------------------------------------- |
| 小红书采集       |    1 |   26 | `/xiaohongshu/scraper`                                   |
| 小红书数据采集   |    3 |   14 | `/xiaohongshu/scraper`                                   |
| 小红书评论采集   |    2 |   14 | `/xiaohongshu/comments`                                  |
| 小红书文案提取   |    3 |   10 | `/xiaohongshu/image-text`；视频文案按语境导向 transcript |
| 小红书视频转文字 |    2 |    9 | `/xiaohongshu/transcript`                                |
| 小红书插件       |    0 |    6 | `/xiaohongshu` Hub                                       |

抖音的主要实际查询：

| 查询/意图      | 点击 | 展现 | 建议承接页         |
| -------------- | ---: | ---: | ------------------ |
| 抖音评论查询   |    7 |   52 | `/douyin/comments` |
| 抖音采集       |   13 |   48 | `/douyin/scraper`  |
| 抖音视频采集   |    6 |   33 | `/douyin/scraper`  |
| 抖音评论采集   |    6 |   28 | `/douyin/comments` |
| 抖音查评论工具 |    3 |   12 | `/douyin/comments` |
| 抖音评论导出   |    4 |   10 | `/douyin/comments` |

判断：Bing 中文数据进一步证明“任务词 > 平台集合词”。Hub 应通过链接帮助这些强功能页获得稳定的上级入口，而不是复制它们的关键词和正文。

## 4. 页面关键词边界

### 4.1 平台 Hub

| 页面           | 中文主语义                   | 英文主语义                  | 可用辅助表达                     | 不应争抢的主词                                                                                    |
| -------------- | ---------------------------- | --------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/xiaohongshu` | 小红书数据采集与内容分析工具 | RedNote & Xiaohongshu tools | 小红书插件、研究/采集/分析工作流 | 小红书采集、小红书图片下载、RedNote scraper、Xiaohongshu downloader、Xiaohongshu video transcript |
| `/douyin`      | 抖音数据采集与内容分析工具   | Douyin tools                | 抖音插件、研究/采集/分析工作流   | 抖音采集、抖音评论查询、Douyin scraper、Douyin transcript、Douyin profile viewer                  |

这些不是“已证明拥有大搜索量的精确主词”，而是基于当前查询证据选出的低冲突类目语义。Hub 首版应按该边界上线，发布后用 GSC/Bing 实际查询再调整。

推荐首版元信息方向：

| 页面           | Title 方向                                             | H1 方向                                |
| -------------- | ------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| 小红书中文 Hub | `小红书数据采集与内容分析工具｜MediaClaw`              | `一站式完成小红书内容研究、采集与分析` |
| 小红书英文 Hub | `RedNote & Xiaohongshu Tools for Research and Analysis | MediaClaw`                             | `Research, collect and analyze RedNote content in one workflow` |
| 抖音中文 Hub   | `抖音数据采集与内容分析工具｜MediaClaw`                | `一站式完成抖音内容研究、采集与分析`   |
| 抖音英文 Hub   | `Douyin Tools for Content Research and Analysis        | MediaClaw`                             | `Research, collect and analyze Douyin content in one workflow`  |

Title/H1 不要求逐字相同。Title 负责类目识别，H1 负责清楚说明用户能完成什么。

### 4.2 已有功能页

| 功能页                     | 主要查询归属                                    | 当前动作                                         |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `*/scraper`                | 平台 + scraper/采集/数据采集                    | 保持独立；Hub 用描述性链接传权，不复制主词段落   |
| `*/downloader`             | 平台 + 下载/图片下载/无水印/downloader          | 保持独立；下载场景只在 Hub 做摘要卡片            |
| `*/comments`               | 平台 + 评论查询/评论采集/导出评论               | 抖音为中文高优先级，小红书作为对应能力保留       |
| `*/transcript`             | 平台 + transcript/视频逐字稿/视频转文字         | 抖音英文强入口，小红书已有高 CTR 小样本          |
| `*/image-text`             | 平台 + 文案提取/文字提取/OCR                    | 小红书优先；明确区分图片 OCR 与视频逐字稿        |
| `*/account-analysis`       | 平台 + account analyzer/profile viewer/账号分析 | 新页战略重点；逐步接管历史错位查询               |
| `*/viral-content-analysis` | 平台 + 爆款分析/viral content analysis          | 目前真实搜索样本不足，先按产品价值和内部链接培育 |
| `*/monitoring`             | 平台 + 竞品监控/账号监控                        | Bing 已有小量高排名信号，保留独立页              |
| `*/keywords`               | 平台 + 关键词洞察/关键词分析                    | 样本较少，暂不提高全站模板权重                   |
| `*/leads`                  | 平台 + 客资采集/评论区获客                      | 搜索量小但商业意图高，以场景内链和转化为优先     |

## 5. 已发现的关键词错位与内耗

### 5.1 `douyin profile viewer` 错位到 scraper

2026-05-01 至 2026-08-11：

- `/en/douyin/scraper` 从 `douyin profile viewer` 获得 241 展现、55 点击，平均排名约 3.6。
- 新 `/en/douyin/account-analysis` 在本窗口仅获得品牌词曝光，尚未接管该查询。

迁移策略：

1. 保留 scraper 当前核心 `Douyin scraper` 定位，避免一次性删除已获得点击的相关描述。
2. 账号分析页的 Title、H1、FAQ 和相关链接自然覆盖 `Douyin Profile Viewer` 与 `Douyin Account Analyzer`。
3. scraper 主页采集/账号研究模块增加指向账号分析页的上下文内链，锚文本使用 `Douyin account analysis` 或 `analyze a Douyin profile`。
4. Hub 将“账号分析”作为重点入口并直接链接新页。
5. 观察 28 天 Query × Page 迁移；确认新页开始接管后，再收窄 scraper 中的 profile viewer 语义。

### 5.2 scraper 词分散到 comments/leads

- `douyin scraper` 在 `/en/douyin/comments` 有 140 展现、0 点击，在 `/en/douyin/leads` 有 31 展现、0 点击。
- `xiaohongshu scraper` 也分散到 comments、leads、Blog 和首页。

处理规则：

- comments 和 leads 不在 Title/H1 主推 scraper 泛词。
- 通过面包屑、Hub 和相关功能明确各自任务边界。
- Blog 只有在内容确实讨论采集时链接 scraper，不把文章本身优化成商业 scraper 主落地页。

## 6. Hub 首版信息模型与直接曝光顺序

两个平台共用四组场景：

1. 找方向与研究样本。
2. 采集数据与素材。
3. 提取、洞察与转化。
4. 持续跟踪与协作。

Hub 正文必须展示全部已发布功能；“直接曝光”只影响导航下拉菜单和 Hub 首屏重点卡片，不得让折叠功能失去可抓取链接。

### 小红书首版重点入口

1. 账号分析（新战略页）。
2. 爆款分析（新战略页）。
3. 笔记采集（GSC/Bing 已验证需求）。
4. 去水印下载（Google 已验证需求）。
5. 图文文案提取（Google/Bing 已验证需求）。
6. 视频逐字稿（英文高 CTR 小样本）。

评论采集、关键词洞察、客资采集、竞品监控放在完整场景列表中，不从 HTML 移除。

### 抖音首版重点入口

1. 账号分析（新战略页，并承接 `douyin profile viewer` 迁移）。
2. 爆款分析（新战略页）。
3. 视频逐字稿（Google 高点击、高 CTR）。
4. 视频采集（Google/Bing 高展现）。
5. 评论采集（Bing 中文最强需求簇）。
6. 去水印下载（Google 高展现、低 CTR 待优化）。

关键词洞察、图文文案提取、客资采集、竞品监控放在完整场景列表中。

## 7. Hub 与功能页内链规则

```text
首页/导航 → 平台 Hub → 全部功能页
功能页 → 平台 Hub + 2–4 个真实上下游功能 → 下载
Docs/Blog → 对应功能页 → 平台 Hub/下载
```

- Hub 卡片锚文本使用“平台 + 任务”，例如“小红书账号分析”“Douyin video transcript”。
- 每个功能页至少有一条正文或面包屑链接回平台 Hub。
- Hub 不创建必须经过的场景 URL；场景是页面内分组，点击功能直接进入功能页。
- 功能页 Hero 继续保留主 CTA `我要使用` / `Get Started`；只有真实演示存在时才显示效果演示。
- 教程链接只插入已发布且验收通过的具体步骤，不进入 Hero。

## 8. 评估与后续数据需求

### 首版上线前基线

- 保存本研究窗口的 GSC/Bing 查询数据。
- 记录 Hub 发布日期、内链批次、TDK/H1 与导航曝光顺序。
- 对账号分析和爆款分析单独记录“新页面样本不足”，不与成熟页直接比较。

### 上线后

| 时间 | 检查项                                                                            |
| ---- | --------------------------------------------------------------------------------- |
| D+7  | Hub 是否抓取/收录；功能页面包屑和 Hub 链接是否被识别；语言链接是否正确            |
| D+14 | Hub 开始获得哪些宽泛查询；功能页曝光是否有方向性变化                              |
| D+28 | Query × Page 是否更集中；`douyin profile viewer` 是否开始迁移；导航点击和下载转化 |
| D+56 | 是否需要调整 Hub Title/H1、重点入口排序或功能页互链                               |

后续如需判断本站尚未获得曝光的全市场机会，再补付费关键词数据库；在此之前，不因缺少全市场搜索量阻塞 Hub 架构上线。

## 9. 当前执行状态

- [x] 验证 GrowthOps 的 GSC/Bing 连接器和现有凭据。
- [x] 拉取近 3 个月 GSC Query × Page 与 Bing Query Stats。
- [x] 完成中英文、平台、意图和页面归属聚类。
- [x] 确定 Hub 与功能页的关键词边界。
- [x] 确定两个平台首版重点入口。
- [x] 完成可复用 Hub 组件、小红书页面内容和素材方案设计。
- [ ] 评审通过后实现可复用的 Hub 页面组件和小红书 Hub。
- [ ] 接入首页、导航、面包屑、功能页与 sitemap。
- [ ] 建立上线前基线并开始 D+7/D+14/D+28 跟踪。
