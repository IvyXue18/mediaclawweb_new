import { expect, test } from '@playwright/test';

const protectedPages = [
  '/admin/users',
  '/admin/credentials',
  '/admin/credits',
  '/admin/payments',
  '/admin/referral',
  '/admin/referral/withdrawals',
  '/admin/referral/risks',
  '/admin/partners',
  '/admin/rewards/channel-survey',
  '/admin/rewards/experience-feedback',
  '/admin/rewards/ledger',
  '/settings/credentials',
  '/settings/credits',
  '/settings/billing',
  '/settings/billing/cancel?subscription_no=SUB-SMOKE',
  '/settings/billing/retrieve?subscription_no=SUB-SMOKE',
  '/settings/payments',
  '/settings/referral',
  '/settings/security',
];

for (const path of protectedPages) {
  test(`protected smoke ${path}`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

    expect(
      response?.status(),
      `${path} should not return 5xx before auth redirect`
    ).toBeLessThan(500);

    await page.waitForURL(/\/sign-in/, { timeout: 15_000 }).catch(() => {});

    await expect(page.locator('body')).not.toContainText(
      /Internal Server Error|Application error|This page could not be found/i
    );
  });
}
