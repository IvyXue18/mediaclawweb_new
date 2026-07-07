# /xiaohongshu/scraper SEO 优化设计方案

> 针对外部 SEO 诊断的逐条评估，基于当前 en/zh 页面实际内容（2026-07-06）。
> 相关文件：`src/content/legacy-pages/{en,zh}/xiaohongshu/scraper.json`、`src/routes/-legacy-page-route.tsx`

## 结论速览

| #   | 诊断建议                   | 采纳度                | 理由                                                                                                                  |
| --- | -------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | 改写 Meta 提升 CTR         | ✅ 采纳（但方向修正） | 诊断说"把导出/飞书写进 description"——**其实已经写了**。真正缺的是差异化钩子：no code / no API keys / no cloud credits |
| 2   | 竞品对比表                 | ✅ 采纳，性价比最高   | 现有 `data-table` block 直接复用，零代码改动，纯内容                                                                  |
| 3   | SoftwareApplication Schema | ✅ 采纳，需少量代码   | 全站目前没有任何 JSON-LD；FAQPage 也一起做（FAQ 内容现成）                                                            |
| 4   | 内链网络                   | ⚠️ 半采纳             | related-links + 导航已有；只需做锚文本审计和博客补链                                                                  |
| 5   | 追 rednote mcp 红利词      | ⚠️ 条件采纳           | 产品没有 MCP 能力前不要加词（否则是误导性 thin content）；先加一条 FAQ 占位即可                                       |

**额外发现（诊断没提，但值得做）**：zh 页比 en 页缺 `howto`、`batch`、`scenarios` 三个 section（en 有 10 个 section，zh 只有 7 个）。中文内容深度补齐对停留时长和中文词排名同样有效。

---

## 1. Meta 改写（EN 为主，改 metadata 即可）

**现状：**

- Title: `Free RedNote & Xiaohongshu Scraper Chrome Extension`（51 字符，关键词精准但无钩子）
- Description: `Scrape RedNote/Xiaohongshu posts, profiles, and search results in your browser. Export to Excel or Markdown, backfill media text, or sync to Lark Base.`

**问题：** 第一页竞品是 Apify（云端付费算力）、GitHub 脚本（要代码）、TikHub API（要接 API）。用户比价时最关心"哪个不用写代码不花钱"，但现在的 meta 没有一个否定式钩子说出这一点。

**建议改为：**

```
Title:       Free RedNote Scraper — No-Code Chrome Extension for Xiaohongshu
Description: No code, no API keys, no cloud credits. Scrape RedNote (Xiaohongshu)
             posts, profiles & search results in Chrome — one-click export to
             Excel/Markdown, or sync to Lark Base. Free to install.
```

要点：

- Title 保留精准匹配 `RedNote Scraper` 前置 + 破折号后放差异化定位（No-Code）
- Description 用三连否定开头直接打 Apify/脚本/API 三类竞品的痛点
- zh 页 title/description 已经很完整（关键词覆盖好），**不动**

## 2. 竞品对比 Section（纯内容，复用 data-table block）

在 `en/xiaohongshu/scraper.json` 的 `sections` 里新增 `compare`，插入 `show_sections` 的 `outputs` 之后：

```json
"compare": {
  "id": "compare",
  "block": "data-table",
  "title": "MediaClaw vs. Cloud Scrapers, Scripts & APIs",
  "description": "How a no-code browser extension compares with other ways to scrape RedNote data.",
  "columns": [
    { "key": "item", "title": "" },
    { "key": "mediaclaw", "title": "MediaClaw (Extension)" },
    { "key": "cloud", "title": "Cloud Scrapers (e.g. Apify)" },
    { "key": "script", "title": "Open-Source Scripts" },
    { "key": "api", "title": "Paid APIs (e.g. TikHub)" }
  ],
  "rows": [
    { "item": "Coding required", "mediaclaw": "None — point and click", "cloud": "Low, but actor config needed", "script": "Python/Node required", "api": "API integration required" },
    { "item": "Cost model", "mediaclaw": "Free tier, runs locally", "cloud": "Pay per compute unit", "script": "Free but high maintenance", "api": "Pay per request" },
    { "item": "Proxy / login setup", "mediaclaw": "None — uses your own browser session", "cloud": "Proxies + cookies required", "script": "Proxies + cookies required", "api": "Handled, at a price" },
    { "item": "Anti-detection", "mediaclaw": "Human-like scrolling, random waits, auto-pause", "cloud": "Depends on actor quality", "script": "DIY", "api": "N/A" },
    { "item": "Output", "mediaclaw": "Excel/CSV/Markdown + Lark Base sync + OCR/transcript backfill", "cloud": "JSON/CSV download", "script": "Raw JSON", "api": "JSON response" },
    { "item": "Best for", "mediaclaw": "Creators, marketers, ops teams", "cloud": "Data engineers", "script": "Developers", "api": "Product integrations" }
  ]
}
```

注意事项：

- 事实性陈述，不贬损（"pay per compute unit" 是客观描述），避免法律/口碑风险
- 这段内容同时喂给 Google AI Overview 做比较类摘要，是排位进前三的核心内容差异
- zh 版对应竞品语境不同（不是 Apify，而是云端采集服务/开源脚本/数据 API），列改为：浏览器插件 / 云端采集服务 / 开源脚本 / 数据接口

## 3. 结构化数据（需要代码，一次做全站受益）

现状：全站 **没有任何 JSON-LD**。

实现：在 `src/routes/-legacy-page-route.tsx` 的 `legacyPageHead` 里加 `scripts`，从页面数据自动生成两段 JSON-LD：

```ts
// legacyPageHead 增加：
scripts: buildJsonLd(data).map((json) => ({
  type: 'application/ld+json',
  children: JSON.stringify(json),
})),
```

`buildJsonLd` 生成：

1. **SoftwareApplication**（由 `metadata.structuredData` 或固定配置驱动）
   - `applicationCategory: "BrowserApplication"`、`operatingSystem: "Chrome"`
   - `offers: { price: 0, priceCurrency: "USD" }`（免费层是真实的）
   - `aggregateRating`：**只填 Chrome Web Store 的真实评分和数量**，没有就先不加。伪造评分会被 Google 手动处罚，风险远大于收益
2. **FAQPage**（从 `sections.faq.items` 自动映射 question/answer）
   - 注：2023 年后 FAQ 富摘要基本只给权威站展示，别指望出星星下拉；但它对 AI Overview 引用和语义理解仍有效，成本又低，值得做

## 4. 内链（审计为主，改动很小）

已有：header 导航直达、每页 `related-links` section 互链。缺口：

- 博客文章 → scraper 页的锚文本统一用 `RedNote scraper` / `小红书数据采集`（精准锚文本），不要用"点击这里"
- en/zh 的 related-links 检查是否都包含 scraper 页回链
- 如果有站外自有项目，加一条 dofollow 链接即可，不必刻意做链轮

## 5. MCP 红利词（先占位，不追风）

- 产品**当前不支持 MCP**的话，页面加 `rednote mcp` 属于关键词误导，停留时长反而会惩罚排名
- 低成本占位：FAQ 加一条 "Can I use MediaClaw data in AI / MCP workflows?" 答案如实写 Markdown 导出可直接进 Obsidian/AI 工作流，MCP 支持在 roadmap
- 若未来真做 MCP server，再单独开 landing page 收割这个词

## 6.（补充）zh 页内容补齐

把 en 页的 `howto`（4 步上手）、`batch`（数据字段矩阵）、`scenarios`（应用场景表）翻译回填到 zh 页，恢复 section 对等。中文页停留时长和长尾词覆盖都会受益。

---

## 执行顺序（按 ROI）

1. **EN meta 改写** — 5 分钟，纯 JSON，改完即可等 CTR 数据
2. **EN compare section** — 1 小时内容工作，零代码
3. **JSON-LD（SoftwareApplication + FAQPage）** — 半天代码，全部 legacy 页面受益
4. **zh 页 section 补齐 + 内链锚文本审计** — 持续性内容工作
5. **MCP FAQ 占位** — 顺手做
