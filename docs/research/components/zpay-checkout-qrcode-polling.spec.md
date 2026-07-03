# Zpay Checkout QR Handoff

## Source Baseline

- Old checkout page: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/app/[locale]/(landing)/checkout/zpay/page.tsx`
- Old Zpay provider: `/Users/xueyangchun/Desktop/Projects/mediaclaw_web/src/extensions/payment/zpay.ts`

## Migrated Surface

- `src/routes/checkout/zpay.tsx`
- `src/routes/api/payment/status.ts`
- `src/core/payment/zpay.ts`

## Behavior

- The checkout page accepts the old handoff query fields: `order_no`, `amount`, `name`, `pay_url`, `submit_url`, `qrcode`, `img`, `callback_url`, and `cancel_url`.
- `pay_url` / `submit_url` must be `https://zpayz.cn/...`; unsafe payment links are hidden.
- `callback_url` / `return_url` and `cancel_url` must be relative or same-origin with `VITE_APP_URL`; unsafe external redirects fall back to `/settings/payments` and `/pricing`.
- When `img` or an HTTPS `qrcode` image URL is present, the page renders the QR image.
- When no image is present, the page keeps a large QR placeholder and exposes copyable payment link and QR content.
- The page polls `/api/payment/status?order_no=...` every 3 seconds until paid.
- The manual confirmation button calls `/api/payment/status?order_no=...&sync=1`; if paid, it redirects to the safe callback URL.
- Status copy distinguishes waiting, paid, failed, and completed states, and surfaces credential code or credential sync errors when the status API returns them.
- Provider return URLs are wrapped once by `/api/payment/callback?order_no=...&redirect=...`.
- `/api/payment/callback` keeps redirect targets same-origin and appends non-sensitive state (`payment_callback`, `order_no`, `payment_status`, `payment_provider`, `credential_action`, `credential_sync_status`) to the final landing URL. Activation codes are not written into the callback URL.
- `/settings/payments` reads those callback parameters, automatically filters by `order_no`, shows a callback status banner, and includes an entitlement column for activation-code or credit fulfillment status.

## Test Hooks

- `tests/e2e/zpay-checkout.spec.ts`
- `tests/p1/payment-callback-route.test.ts`

## Remaining Acceptance

- Verify a real Zpay merchant PID/key with a small payment.
- Confirm Zpay asynchronous notify reaches `/api/payment/notify/zpay` and triggers credential issuing/recharge or credit fulfillment.
- Confirm the real return/callback URL lands on `/settings/payments` with the expected callback banner and entitlement status after a live payment.
- The current provider still emits a signed `submit.php` URL directly; if the production merchant relies on `mapi.php` returning `payurl/qrcode/img`, port that provider session creation path next.
