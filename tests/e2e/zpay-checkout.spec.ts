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
          credentialAction: paid ? 'issue' : 'none',
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
  await expect(
    page.getByRole('heading', { name: 'Mediaclaw 收银台' })
  ).toBeVisible();
  await expect(
    page.getByText(
      '请核对订单信息后扫码或打开支付链接。付款后，点击按钮确认完成支付。'
    )
  ).toBeVisible();
  await expect(page.getByAltText('支付宝 ALIPAY')).toBeVisible();
  await expect(page.locator('[data-zpay-qr-image]')).toBeVisible();
  await expect(page.locator('[data-zpay-status-badge]')).toContainText(
    '等待付款'
  );
  await expect(page.locator('[data-zpay-order-no]')).toContainText(
    'ORDER-ZPAY-UI'
  );
  await expect(page.locator('[data-zpay-pay-url]')).toHaveAttribute(
    'href',
    'https://zpayz.cn/pay/ORDER-ZPAY-UI'
  );
  await expect(page.locator('[data-zpay-pay-url]')).toContainText(
    '二维码无法显示？打开支付链接'
  );
  await expect(page.locator('[data-zpay-open-pay]')).toHaveCount(0);

  await expect.poll(() => statusRequests).toBeGreaterThanOrEqual(1);
  const requestsBeforeManualCheck = statusRequests;

  await page.locator('[data-zpay-check-status]').click();
  await expect
    .poll(() => statusRequests)
    .toBeGreaterThan(requestsBeforeManualCheck);
  await expect(page.getByText('支付成功，激活码已发放')).toBeVisible();

  await page.locator('[data-activation-contact-trigger]').click();
  await expect(page.locator('[data-activation-contact-dialog]')).toBeVisible();
  await expect(page.locator('[data-activation-contact-qr]')).toHaveAttribute(
    'src',
    '/wechat.png'
  );
  await expect(
    page.getByText('请使用微信扫码添加，备注「已购买」')
  ).toBeVisible();
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
  const qrImage = page.locator('[data-zpay-qr-image]');
  await expect(qrImage).toBeVisible();
  await expect(qrImage).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect
    .poll(() =>
      qrImage.evaluate((element) => (element as HTMLImageElement).naturalWidth)
    )
    .toBeGreaterThan(0);
  await expect(page.locator('[data-zpay-pay-url]')).toHaveAttribute(
    'href',
    'https://zpayz.cn/submit.php?out_trade_no=ORDER-ZPAY-FALLBACK'
  );
});

test('starter-card payment enters its claim and survey flow instead of the generic activation dialog', async ({
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
          orderNo: 'ORDER-ZPAY-STARTER',
          status: paid ? 'paid' : 'created',
          productId: 'trial-starter',
          credentialAction: paid ? 'issue' : 'none',
          credentialSyncStatus: paid ? 'done' : 'pending',
          credentialCode: paid ? 'ACT-STARTER-0001' : null,
        },
      }),
    });
  });

  const params = new URLSearchParams({
    order_no: 'ORDER-ZPAY-STARTER',
    amount: '9',
    name: '全能体验卡',
  });
  await page.goto(`/checkout/zpay?${params.toString()}`, {
    waitUntil: 'domcontentloaded',
  });

  await expect.poll(() => statusRequests).toBeGreaterThanOrEqual(1);
  await page.locator('[data-zpay-check-status]').click();
  await page.waitForURL(/\/welfare\/claim\?order_no=ORDER-ZPAY-STARTER/);
  await expect(page.getByText('支付成功，激活码已发放')).toHaveCount(0);
});
