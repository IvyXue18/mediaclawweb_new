import { expect, test } from '@playwright/test';

const legacyDesktopPages = [
  '/xiaohongshu/account-analysis',
  '/xiaohongshu/viral-content-analysis',
  '/douyin/account-analysis',
  '/douyin/viral-content-analysis',
  '/xiaohongshu/scraper',
  '/xiaohongshu/comments',
  '/xiaohongshu/downloader',
  '/xiaohongshu/image-text',
  '/xiaohongshu/transcript',
  '/xiaohongshu/keywords',
  '/xiaohongshu/leads',
  '/xiaohongshu/monitoring',
  '/douyin/scraper',
  '/douyin/comments',
  '/douyin/downloader',
  '/douyin/image-text',
  '/douyin/transcript',
  '/douyin/keywords',
  '/douyin/leads',
  '/douyin/monitoring',
  '/features/feishu-integration',
] as const;

for (const path of legacyDesktopPages) {
  test(`legacy JSON page desktop structure ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const response = await page.goto(path, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('load');

    expect(response?.status(), `${path} should not return 5xx`).toBeLessThan(
      500
    );
    await expect(page.locator('#hero')).toBeVisible();
    await expect(
      page.locator('[data-desktop-data-table] table').first()
    ).toBeVisible();
    await expect(page.locator('[data-related-links]')).toBeVisible();
    await expect(page.locator('#cta')).toBeVisible();

    const hasFeatureScroll = await page
      .locator('[data-features-scroll]')
      .isVisible()
      .catch(() => false);

    if (hasFeatureScroll) {
      const featureItems = page.locator('[data-features-scroll-item]');
      const featureItemCount = await featureItems.count();
      expect(
        featureItemCount,
        `${path} should render old-theme feature rows`
      ).toBeGreaterThan(0);

      await expect
        .poll(() =>
          featureItems
            .first()
            .evaluate((element) => getComputedStyle(element).flexDirection)
        )
        .toBe('row');

      if (featureItemCount > 1) {
        await expect
          .poll(() =>
            featureItems
              .nth(1)
              .evaluate((element) => getComputedStyle(element).flexDirection)
          )
          .toBe('row-reverse');
      }

      await expect
        .poll(() =>
          page
            .locator('[data-features-scroll-media]')
            .evaluateAll(
              (items) =>
                items.filter((item) => item.getClientRects().length > 0).length
            )
        )
        .toBeGreaterThan(0);
    } else {
      await expect(page.locator('[data-feature-grid]').first()).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator('[data-feature-card]')
            .evaluateAll(
              (items) =>
                items.filter((item) => item.getClientRects().length > 0).length
            )
        )
        .toBeGreaterThan(0);
    }

    await expect
      .poll(() =>
        page
          .locator('[data-related-link-card]')
          .evaluateAll(
            (items) =>
              items.filter((item) => item.getClientRects().length > 0).length
          )
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        page
          .locator('[data-mobile-data-row]')
          .evaluateAll(
            (rows) =>
              rows.filter((row) => row.getClientRects().length > 0).length
          )
      )
      .toBe(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth
        )
      )
      .toBeLessThanOrEqual(1);
    await expect(page.locator('body')).not.toContainText(
      /Internal Server Error|Application error|This page could not be found/i
    );
  });
}
