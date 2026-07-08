# Preview 人工检查清单

更新时间：2026-07-08 CST

## 当前状态

- 本清单保留为 preview 阶段的历史验收记录。
- 历史人工检查入口：`https://mediaclawweb-preview.ycxue18.workers.dev`
- preview 搜索引擎策略：响应头包含 `X-Robots-Tag: noindex, nofollow`。
- 当前本地部署配置已切为正式域名生产候选：`mediaclawweb-prod-candidate` + `mediaclaw.app` / `www.mediaclaw.app` routes + `DATABASE_PROVIDER=postgresql` + Hyperdrive/Neon。
- 2026-07-08 已执行正式部署，正式域名基础验证通过；本清单不再作为当前测试入口。
- 正式域名测试请以 `docs/research/生产切流配置差距清单.md` 的当前步骤为准。

## 公开页检查

| 页面           | URL                           | 检查点                                          |
| -------------- | ----------------------------- | ----------------------------------------------- |
| 首页           | `/`                           | 首屏文案、视频/媒体位、主 CTA、导航、移动端首屏 |
| English 首页   | `/en`                         | 英文文案、导航、CTA、语言切换                   |
| 下载页         | `/download`                   | 下载按钮、插件说明、FAQ、无错位                 |
| English 下载页 | `/en/download`                | 无 redirect loop，最终 200                      |
| 更新日志       | `/updates`                    | v0.1.8 / v0.1.9 可见，详情页可进入              |
| 旧 changelog   | `/changelog`、`/en/changelog` | 301 到 `/updates` / `/en/updates`               |
| 文档入口       | `/docs`、`/en/docs`           | 无 YourAppName 占位，教程入口可进入             |
| 博客列表       | `/blog`、`/en/blog`           | 文章列表、分类、卡片信息                        |
| 博客详情       | 逐篇打开                      | 标题、description、正文首屏、封面/图片          |
| 小红书长尾页   | `/xiaohongshu/**`             | JSON 长尾页文案、CTA、FAQ                       |
| 抖音长尾页     | `/douyin/**`                  | JSON 长尾页文案、CTA、FAQ                       |
| showcases      | `/showcases`                  | 案例图、分组、移动端布局                        |
| pricing        | `/pricing`                    | 价格卡、Zpay 入口、权益文案                     |

## 业务功能检查

| 功能          | URL / 入口                         | 检查点                                 |
| ------------- | ---------------------------------- | -------------------------------------- |
| 登录          | `/sign-in`                         | 邮箱/Google 入口展示、未登录跳转       |
| 注册          | `/sign-up`                         | 表单、邀请码/验证逻辑是否符合预期      |
| 用户中心      | `/settings`                        | 未登录保护；登录后侧栏和页面是否正常   |
| Billing       | `/settings/billing`                | 订单、充值、Zpay 状态流                |
| 激活码        | `/settings/credentials`            | 列表、兑换、有效期展示                 |
| API key       | `/settings/apikeys`                | 创建、展示 prefix、删除                |
| 福利中心      | `/welfare`                         | 问卷、奖励、重复领取提示               |
| 伙伴/分销     | `/partner`、`/referral`            | 页面、登录保护、入口文案               |
| Chat / AI     | `/chat`、AI 生成页                 | key 测试、失败提示、额度扣减提示       |
| 支付回调      | `/api/payment/callback`            | 无 5xx，同源跳转                       |
| Zpay notify   | `/api/payment/notify/zpay`         | 需真实测试订单；未人工确认前不算通过   |
| 插件 validate | `/api/user/validate-credential`    | 未登录/未授权返回业务错误，无 5xx      |
| 插件 consume  | `/api/internal/credential/consume` | 无 token 返回 401；真实 token 流程另测 |

## SEO/技术检查

| 检查项    | 期望                                                                       |
| --------- | -------------------------------------------------------------------------- |
| HTTP 状态 | 公开页 200；旧兼容入口 301；无 404/500                                     |
| Canonical | preview 阶段允许指向 preview；切主域前必须重新烘成 `https://mediaclaw.app` |
| hreflang  | zh / en alternate 完整                                                     |
| sitemap   | 包含迁移目标页；preview 返回 noindex                                       |
| noindex   | preview/staging 必须有 `X-Robots-Tag: noindex, nofollow`                   |
| 移动端    | 首页、下载、pricing、博客详情、长尾页无横向滚动/遮挡                       |

## 已完成的自动验证

- `pnpm verify:web`：已通过。
- `pnpm cf:build`：preview/D1 已通过。
- `pnpm cf:build`：2026-07-08 正式域名 + PostgreSQL/Hyperdrive 生产候选构建已通过。
- `MEDIACLAW_E2E_BASE_URL=http://127.0.0.1:3002 pnpm test:p2`：66/66 通过。
- Preview P2：`MEDIACLAW_E2E_BASE_URL=https://mediaclawweb-preview.ycxue18.workers.dev pnpm test:p2` 66/66 通过。
- Staging P2：`MEDIACLAW_E2E_BASE_URL=https://staging.mediaclaw.app pnpm test:p2` 66/66 通过。

## 未开始的动作

- preview 阶段已结束，正式部署已于 2026-07-08 执行。
- 生产 PostgreSQL 兼容 SQL 已于 2026-07-08 review、dry-run 并 COMMIT 执行。
- 未把 preview D1 当作生产库。

## 历史人工检查之后

如果人工检查发现问题：

- 修复对应页面、文案、移动端布局、接口或配置。
- 重跑相关窄测试，必要时重跑 `pnpm verify:web`、`pnpm cf:build` 和 preview P2。
- 重新部署 `mediaclawweb-preview` 后继续人工复查。

如果人工检查通过：

- 进入生产态承接准备。
- 生产数据方案已改为 Neon/PostgreSQL + Hyperdrive；preview D1 不是生产库，不能直接承接旧站用户、订单、积分、激活码和福利数据。
- 迁移或确认生产配置：Auth secret、配置加密 key、Zpay、License token、R2、Google OAuth、Analytics、AI provider。
- 旧 PostgreSQL + Hyperdrive 路线已执行生产兼容 SQL；正式域名部署后继续复测业务路径。
- 用无主域 route 的候选 Worker 跑生产态 smoke：公开页、登录、插件 validate/consume、Zpay notify、支付 callback、AI key test 和 P2。
- 生产态 smoke 全部通过后，再安排 Cloudflare 主域 route 切换和 48 小时监控。
