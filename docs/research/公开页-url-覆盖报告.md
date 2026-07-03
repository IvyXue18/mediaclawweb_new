# 公开页 URL 覆盖报告

更新时间：2026-06-30

## 结论

- 旧站公开迁移验收范围：64 个规范路径，按 `zh` / `en` 两种 URL 形态共 128 个页面 URL。
- 本地新站探测结果：64/64 规范路径通过，128/128 本地化 URL 通过，失败 0。
- `/en/download` 已确认不再 redirect loop，最终 200。
- `/changelog`、`/en/changelog` 保留为旧 URL 兼容入口，301 到 `/updates`、`/en/updates`；sitemap 只保留目标 `/updates`。
- sitemap 覆盖旧站公开迁移目标 64/64；当前 sitemap base-locale `<loc>` 共 65 条，多出的条目是新仓库已有本地文章，不属于旧站缺口。
- Cloudflare preview 已部署到 `https://mediaclawweb-preview.ycxue18.workers.dev`，未配置主域 `routes`，所有 preview 响应带 `X-Robots-Tag: noindex, nofollow`。
- Staging 灰度 route 已部署到 `https://staging.mediaclaw.app`，未改动生产主域 `mediaclaw.app`；staging 域完整 P2 66/66 通过。
- 当前按人工验收要求暂停在 preview 阶段；不切 `mediaclaw.app` 主域。人工检查清单见 `docs/research/preview-人工检查清单.md`。

## 数据源

- 旧站 sitemap 静态公开页：`/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/sitemap.ts`
- 旧站新增 JSON 长尾页：`/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/{zh,en}/pages/**`
- 旧站文章：`/Users/xueyangchun/Desktop/Projects/mediaclaw_web/content/posts/*.mdx`
- 旧站更新日志：`/Users/xueyangchun/Desktop/Projects/mediaclaw_web/content/logs/*.mdx`
- 新站本地探测：`http://127.0.0.1:3002`

## 覆盖统计

| 范围                     | 规范路径 | 本地化 URL | 通过 | 失败 |
| ------------------------ | -------: | ---------: | ---: | ---: |
| 静态/长尾/教程/AI/政策页 |       31 |         62 |   31 |    0 |
| 旧 URL 兼容重定向        |        1 |          2 |    1 |    0 |
| 文章详情                 |       21 |         42 |   21 |    0 |
| 更新日志详情             |       11 |         22 |   11 |    0 |
| 合计                     |       64 |        128 |   64 |    0 |

## 检查项

| 检查项        | 结果                                                             |
| ------------- | ---------------------------------------------------------------- |
| HTTP 状态     | 128/128 最终 200                                                 |
| 301 兼容      | `/changelog` -> `/updates`，`/en/changelog` -> `/en/updates`     |
| Redirect loop | `/en/download` 0 loop，最终 200                                  |
| title         | 128/128 非空且为页面级标题                                       |
| description   | 128/128 非空                                                     |
| canonical     | 128/128 指向当前页面最终路径                                     |
| hreflang      | 128/128 含页面级 `zh` / `en` alternate                           |
| 正文首屏      | 128/128 SSR body 可抓取且无 SSR 错误文本                         |
| sitemap       | 64/64 旧站公开迁移目标已包含；重定向源 `/changelog` 不入 sitemap |

## 内容追平

- 旧站 locale JSON 页面已同步到 `src/content/legacy-pages/{zh,en}/**`，包括小红书/抖音 `image-text`、`transcript` 等长尾页。
- 旧站 21 篇 MDX 文章已同步到 `src/content/posts/`，并通过 `src/content/posts/index.ts` 纳入本地文章清单。
- 旧站 11 篇更新日志已同步到 `src/content/logs/`，包括 `v0.1.8`、`v0.1.9`；`/updates` 列表和 `/updates/<version>` 详情均可访问。
- docs 入口已替换旧模板占位，改为 MediaClaw 使用文档入口。
- `messages/{en,zh}.json` 的兜底 metadata 已从模板文案改为 MediaClaw 文案。

## 非公开入口说明

- 旧站 `pages/partner.json` 是伙伴后台文案，属于登录/业务身份入口，不计入公开 SEO sitemap 分母；新仓库已有 `/partner` 及相关 API/子路由。
- 后台、设置页、支付回调、插件接口、AI key 等业务闭环不在本报告的公开页 SEO 分母内，后续在 Cloudflare preview 的业务验收中单独跑。

## Cloudflare preview 验收

- Worker：`mediaclawweb-preview`
- Preview URL：`https://mediaclawweb-preview.ycxue18.workers.dev`
- D1：`mediaclawweb-preview-db`
- 当前版本：`02642356-2604-4ba1-a2b0-03a113638556`
- 主域 route：未配置，`wrangler.jsonc` 中 `routes` 缺省。
- Secrets：`AUTH_SECRET`、`CONFIG_ENCRYPTION_KEY` 已通过 Wrangler secret 上传，未写入文件。
- 远程 D1 schema：`0000_majestic_mojo.sql` 已应用，127 条 SQL 命令。
- 远程 RBAC：4 roles、29 permissions、34 role_permissions。
- Preview sitemap：65 个 canonical `<loc>`，英文 URL 通过 `xhtml:link hreflang="en"` alternate 覆盖；例如 `/en/download` 作为 `/download` 的 alternate 存在。

Preview 冒烟结果：

| 检查项                | 结果                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| 公开页                | `/`、`/download`、`/en/download`、`/updates`、`/docs` 等 200                                        |
| 旧 URL 兼容           | `/en/changelog` 301 到 `/en/updates`                                                                |
| noindex               | HTML、API、sitemap 均返回 `X-Robots-Tag: noindex, nofollow`                                         |
| 登录入口              | `/sign-in` 200；`/api/auth/get-session` 未登录返回 `null`                                           |
| 支付 callback         | `/api/payment/callback?...` 302 到同源目标，无 5xx                                                  |
| Zpay                  | `/checkout/zpay` 200；远程 P2 覆盖二维码交接和手动已支付检查流程                                    |
| 插件接口              | `/api/user/validate-credential` 未登录返回 Unauthorized；无 5xx                                     |
| 内部插件消费接口      | `/api/internal/credential/consume` 无 token 返回 401；无 5xx                                        |
| API key               | `/api/apikeys` 未登录返回 Unauthorized；无 5xx                                                      |
| AI key 测试入口       | `/api/admin/settings/test` 未登录返回 Unauthorized；无 5xx                                          |
| AI 生成入口           | `/api/ai/generate` 缺参数返回业务错误；无 5xx                                                       |
| Playwright preview P2 | `MEDIACLAW_E2E_BASE_URL=https://mediaclawweb-preview.ycxue18.workers.dev pnpm test:p2` 66/66 passed |

注意：preview D1 目前没有生产支付商户密钥和真实 AI provider key；本轮验证覆盖接口可达性、鉴权门禁、无 5xx 和 Zpay 前端交接流。真实 Zpay notify、AI provider key 连通性需要在 preview 后台录入对应配置后再跑。

## Staging 灰度 route 验收

- Worker：`mediaclawweb-staging`
- Staging URL：`https://staging.mediaclaw.app`
- 当前版本：`740b683c-5cc5-4df5-9429-03a996c3708f`
- Route 类型：Cloudflare Workers custom domain，`staging.mediaclaw.app`
- 生产主域：`mediaclaw.app` 仍由旧 Worker `mediaclaw-web` 服务，未切换。
- 数据库：暂复用 `mediaclawweb-preview-db`。这只适合 staging 验收，不等同于生产数据切换。
- Secrets：`AUTH_SECRET`、`CONFIG_ENCRYPTION_KEY` 已通过 Wrangler secret 上传到 staging Worker。
- noindex：staging host 命中 `src/server.ts` 的 preview/staging 规则，HTML、API、sitemap 均返回 `X-Robots-Tag: noindex, nofollow`。

Staging 冒烟结果：

| 检查项                | 结果                                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| 公开页                | `/`、`/download`、`/en/download`、`/updates`、`/docs` 等 200                     |
| Redirect loop         | `/en/download` 200，无 loop                                                      |
| 旧 URL 兼容           | `/en/changelog` 301 到 `/en/updates`                                             |
| canonical             | 已烘成 `https://staging.mediaclaw.app/...`                                       |
| 登录入口              | `/sign-in` 200；`/api/auth/get-session` 未登录返回 `null`                        |
| Zpay                  | `/checkout/zpay` 200；完整 P2 覆盖 Zpay 前端交接流                               |
| 支付 callback         | `/api/payment/callback?...` 302 到同源目标，无 5xx                               |
| 插件接口              | `/api/user/validate-credential` 未登录返回 Unauthorized；无 5xx                  |
| 内部插件消费接口      | `/api/internal/credential/consume` 无 token 返回 401；无 5xx                     |
| API key               | `/api/apikeys` 未登录返回 Unauthorized；无 5xx                                   |
| AI key 测试入口       | `/api/admin/settings/test` 未登录返回 Unauthorized；无 5xx                       |
| AI 生成入口           | `/api/ai/generate` 缺参数返回业务错误；无 5xx                                    |
| Playwright staging P2 | `MEDIACLAW_E2E_BASE_URL=https://staging.mediaclaw.app pnpm test:p2` 66/66 passed |

## 切主域前硬门禁

当前 staging 已证明新 Worker 的公开页、路由、SSR、noindex 和基础业务接口可运行。正式切 `mediaclaw.app` 前还必须补齐这些生产态事项：

生产 DB、schema、secret/provider 差距详见 `docs/research/生产切流配置差距清单.md`。

- 生产 DB 决策：不要直接用当前空的 `mediaclawweb-preview-db` 承接主域；需要明确是迁旧站生产数据到新 D1，还是改为连接旧生产数据库/Hyperdrive。
- 生产配置迁移：把旧站后台配置中的支付、Zpay、AI provider、OAuth、邮件、R2、Analytics/Plausible 等配置迁到新站生产 DB，并逐项测试。
- 真实回调验证：用 staging 或临时生产路径跑一次真实 Zpay notify、支付 callback、插件激活码 validate/consume、AI key test。
- 主域配置：把 `VITE_APP_URL` / `AUTH_URL` 改为 `https://mediaclaw.app` 后重新 `pnpm run cf:deploy`，确认 canonical/hreflang/sitemap base 变为主域。
- 切流策略：优先只切少量低风险路径或短时 staging route；确认无 5xx、无 redirect loop、核心页面正常，再切 `mediaclaw.app/*`。
- 回滚策略：旧 Worker `mediaclaw-web` 当前可用，切主域前记录最新旧 Worker 版本 `756c0a66-cc8f-4fa5-a649-4b0b3235c977`，保留快速改回 route 的路径。

切后 48 小时监控：

- Cloudflare Worker errors / 5xx / request volume。
- Search Console 覆盖率、404、重定向、抓取错误。
- GA/Plausible 流量、入口页、下载 CTA、注册、支付、插件激活事件。
- 支付后台订单、Zpay notify 成功率、插件 consume 错误率、AI provider 错误率。
- 发现主路径异常时立即回滚 route 到 `mediaclaw-web`，再补 redirect 或配置。

## 本次探测命令

```bash
node /private/tmp/mediaclaw-url-audit.js
```

输出摘要：

```json
{
  "canonicalPathCount": 64,
  "localizedUrlCount": 128,
  "okCount": 64,
  "failureCount": 0,
  "postCount": 21,
  "logCount": 11,
  "sitemapEntryCount": 65
}
```
