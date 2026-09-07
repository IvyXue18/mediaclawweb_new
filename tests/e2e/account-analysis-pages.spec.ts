import { expect, test } from '@playwright/test';

const accountAnalysisPages = [
  {
    path: '/xiaohongshu/account-analysis',
    title: /小红书账号分析工具|MediaClaw/i,
    heading: /小红书账号分析/i,
  },
  {
    path: '/en/xiaohongshu/account-analysis',
    title: /Xiaohongshu Account Analyzer|MediaClaw/i,
    heading: /Xiaohongshu Account Analyzer/i,
  },
  {
    path: '/douyin/account-analysis',
    title: /抖音账号分析工具|MediaClaw/i,
    heading: /抖音账号分析/i,
  },
  {
    path: '/en/douyin/account-analysis',
    title: /Douyin Account Analyzer|MediaClaw/i,
    heading: /Douyin Account Analyzer/i,
  },
] as const;

for (const item of accountAnalysisPages) {
  test(`account analysis landing page ${item.path}`, async ({ page }) => {
    const response = await page.goto(item.path, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBeLessThan(500);
    await expect(page).toHaveTitle(item.title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(item.heading);
    await expect(page.locator('#hero img')).toBeVisible();
    await expect(page.locator('#hero img')).toHaveAttribute(
      'src',
      /^\/imgs\/features\/content-analysis-workflow-v20260719\.png\?v=[a-f0-9]{16}$/
    );
    await expect(page.locator('#value')).toHaveCount(0);
    await expect(page.locator('#core h2')).toHaveCount(1);
    await expect(page.locator('#core h3')).toHaveCount(4);
    await expect(page.locator('#report h2')).toHaveCount(1);
    await expect(page.locator('#report h3')).toHaveCount(5);
    await expect(page.locator('#faq')).toBeVisible();
    await expect(page.locator('#cta')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(
      /Internal Server Error|Application error|This page could not be found/i
    );
  });
}
