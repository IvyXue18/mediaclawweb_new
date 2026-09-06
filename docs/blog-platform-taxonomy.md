# Blog 平台归属规则与存量改造清单

生成日期：2026-08-28。适用范围：`src/content/posts/**` 所有中英文博客。

> 背景：MediaClaw 的每个功能都同时支持小红书和抖音，使用逻辑一致。早期文章多数默认从小红书角度写，导致"方法通用、包装全是小红书、抖音一句带过"。本文确定：**默认一篇双平台文章，不拆分、不做双套截图。**

---

## 1. 核心原则

1. **功能向选题默认写成一篇双平台文章。** 方法只写一遍，平台差异用一两句文字说明。
2. **不拆成两篇。** 使用逻辑一致时，两篇必然雷同 → 关键词自相残杀 + 双倍维护。
3. **不做平台切换截图。** 一套截图即可（通常是小红书），配图说明注明"以小红书为例，抖音操作一致"。**不使用 `PlatformExampleTabs`。**
4. **TDH 必须显式写出两个平台。** Title / Description / H1 / H2 至少各有一处出现 `小红书/抖音`（沿用首页 T/D 的写法），否则抖音相关查询排不到。
5. **只有"选题本身绑定平台"时才单平台。** 判断依据见 §2，此时是不同选题，不是拆分。

---

## 2. 什么时候仍然写单平台

**第一步永远是查功能页**：`/xiaohongshu/<feature>` 和 `/douyin/<feature>` 是否都存在这个能力。目前 10 个功能页两平台完全对称（account-analysis、comments、downloader、image-text、keywords、leads、monitoring、scraper、transcript、viral-content-analysis），所以**绝大多数功能向选题都是双平台**。

只有同时满足"没有对应功能页"且"语境绑定单一平台"时，才写单平台：

| 绑定点                                                      | 例子                                                                    | 归属                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| 讲的是平台自身流量机制，不是 MediaClaw 能力，且无对应功能页 | 小红书搜索流量 vs 推荐流量结构（抖音是推荐主导，逻辑完全不同）          | 单平台，抖音版是**另一篇不同的文章** |
| 场景绑定平台生态                                            | 本地商家 / 本地生活：小红书是内容+搜索，抖音是团购/POI/同城推，打法不同 | 单平台，抖音版是新选题               |

不构成单平台理由的情况（这些仍写双平台）：

- "换个名词就行"（收藏↔完播率、蒲公英↔星图）——文字补一句即可
- "抖音那个功能的机制不太一样"（水印形态不同、图文形态占比不同）——**功能页都有 = 都适用**，标题带双平台，正文补一句差异
- "埋词/起号是小红书的说法"——概念中性化即可（"关键词布局""冷启动"）

---

## 3. 双平台文章写作清单

- [ ] **Title 本身必须同时出现两个平台**（不是只在描述或正文提）。写法：`小红书/抖音` 或 `小红书和抖音`，例如「小红书/抖音达人筛选怎么做？从候选名单到合作短名单」
- [ ] **Description**：出现 `小红书/抖音` 或 `小红书和抖音`
- [ ] **H1 + 至少一个 H2**：出现平台词（H1 点명两个平台都适用；分叉小节可用「小红书看什么 / 抖音看什么」）
- [ ] **正文一句话**：明确"本文以小红书为例，抖音操作完全一致"，或在方法步骤里就用中性表述
- [ ] **指标差异用文字补**（不配图）：如"小红书看收藏，抖音看完播率，判断逻辑一样"「星图 / 蒲公英」「抖音多一个『合集』入口」
- [ ] **截图**：沿用现有单套图，`alt` / 配图说明加"以小红书为例，抖音一致"
- [ ] **内链**：同时链 `/xiaohongshu/<feature>` 和 `/douyin/<feature>`，锚文本各带平台词（[内链规范 §7.3](./internal-link-building-and-tracking.md) 允许双平台文章分别链接）
- [ ] **tags**：同时包含 `小红书` 和 `抖音`（blog 分类导航按 tag 生成，两个筛选下都要出现）
- [ ] **FAQ**：至少一条用"抖音"措辞提问
- [ ] **frontmatter**：`platform: 'both'`

### 单平台文章

- Title / Description / H 标签正常只写该平台
- slug 保留 `xiaohongshu-` 前缀
- `platform: 'xiaohongshu'`（或 `'douyin'`）
- 正文不需要强行提另一个平台

---

## 4. frontmatter 约定

新增字段（`src/content/posts/index.ts` 的 `BlogPostMeta` 与 schema 同步）：

```ts
platform: 'xiaohongshu' | 'douyin' | 'both';
```

用途：分类导航把平台作为固定首类（`both` 两个分类都进）；生成"选题 × 平台"覆盖矩阵防止重复立题。

---

## 5. 已知风险（一次性说明）

一套小红书截图 + 标题声称双平台 → 抖音查询的排名会弱于竞品的抖音专页。这是**主动选择的成本换产量**。处理方式：

- 上线 2–3 个月后看 GSC / 百度；
- 只有当某个"抖音 + 任务"查询**有实际量**且双平台页**卡在第 2 页起不来**时，才从该篇剥出独立抖音页，原篇转为小红书主打 + canonical 交叉。
- 拆分是数据驱动的后期优化，不是默认动作。

---

## 6. 存量 27 篇分类与改造动作

`P` 列：改造优先级（1 = 先做）。

### 6.1 双平台化改造（改 TDH + 一句说明 + 加 `抖音` tag + 加抖音内链/FAQ，不加截图）

对应功能页两平台都有，本次统一改造。

| slug                                                                    | 现标题要点                    | 对应功能页                                                 | 动作                                                                                                                                                                         | P   |
| ----------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| ~~`xiaohongshu-batch-collection`~~ → `batch-collection`                 | 批量采集 3 入口               | scraper                                                    | P1 草稿完成，本次版本暂不登记发布                                                                                                                                            | 1   |
| ~~`xiaohongshu-campaign-data-collection`~~ → `campaign-data-collection` | 投放结案                      | scraper                                                    | P1 草稿完成，本次版本暂不登记发布                                                                                                                                            | 1   |
| ~~`xiaohongshu-influencer-screening`~~ → `influencer-screening`         | 达人筛选                      | account-analysis                                           | P1 草稿完成，本次版本暂不登记发布                                                                                                                                            | 1   |
| `xiaohongshu-comment-topic-mining`                                      | 评论挖选题                    | comments                                                   | ✅ P2 完成（zh+en）：TDH 双平台；`/douyin/comments` 内链；新增抖音 FAQ；tag 去平台前缀                                                                                       | 2   |
| `xiaohongshu-comment-batch-export-campaign-review`                      | 投放复盘评论                  | comments                                                   | ✅ P2 完成（zh+en）：TDH 双平台；补 `/douyin/comments`、`/douyin/leads` 内链；新增抖音 FAQ；修正失效 `/posts/` 链接与过期锚文本                                              | 2   |
| `xiaohongshu-competitor-monitoring`                                     | 竞品监控                      | monitoring                                                 | ✅ P2 完成（zh+en）：TDH 双平台；`/douyin/monitoring` 内链；新增抖音 FAQ（阈值口径差异）                                                                                     | 2   |
| `xiaohongshu-brand-sentiment-monitoring`                                | 品牌舆情                      | monitoring / comments                                      | ✅ P2 完成（zh+en）：TDH 双平台。正文已含「抖音同一套思路」段与抖音 FAQ，无需再补                                                                                            | 2   |
| `xiaohongshu-image-text-extraction`                                     | 图文 OCR 提取                 | image-text（`/douyin/image-text` 存在：合集图/商品卡 OCR） | ✅ P2 完成（zh+en）：TDH 双平台；补 `/douyin/image-text` 内链；正文已含抖音段与 FAQ                                                                                          | 2   |
| `xiaohongshu-download-remove-watermark`                                 | 无水印下载                    | downloader（`/douyin/downloader` 存在）                    | ✅ P2 完成（zh+en）：TDH 双平台；补抖音漂移水印形态差异段；`/douyin/downloader` 内链；新增抖音 FAQ。**注**：`抖音无水印下载` 是强需求词，后续大概率要独立成抖音专页（见 §5） | 2   |
| `xiaohongshu-keyword-research`                                          | 找精准搜索流量                | keywords                                                   | TDH 双平台；方法（找搜索词、看需求）两平台一致                                                                                                                               | 3   |
| `xiaohongshu-professional-content-search-traffic`                       | 术语翻译成搜索词              | keywords                                                   | TDH 双平台；打法两平台一致                                                                                                                                                   | 3   |
| `xiaohongshu-topic-analysis`                                            | 搜词做选题分析                | keywords（赛道策略）                                       | TDH 双平台；"起号"表述中性化为"冷启动/选题"                                                                                                                                  | 3   |
| `xiaohongshu-keyword-placement`                                         | 埋词 / 搜索排名               | keywords                                                   | 埋词是 SEO 逻辑，双平台共用；TDH 双平台，正文加一句抖音关键词进标题/话题/文案                                                                                                | 3   |
| `xiaohongshu-ai-benchmark-to-draft`                                     | 对标转初稿                    | account-analysis                                           | TDH 双平台；注明"抖音产出的是脚本"                                                                                                                                           | 3   |
| `xiaohongshu-topic-library-build`                                       | 选题库                        | keywords                                                   | TDH 双平台（选题库概念两平台通用）                                                                                                                                           | 3   |
| `xiaohongshu-comment-analysis`                                          | 评论客资 + IP 属地 + 本地门店 | leads                                                      | 小红书主打（本地场景），但正文/FAQ 注明抖音客资功能一致；加 `抖音` tag                                                                                                       | 3   |
| `xiaohongshu-download-own-posts`                                        | 找回自己作品                  | downloader                                                 | TDH 双平台（低优先）                                                                                                                                                         | 4   |

### 6.2 已是双平台 / 中性，只补 tag 和 `platform` 字段

| slug                                   | 说明                                   |
| -------------------------------------- | -------------------------------------- |
| `low-follower-viral-content`           | 标题已含"小红书/抖音"                  |
| `video-transcript-timestamps`          | 标题已含"小红书抖音"                   |
| `xiaohongshu-find-benchmark-accounts`  | 标题已含"小红书抖音"，跨平台聚合是卖点 |
| `xiaohongshu-research-data-collection` | 学术采集，跨平台抽样是方法一部分       |
| `how-to-copy-viral-short-videos`       | 爆款拆解，中性；确认 TDH 提两平台      |
| `short-video-transcript-extraction`    | 飞书 + 百炼方案，工具向中性            |

### 6.3 真正的单平台（无对应功能页 + 语境绑定，`platform: 'xiaohongshu'`，内容不动）

| slug                                           | 保留单平台的原因                                                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `xiaohongshu-search-vs-recommendation-traffic` | 讲的是小红书的搜索/推荐流量结构本身，不是某个功能；抖音是推荐主导，"押注哪种"的答案和逻辑完全不同 → 抖音版是另一篇 essay |
| `local-business-xiaohongshu-marketing`         | 本地生活场景绑定平台生态：小红书是内容+搜索获客，抖音是团购券/POI/同城推 → 抖音本地是新选题                              |

> 这两个选题的抖音版如要写，是**从零起草的新选题**，不是改写。

### 6.4 抖音现有 2 篇

| slug                     | 动作                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `douyin-data-collection` | 保持抖音主打（抖音"数据采集"是强需求词）；与 `batch-collection` 交叉链接、划清范围 |
| `douyin-comment-export`  | 保持抖音主打（"抖音查评论/评论导出"有验证需求）；与小红书评论篇交叉链接、划清范围  |

> §6.3 / §6.4 是刻意的单平台主打，不是遗漏——它们踩中"平台机制"或"强需求词"，对侧平台若要覆盖，应新写文章而非改这两篇。

---

## 7. 批量执行顺序

汇总：**双平台化 17 篇**（§6.1）+ **补 tag 6 篇**（§6.2）+ **单平台 2 篇**（§6.3）+ **抖音主打 2 篇**（§6.4）= 27。

1. **P0**（✅ 已完成 2026-08-28）：`BlogPostMeta` + `BlogPost` 类型加 `platform: 'xiaohongshu' | 'douyin' | 'both'`（`src/content/posts/index.ts`，`BlogPlatform` 类型）；49 个 MDX 文件的 `export const meta` 已补 `platform`（23 slug=both / 2=xiaohongshu / 2=douyin）；`resolvePostMeta` + `localPostToItem` 已透传；`pnpm build` 通过。DB `post` 表暂不动——当前博客全是本地 MDX，等启用 DB 博客且需要平台筛选时再加。分类导航按 `platform` 分组是 P1 之后的独立改动。
2. **P1**（草稿已完成，本次版本暂不发布）：3 篇新稿使用中性 slug（`batch-collection` / `campaign-data-collection` / `influencer-screening`）、TDH 双平台化，正文已补平台差异（蒲公英/星图、收藏/完播率、抖音合集入口）、抖音功能页内链和抖音 FAQ。发布前仍需补英文版（`.en.mdx`）并登记进 `BLOG_POST_SLUGS`。
3. **P2**（✅ 已完成 2026-08-28）：§6.1 中 P2 的 6 篇双平台化改造，中英文各 6（`brand-sentiment` / `image-text` 正文本就双平台，只改了 TDH）。TDH 带「小红书/抖音」、加 `/douyin/*` 内链、加抖音 FAQ、tag 去平台前缀并加 `抖音`。`pnpm build` 通过，12 篇 zh+en 均 200。
4. **P3**：§6.1 中 P3 的 7 篇 + §6.2 的 tag 补齐。
5. **P4**：§6.1 P4 低优先 1 篇。
6. **常态**：写新文章第 0 步——查 `/xiaohongshu/<feature>` 和 `/douyin/<feature>` 是否都有该能力。都有 → 双平台，**标题必须同时出现小红书和抖音**。只有命中 §2 两个绑定点时才单平台。

---

## 8. 英文版

`.en.mdx` 同步同一分类。英文 TDH 用 `Xiaohongshu/Douyin`（或 `RedNote/Douyin`，与平台 Hub 英文命名一致）。`douyin profile viewer`、`douyin transcript` 等英文强需求词按 [平台 Hub 关键词研究](./research/platform-hub-keyword-research.md) 单独判断是否需要抖音专页。
