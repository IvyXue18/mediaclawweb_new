# Settings Referral Withdrawal Spec

Date: 2026-06-18

## Source Parity

- Old page: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/referral/page.tsx`
- Old withdrawal card: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/referral/referral-withdraw-card.tsx`
- Old messages: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/{en,zh}/settings/referral.json`
- New page: `/Users/xueyangchun/Desktop/Projects/mediaclawweb/src/routes/settings/referral.tsx`
- New service/API: `/Users/xueyangchun/Desktop/Projects/mediaclawweb/src/modules/referral/service.ts`, `/Users/xueyangchun/Desktop/Projects/mediaclawweb/src/routes/api/referral/withdrawals.ts`

## Restored Behavior

- `/settings/referral` now renders localized partner-program stats, invitation link/code, rules, manual withdrawal CTA, commission records, and withdrawal history.
- `/api/referral/withdrawals` accepts the old contact-only payload `{ contactSnapshot }`.
- Old-style withdrawal requests move the full available balance into a pending withdrawal after checking:
  - no existing pending withdrawal,
  - available balance reaches `referral_min_settlement`,
  - account has enough available balance.
- The manual contact dialog uses the old `/wechat.png` asset and submits the QR/contact snapshot for admin review.

## Remaining Gap

- The current TanStack schema has `referral_account`, `referral_commission`, `referral_withdrawal`, and `referral_risk_log`, but not the old `referral_relation` table. Invitation-record tab parity remains open until relation capture/storage is migrated.
- Currency defaults still follow the current TanStack account record (`referral_account.currency`, default `usd` in schema templates). Old production UI displayed CNY values, so production data/config must confirm the desired currency before claiming exact monetary display parity.

## Verification

- `pnpm exec vitest run tests/p1/referral-withdrawal-service.test.ts tests/p1/referral-withdrawal-route.test.ts`: 2 files / 4 tests passed.
- `pnpm exec vitest run tests/unit/referral-rules.test.ts tests/p1/referral-withdrawal-flow.test.ts tests/p1/referral-commission-flow.test.ts tests/p1/referral-withdrawal-service.test.ts tests/p1/referral-withdrawal-route.test.ts`: 5 files / 17 tests passed.
- `pnpm build`: passed.
- `pnpm test:phase3`: passed with local permissions, 19 protected routes passed including `/settings/referral`.
