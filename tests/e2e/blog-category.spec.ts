import { expect, test } from '@playwright/test';

test('blog category archive renders the migrated listing instead of a placeholder', async ({
  page,
}) => {
  const response = await page.goto('/blog', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('#blog [data-blog-category-nav]')).toBeVisible();
  await expect
    .poll(() => page.locator('#blog [data-blog-category-link]').count())
    .toBeGreaterThan(1);

  const categoryLink = page.locator('#blog [data-blog-category-link]').nth(1);
  const categoryLabel = (
    await categoryLink.locator('span').first().innerText()
  ).trim();
  const href = await categoryLink.getAttribute('href');
  expect(href).toContain('/blog/category/');

  await categoryLink.click();
  await expect(page).toHaveURL(/\/blog\/category\//);
  await expect(
    page.locator('#blog [data-blog-category-link][data-active="true"]')
  ).toContainText(categoryLabel);
  await expect(page.locator('#blog [data-blog-grid]')).toBeVisible();
  await expect
    .poll(() => page.locator('#blog [data-blog-card]').count())
    .toBeGreaterThan(0);
  await expect(
    page
      .locator('#blog [data-blog-card-tag]')
      .filter({ hasText: categoryLabel })
  ).not.toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(
    /Category archive URLs are preserved|Open blog/i
  );
});

test('blog category archive keeps the old card grid usable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog', {
    waitUntil: 'domcontentloaded',
  });

  const categoryLink = page.locator('#blog [data-blog-category-link]').nth(1);
  await categoryLink.click();

  await expect(page.locator('#blog [data-blog-category-nav]')).toBeVisible();
  await expect(page.locator('#blog [data-blog-grid]')).toBeVisible();
  await expect
    .poll(() => page.locator('#blog [data-blog-card]').count())
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);
});
