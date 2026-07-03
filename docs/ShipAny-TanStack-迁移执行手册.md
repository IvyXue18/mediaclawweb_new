# ShipAny TanStack 迁移执行手册

这份文档用于把当前 `mediaclaw_web` 从 ShipAny Two / Next.js 版本，分阶段迁移到 `shipany-ai/shipany-tanstack`。它不是一次性重写清单，而是后续实际重构的工作台：先固定基线和页面/API inventory，再按模块迁业务，最后迁页面和部署。

当前已重新确认过目标私有仓库：`shipany-ai/shipany-tanstack` 当前 HEAD 为 `6b059198bcd11879f1fe9457a0359484bbdddf32`，代码结构是 TanStack Start / Vite / Nitro，已包含 Better Auth、Drizzle、支付模块和 Cloudflare 构建部署脚手架。

## 迁移原则

1. 不直接覆盖当前官网仓库，先在独立 TanStack 工作区做 POC。
2. 不把页面识别器当成业务迁移器；它只负责识别页面结构、内容、资源和 API 依赖。
3. 激活码、积分池、支付后发码、试用升级、Zpay、福利任务、插件内部消费接口、自建分销、渠道商/贴牌，都按 `src/modules/*/service.ts` + API routes 手工迁移。
4. 旧站回归测试是行为真相。接口路径可以改，业务预期不能随迁移漂移。
5. 优先保留一个主产品线和一个后端，不做多套白牌 fork；渠道/贴牌通过 `partnerId`、`channelCode`、`variantId` 等归因字段表达。

## 先迁什么

### Phase 0：迁移基线和 inventory

先在旧站完成三件事：

- 跑通现有门禁：`pnpm test:regression`、`pnpm test:p2`、`pnpm verify:web`。
- 生成页面/API inventory：`pnpm migration:inventory -- --out docs/tanstack-page-inventory.json`。
- 在 TanStack 工作区接入同一批 P0/P1 测试脚本，先让测试可以运行和失败。

这一阶段不搬业务代码，只确认“现在有什么”和“迁过去要守住什么”。

### Phase 1：核心业务模块

优先迁最容易产生收入和授权事故的部分：

- 激活码：生成、认领、绑定、冻结、过期、seat 归属。
- 积分池：充值、消费、幂等 `biz_no`、余额不足、流水归属。
- 支付：checkout、Zpay 通知、Stripe/PayPal webhook、支付后发码、发码失败修复。
- 试用升级：trial 到 formal/recharge 的计划、时长、绑定数和积分池更新。
- 插件内部消费接口：`/api/internal/credential/consume`。

目标落点：

- 当前：`src/shared/models/*`、`src/shared/services/*`、`src/app/api/**/route.ts`。
- 新版：`src/modules/credentials/service.ts`、`src/modules/credits/service.ts`、`src/modules/payment/service.ts`、`src/routes/api/**.ts`。

验收：P0 全绿，支付/发码/积分相关 P1 全绿。

### Phase 2：分销、福利、渠道商/贴牌

第二批迁需要跨后台、用户页和插件归因的模块：

- 自建分销：邀请关系、佣金、提现、退款、修复队列。
- 福利任务：渠道调研、插件体验反馈、管理员列表和失败 ledger。
- 渠道商/贴牌：supplier、contract、partner order、seat 批量发码、B 端导出、后台创建/编辑。

目标落点：

- `src/modules/referral/service.ts`
- `src/modules/benefits/service.ts`
- `src/modules/partners/service.ts`
- `src/routes/api/referral/**.ts`
- `src/routes/api/rewards/**.ts`
- `src/routes/api/partner/**.ts`
- `src/routes/api/admin/partners/**.ts`

验收：P1 中分销、福利、渠道商/贴牌测试全绿。

### Phase 3：后台和用户中心页面

先迁会直接影响运营处理的页面：

- `/admin/users`
- `/admin/credentials`
- `/admin/credits`
- `/admin/payments`
- `/admin/referral`
- `/admin/partners`
- `/settings/credentials`
- `/settings/credits`
- `/settings/billing`
- `/settings/referral`

页面迁移时，数据读取走 TanStack route loader 或 React Query；写操作仍走 API routes，避免把业务逻辑塞回组件。

### Phase 4：公开官网页面

公开页最后迁，但按流量和商业价值排序：

1. `/pricing`
2. `/download`
3. `/welfare`
4. `/referral`
5. `/partner`
6. `/blog`
7. `/docs` / 动态内容页
8. `/` 首页
9. 其他功能页和 SEO 长尾页

验收：P2 smoke 全绿，并补购买路径、激活码查询、支付回跳、Cloudflare preview smoke。

### Phase 5：Cloudflare preview 和切流

切流前必须完成：

- `pnpm test:regression`
- `pnpm test:p2`
- TanStack `pnpm build`
- TanStack `pnpm cf:build`
- 支付 webhook fixture
- 插件内部消费接口 smoke
- 渠道商批量下单和发码 smoke
- 回滚域名和旧站保留方案

## 页面要怎么解析去看

页面识别器的任务是生成 inventory，不直接改代码。当前第一版命令：

```bash
pnpm migration:inventory -- --out docs/tanstack-page-inventory.json
```

它会扫描：

- `src/app/[locale]/**/page.tsx`
- `src/app/api/**/route.ts`
- `src/config/locale/messages/{zh,en}/**/*.json`

每个条目至少要回答：

- 当前路由是什么。
- 属于 landing、admin、settings、auth、activity 还是 API。
- 对应源文件在哪里。
- 目标 TanStack route 文件应该在哪里。
- 依赖哪些 locale message、图片资源、内部 API。
- 风险等级是 low、medium 还是 high。

inventory 中高风险条目先迁。凡是命中 payment、credential、credit、referral、partner、welfare、reward、zpay、consume 等关键词的页面或 API，都不能只靠页面识别器自动转换，必须按业务测试迁。

## 怎么迁移

### 1. API route 迁移模板

旧站 Next route：

```text
src/app/api/payment/checkout/route.ts
```

新版 TanStack route：

```text
src/routes/api/payment/checkout.ts
```

迁移步骤：

1. 把纯业务逻辑提到 `src/modules/payment/service.ts`。
2. API route 只负责鉴权、参数解析、调用 service、返回统一响应。
3. 复用旧测试的业务预期，只替换测试入口或 mock 边界。
4. 同时覆盖成功、失败、幂等、重复回调、异常恢复。

### 2. Service 迁移模板

每个 service 都按这个顺序拆：

- input schema：请求参数和内部调用参数。
- query/write：Drizzle 读写。
- domain rule：价格、额度、状态流转、幂等判断。
- side effect：发码、发邮件、返佣、ledger、通知。
- repair：失败状态的可恢复入口。

迁移时不要在页面组件里补业务分支。组件只能显示状态和触发 API。

### 3. 页面迁移模板

旧站页面来源通常是：

- `src/app/[locale]/(landing)/**/page.tsx`
- `src/config/locale/messages/{zh,en}/pages/**/*.json`
- `src/shared/blocks/**`
- `content/posts/**`

新版落点通常是：

- `src/routes/**/*.tsx`
- `messages/zh.json`
- `messages/en.json`
- `src/blocks/**`
- `src/content/pages/**`
- `src/content/posts/**`

迁移步骤：

1. 从 inventory 找到 route、sourceFile、messages、assets、apiReferences。
2. 判断页面类型：JSON block 页面、手写 React 页面、MDX/blog 页面、后台表格页面、表单页面。
3. 先迁消息和静态内容，再迁组件。
4. 有 API 依赖的页面必须等对应 API route 先绿。
5. 页面迁完后加入或更新 P2 smoke。

## 当前映射表

| 当前 Next 目录                           | 新版 TanStack 目录                           | 迁移方式                    |
| ---------------------------------------- | -------------------------------------------- | --------------------------- |
| `src/app/[locale]/(landing)/**/page.tsx` | `src/routes/**/*.tsx`                        | 页面 inventory 后逐页迁     |
| `src/app/[locale]/(admin)/**/page.tsx`   | `src/routes/admin/**/*.tsx`                  | 先迁 API，再迁表格/表单     |
| `src/app/[locale]/(auth)/**/page.tsx`    | `src/routes/(auth)/**/*.tsx`                 | 复用 Better Auth 页面和状态 |
| `src/app/api/**/route.ts`                | `src/routes/api/**/*.ts`                     | service-first 迁移          |
| `src/shared/models/*`                    | `src/config/db/schema.ts` 或 `src/modules/*` | schema 对齐后迁             |
| `src/shared/services/*`                  | `src/modules/*/service.ts`                   | 按业务域拆分                |
| `src/config/locale/messages/**`          | `messages/zh.json`、`messages/en.json`       | inventory 后合并 namespace  |
| `content/posts/**`                       | `src/content/posts/**`                       | 保留 frontmatter 和 slug    |

## 验收门槛

迁移不是按“页面看起来能打开”验收，而是按回归门禁验收：

- Phase 0：旧站 `test:regression`、`test:p2`、`verify:web` 可通过，inventory 可生成。
- Phase 1：P0 全绿，支付/发码/积分 P1 全绿。
- Phase 2：分销、福利、渠道商/贴牌 P1 全绿。
- Phase 3：后台关键页面 smoke 和权限边界通过。
- Phase 4：P2 页面 smoke 通过，购买/激活码/支付回跳路径补齐。
- Phase 5：Cloudflare preview 可用，插件消费接口和支付 webhook 在 preview 环境通过。

## 我的执行建议

下一步不要直接“全站搬家”。我建议我先做 Phase 0/1：

1. 以 `shipany-ai/shipany-tanstack` 建独立工作区。
2. 把当前官网 P0/P1 测试移过去，让它们先失败。
3. 先迁激活码、积分、支付、插件消费接口。
4. 第一批核心接口绿了，再迁分销、福利、渠道商。
5. 最后根据 inventory 迁页面。

这样迁移会慢一点，但不会出现“页面秒开了，业务账错了”的情况。
