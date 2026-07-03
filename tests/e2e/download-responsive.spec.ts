import { expect, test } from '@playwright/test';

test('download page keeps old-site onboarding structure usable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const response = await page.goto('/download', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('#download[data-download-section]')).toBeVisible();
  await expect(
    page.locator('#download [data-download-mobile-step-nav]')
  ).toBeVisible();
  await expect(page.locator('#download [data-download-step-card]')).toHaveCount(
    3
  );
  await expect(
    page.locator('#download [data-download-store-card]')
  ).toHaveCount(2);

  const packageTab = page.locator('#download [data-download-package-tab]');
  const packagePanel = page.locator('#download [data-download-package-panel]');
  await expect
    .poll(async () => {
      if (await packagePanel.isVisible().catch(() => false)) return true;
      await packageTab.click();
      await page.waitForTimeout(100);
      return packagePanel.isVisible().catch(() => false);
    })
    .toBe(true);
  await expect(packagePanel).toBeVisible();
  await expect(
    page.locator('#download [data-download-security-card]')
  ).toBeVisible();
  await expect(
    page.locator('#download [data-download-manual-step]')
  ).toHaveCount(4);
  await expect(
    page.locator('#download [data-download-faq-grid] > div')
  ).toHaveCount(3);

  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);
});
