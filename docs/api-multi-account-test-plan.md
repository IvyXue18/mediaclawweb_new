# 多账号后端接口测试用例(Preview 上线前)

> 范围:登录 / 调研领奖励 / 支付 / 转介绍佣金,多账号真实链路(区别于 tests/p1 已有的 mock 单测)。
> 响应约定:所有业务接口返回 `respData`(code=0)/ `respErr`,断言 code + message + DB 副作用。

## 测试账号矩阵

| 账号  | 角色             | 用途                               |
| ----- | ---------------- | ---------------------------------- |
| U1    | 新用户(被邀请人) | 注册、绑定邀请码、做调研、首单支付 |
| U2    | 邀请人           | 生成邀请码、收佣金、提现           |
| U3    | 第二被邀请人     | 复购/续费佣金、重复领奖            |
| ADMIN | 管理员           | 提现审批、佣金结算                 |

## 1. 认证 Auth

| #   | 用例                 | 接口                         | 预期                                                                     |
| --- | -------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| A1  | 邮箱注册             | POST /api/auth/sign-up/email | 成功,返回 session cookie(email_auth_enabled 需开启)                      |
| A2  | 邮箱登录             | POST /api/auth/sign-in/email | 成功,set-cookie `better-auth.session_token`(HTTPS 下带 `__Secure-` 前缀) |
| A3  | 错误密码登录         | 同上                         | 拒绝,无 session                                                          |
| A4  | 未登录访问受保护接口 | GET /api/credits             | Unauthorized                                                             |
| A5  | 获取桌面端 token     | GET /api/auth/token          | 登录态返回 token+cookieName;未登录 Unauthorized                          |
| A6  | 会话有效性           | GET /api/auth/get-session    | 返回当前用户                                                             |

社交登录(Google/GitHub)走 OAuth 回调,preview 环境手工验证一次即可,不纳入脚本。

## 2. 调研领奖励 Benefits

规则:新用户发 trial code(2 天 / 10 积分),已有凭证则续期;每人一次,重复报 `browser_trial_already_claimed`;可被 `benefit_channel_survey_*` 配置覆盖。

| #   | 用例                      | 接口                                  | 预期                                                                        |
| --- | ------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| B1  | 查询任务状态(未领)        | GET /api/rewards/channel-survey       | task 为空/未领取                                                            |
| B2  | U1 首次提交调研           | POST /api/rewards/channel-survey      | 发放 trial code;GET /api/credits 余额 +10;benefit_task + reward_ledger 落库 |
| B3  | U1 重复提交               | 同上                                  | `browser_trial_already_claimed`                                             |
| B4  | 传他人 rewardCredentialId | 同上                                  | 拒绝(凭证归属校验)                                                          |
| B5  | 未登录提交                | 同上                                  | Unauthorized                                                                |
| B6  | 体验反馈网页端提交        | POST /api/rewards/experience-feedback | 固定返回 `experience_feedback_plugin_only`(仅插件可提交,联调插件时再测正向) |
| B7  | 配置关闭奖励              | 同上(admin 关 benefit 配置)           | `benefit_reward_disabled`                                                   |

## 3. 支付 Payment

| #   | 用例                                                 | 接口                                         | 预期                                                                          |
| --- | ---------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| P1  | 正常下单                                             | POST /api/payment/checkout {product_id}      | 返回 checkoutUrl,order 落库 status=created;价格/积分取服务端目录,不信任请求体 |
| P2  | 未登录下单                                           | 同上                                         | Unauthorized                                                                  |
| P3  | 非法 product_id / 下架商品                           | 同上                                         | Unknown product / unavailable                                                 |
| P4  | 1 秒内连续下单                                       | 同上                                         | 触发限流                                                                      |
| P5  | redirect 传外域 URL                                  | 同上                                         | successUrl 回退到 /settings/payments(防开放重定向)                            |
| P6  | credits_only 不带 credential_code;trial 凭证买积分包 | 同上                                         | 均拒绝                                                                        |
| P7  | 模拟 zpay 成功回调(正确 MD5 签名)                    | GET/POST /api/payment/notify/zpay            | order→paid,积分/凭证发放,credentialSyncStatus=done                            |
| P8  | 同一回调重放                                         | 同上                                         | 幂等,不重复发积分/佣金                                                        |
| P9  | 错误签名回调                                         | 同上                                         | 拒绝(500),订单不变                                                            |
| P10 | 查询订单状态                                         | GET /api/payment/status?order_no=            | 本人可查;查他人订单 → order not found;sync=1 可主动修复未支付订单             |
| P11 | test_amount 小额真实支付                             | admin 配置 `zpay_test_amount` 后走真实收银台 | 实付为覆盖金额,积分/订单金额仍按目录                                          |

## 4. 转介绍佣金 Referral

规则:首单 30%(`referral_first_order_rate`)、续费 5%;佣金初始 pending,锁定期(`referral_lock_days`)后由 `processLockedCommissionsSettlement` 结算为 available;提现门槛 `referral_min_settlement` 默认 10000 分;partner 订单不计佣。

| #    | 用例                      | 接口                                        | 预期                                                               |
| ---- | ------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| R1   | U2 获取邀请信息           | GET /api/referral/info                      | 自动建 account,返回 inviteCode + referralLink                      |
| R2   | U1 绑定 U2 邀请码         | POST /api/referral/relations {referralCode} | 绑定成功;U2 relations 列表可见 U1                                  |
| R3   | 自邀(U2 绑自己码)         | 同上                                        | 拒绝                                                               |
| R4   | U1 已绑定后再绑其他码     | 同上                                        | 返回已有关系,不覆盖                                                |
| R5   | 无效邀请码                | 同上                                        | 拒绝                                                               |
| R6   | U1 首单支付成功(接 P7)    | —                                           | U2 产生 pending 佣金 = 订单额×30%(向下取整);pendingCommission 增加 |
| R7   | U1 第二单/续费            | —                                           | 佣金按 5%,reason=renewal                                           |
| R8   | partner 渠道订单          | —                                           | 不产生佣金                                                         |
| R9   | 订单退款                  | 退款回调                                    | 佣金→canceled,pending/total 相应扣减                               |
| R10  | 佣金/提现列表             | GET /api/referral/commissions、/withdrawals | 数据与 R6-R9 一致                                                  |
| R11a | 结算前提现                | POST /api/referral/withdrawals              | available 不足,拒绝                                                |
| R11b | 触发结算(内部任务/管理端) | processPendingReferralTasks                 | pending→settled,available 增加;账号非 ACTIVE 则 frozen             |
| R11c | 低于 minSettlement 提现   | POST /api/referral/withdrawals              | 拒绝                                                               |
| R11d | 正常提现                  | 同上                                        | 创建 pending 提现,available 扣减                                   |
| R11e | 已有 pending 再提         | 同上                                        | "already have a pending withdrawal request"                        |
| R12  | 管理员审批提现            | /api/admin/referral/withdrawals/$id         | 通过/驳回状态流转正确;驳回退回 available                           |

## 5. 主链路串测(冒烟)

S1:U1 注册 → 登录 → 绑 U2 邀请码 → 提交调研领 trial(+10 积分)→ checkout 下单 → 模拟 zpay 回调支付成功 → 积分/凭证到账 → U2 佣金 pending(30%)→ 结算 → U2 提现 → ADMIN 审批通过。
每步断言接口返回 + /api/credits、/api/referral/info 的账目一致性。

S2(异常链):P8 重放回调 + R9 退款 → 全链账目不重不漏。

## 待确认

1. 执行环境:本地 dev(可直接伪造 zpay 签名,需 pkey)还是直接打 preview(建议 preview 用 `zpay_test_amount` 小额真实支付验证 P7/P11)?
2. 佣金结算任务在 preview 的触发方式(定时器还是内部接口手动触发)?影响 R11b 的执行手段。
3. ADMIN 账号如何准备(RBAC 角色赋权路径)?
