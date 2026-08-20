import { expect, test } from '@playwright/test';

const legacyMobilePages = [
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

for (const path of legacyMobilePages) {
  test(`legacy JSON page mobile structure ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const response = await page.goto(path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status(), `${path} should not return 5xx`).toBeLessThan(
      500
    );
    await expect(page.locator('#hero')).toBeVisible();
    if (
      path.endsWith('/account-analysis') ||
      path.endsWith('/viral-content-analysis')
    ) {
      await expect
        .poll(() =>
          page
            .locator('#hero')
            .evaluate((element) =>
              parseFloat(getComputedStyle(element).minHeight)
            )
        )
        .toBeGreaterThan(500);
    } else {
      await expect
        .poll(() =>
          page
            .locator('#hero')
            .evaluate((element) => getComputedStyle(element).minHeight)
        )
        .toBe('0px');
    }
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('#cta')).toBeVisible();

    const firstFaqButton = page
      .locator('#faq button[aria-controls^="faq-panel"]')
      .first();
    await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');
    await expect
      .poll(async () => {
        const expanded = await firstFaqButton.getAttribute('aria-expanded');
        if (expanded === 'true') return expanded;
        await firstFaqButton.scrollIntoViewIfNeeded().catch(() => undefined);
        await firstFaqButton.click({ force: true }).catch(() => undefined);
        await page.waitForTimeout(100);
        return firstFaqButton.getAttribute('aria-expanded');
      })
      .toBe('true');

    await expect
      .poll(() =>
        page
          .locator('table')
          .evaluateAll(
            (tables) =>
              tables.filter((table) => table.getClientRects().length > 0).length
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
