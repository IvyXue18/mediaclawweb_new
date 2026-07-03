# Settings Billing Actions Specification

## Old Source References

- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/billing/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/billing/cancel/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/settings/billing/retrieve/page.tsx`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/zh/settings/billing.json`
- `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/config/locale/messages/en/settings/billing.json`

## Migrated Targets

- `src/routes/settings/billing.tsx`
- `src/routes/settings/billing/cancel.tsx`
- `src/routes/settings/billing/retrieve.tsx`
- `src/routes/api/user/subscriptions/detail.ts`
- `src/routes/api/user/subscriptions/billing.ts`
- `src/modules/payment/service.ts`
- `src/modules/subscriptions/service.ts`
- `messages/zh.json`
- `messages/en.json`

## Behavior Restored

- `/settings/billing` exposes the old "manage subscription" action when the current subscription has a payment customer id.
- `/settings/billing/cancel?subscription_no=...` is no longer a placeholder link page.
- The cancel page restores the old confirmation shape:
  - subscription number
  - subscription amount
  - interval cycle
  - subscription created date
  - current billing period
  - destructive confirm cancel action
- Cancel submission reuses `/api/user/subscriptions/cancel`, which validates auth, ownership, active/trialing status, provider support, and provider cancellation.
- `/settings/billing/retrieve?subscription_no=...` is no longer a placeholder link page.
- The retrieve page calls `/api/user/subscriptions/billing`, which validates auth, ownership, payment provider, payment customer id, provider billing support, stores the returned billing URL, and returns it for browser redirect.

## Interaction Model

- Cancel page: query-string driven page state plus submit-driven mutation.
- Retrieve page: query-string driven page state plus automatic redirect when the provider billing URL is ready.
- Both pages show invalid query, loading, and server-error states.

## Test Hooks

- `data-billing-cancel-page`
- `data-billing-cancel-form`
- `data-billing-cancel-submit`
- `data-billing-retrieve-page`
- `data-billing-retrieve-ready`

## Remaining Gap

This slice restores the old action URLs and provider portal handoff. It does not prove a live Stripe/PayPal/Creem billing portal, because that still depends on real provider credentials and a real subscription created in that provider.
