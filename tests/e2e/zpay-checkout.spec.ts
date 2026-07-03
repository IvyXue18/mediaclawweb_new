import { expect, test } from '@playwright/test';

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

test('zpay checkout shows qr handoff and redirects after manual paid check', async ({
  page,
}) => {
  let statusRequests = 0;

  await page.route('**/api/payment/status**', async (route) => {
    statusRequests += 1;
    const url = new URL(route.request().url());
    const paid = url.searchParams.get('sync') === '1';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          orderNo: 'ORDER-ZPAY-UI',
          status: paid ? 'paid' : 'created',
          credentialSyncStatus: paid ? 'done' : 'pending',
          credentialCode: paid ? 'ACT-ZPAY-0001' : null,
        },
      }),
    });
  });

  await page.route('https://zpayz.cn/qr/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: png1x1,
    });
  });

  const params = new URLSearchParams({
    order_no: 'ORDER-ZPAY-UI',
    amount: '0.01',
    name: 'MediaClaw Pro',
    pay_url: 'https://zpayz.cn/pay/ORDER-ZPAY-UI',
    qrcode: 'alipay://qr/ORDER-ZPAY-UI',
    img: 'https://zpayz.cn/qr/ORDER-ZPAY-UI.png',
    callback_url: '/checkout/zpay?order_no=ORDER-ZPAY-UI&paid=1',
    cancel_url: '/pricing',
  });

  await page.goto(`/checkout/zpay?${params.toString()}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('[data-zpay-checkout]')).toBeVisible();
  await expect(page.locator('[data-zpay-qr-image]')).toBeVisible();
  await expect(page.locator('[data-zpay-status-badge]')).toContainText(
    '等待付款'
  );
  await expect(page.locator('[data-zpay-order-no]')).toContainText(
    'ORDER-ZPAY-UI'
  );
  await expect(page.locator('[data-zpay-pay-url]')).toContainText(
    'zpayz.cn/pay/ORDER-ZPAY-UI'
  );
  await expect(page.locator('[data-zpay-qr-value]')).toContainText(
    'alipay://qr/ORDER-ZPAY-UI'
  );
  await expect(page.locator('[data-zpay-open-pay]')).toHaveAttribute(
    'href',
    'https://zpayz.cn/pay/ORDER-ZPAY-UI'
  );

  await expect.poll(() => statusRequests).toBeGreaterThanOrEqual(1);
  const requestsBeforeManualCheck = statusRequests;

  await page.locator('[data-zpay-check-status]').click();
  await expect
    .poll(() => statusRequests)
    .toBeGreaterThan(requestsBeforeManualCheck);
  await page.waitForURL(/paid=1/);
});

test('zpay checkout keeps a usable fallback when no qr image is provided', async ({
  page,
}) => {
  await page.route('**/api/payment/status**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: {
          orderNo: 'ORDER-ZPAY-FALLBACK',
          status: 'created',
          credentialSyncStatus: 'pending',
        },
      }),
    });
  });

  const params = new URLSearchParams({
    order_no: 'ORDER-ZPAY-FALLBACK',
    amount: '49',
    name: 'MediaClaw Annual',
    submit_url: 'https://zpayz.cn/submit.php?out_trade_no=ORDER-ZPAY-FALLBACK',
    qrcode: 'alipay://qr/ORDER-ZPAY-FALLBACK',
  });

  await page.goto(`/checkout/zpay?${params.toString()}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('[data-zpay-checkout]')).toBeVisible();
  await expect(page.locator('[data-zpay-qr-placeholder]')).toBeVisible();
  await expect(page.locator('[data-zpay-pay-url]')).toContainText(
    'zpayz.cn/submit.php'
  );
  await expect(page.locator('[data-zpay-qr-value]')).toContainText(
    'alipay://qr/ORDER-ZPAY-FALLBACK'
  );
});
