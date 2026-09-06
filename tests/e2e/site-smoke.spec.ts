import { expect, test, type Locator } from '@playwright/test';

import { getAllDocSlugs } from '../../src/content/docs/registry';

const pages = [
  { path: '/', title: /MediaClaw|媒爪/i, testimonials: true },
  { path: '/pricing', title: /MediaClaw|媒爪/i, pricingCards: true },
  {
    path: '/download',
    title: /MediaClaw|媒爪/i,
    text: /新用户上手路径|New user setup path/i,
    downloadInstall: true,
  },
  {
    path: '/en/download',
    title: /Download MediaClaw|MediaClaw/i,
    text: /New user setup path/i,
    downloadInstall: true,
  },
  {
    path: '/welfare',
    title: /MediaClaw|媒爪/i,
    text: /9\s*元全能卡|5\s*天会员|50\s*积分/i,
  },
  {
    path: '/welfare/claim',
    title: /MediaClaw|媒爪/i,
    text: /请先登录后查看你的全能卡|登录 \/ 注册/i,
  },
  { path: '/referral', title: /MediaClaw|媒爪/i },
  {
    path: '/chat',
    title: /MediaClaw|媒爪/i,
    text: /今天有什么可以帮到你/i,
    chatComposer: true,
  },
  {
    path: '/activity/ai-tasks',
    title: /MediaClaw|媒爪/i,
    text: /AI 任务|AI Tasks/i,
    aiTaskActivity: true,
  },
  {
    path: '/partner',
    title: /MediaClaw|媒爪/i,
    text: /伙伴后台|当前账号还没有可访问的伙伴后台/i,
  },
  {
    path: '/partner/demo-channel/buy',
    title: /MediaClaw|媒爪/i,
    text: /伙伴购买入口|购买入口暂不可用/i,
  },
  { path: '/blog', title: /MediaClaw|媒爪/i, blogList: true },
  {
    path: '/blog/xiaohongshu-comment-analysis',
    title: /Xiaohongshu|小红书评论区|MediaClaw|媒爪/i,
    blogDetail: true,
  },
  {
    path: '/updates',
    title: /MediaClaw|媒爪/i,
    text: /更新日志|Product updates/i,
    timeline: true,
  },
  {
    path: '/docs',
    title: /介绍|MediaClaw|媒爪/i,
    docsDownload: true,
  },
  {
    path: '/docs/collect/comments',
    title: /采集作品评论.*MediaClaw/i,
    text: /采集笔记或视频下的评论内容/i,
    docsSeo: true,
  },
  {
    path: '/xiaohongshu/scraper',
    title: /MediaClaw|媒爪/i,
    text: /采集完成后，数据可以直接投入业务|Data can be used directly/i,
    compactHero: true,
    heroSampleModal: true,
    featureCards: true,
    faqAccordion: true,
  },
  {
    path: '/xiaohongshu/account-analysis',
    title: /小红书账号分析工具|MediaClaw/i,
    text: /小红书账号分析：找到对标账号，拆出\s*可复用的内容方法/i,
    heroImage: true,
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /小红书账号分析/i,
  },
  {
    path: '/en/xiaohongshu/account-analysis',
    title: /Xiaohongshu Account Analyzer|MediaClaw/i,
    text: /Xiaohongshu Account Analyzer: Find Benchmark Creators and Decode Their Content System/i,
    heroImage: true,
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /Xiaohongshu Account Analyzer/i,
  },
  {
    path: '/xiaohongshu/viral-content-analysis',
    title: /小红书爆款分析|MediaClaw/i,
    text: /小红书爆款分析：找到低粉爆文，拆清笔记\s*为什么有效/i,
    heroImage: true,
    heroImageSrc:
      '/imgs/docs/getting-started/first-draft/03-获得单篇拆解报告.webp',
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /小红书爆款分析/i,
    reportHeadingCount: 4,
  },
  {
    path: '/en/xiaohongshu/viral-content-analysis',
    title: /Xiaohongshu Viral Post Analysis|MediaClaw/i,
    text: /Xiaohongshu Viral Post Analysis: Find Low-Follower Hits and See Why They Work/i,
    heroImage: true,
    heroImageSrc:
      '/imgs/docs/getting-started/first-draft/03-获得单篇拆解报告.webp',
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /Xiaohongshu Viral Post Analysis/i,
    reportHeadingCount: 4,
  },
  {
    path: '/douyin/account-analysis',
    title: /抖音账号分析工具|MediaClaw/i,
    text: /抖音账号分析：找到对标账号，\s*拆清爆款视频规律/i,
    heroImage: true,
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /抖音账号分析/i,
  },
  {
    path: '/en/douyin/account-analysis',
    title: /Douyin Account Analyzer|MediaClaw/i,
    text: /Douyin Account Analyzer: Find Benchmark Creators and Decode Viral Video Patterns/i,
    heroImage: true,
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /Douyin Account Analyzer/i,
  },
  {
    path: '/douyin/viral-content-analysis',
    title: /抖音爆款分析|MediaClaw/i,
    text: /抖音爆款分析：找到低粉爆款，拆清视频\s*为什么有效/i,
    heroImage: true,
    heroImageSrc:
      '/imgs/docs/viral-research/single-post-breakdown/03-拆解报告概览.webp',
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /抖音爆款分析/i,
    reportHeadingCount: 4,
  },
  {
    path: '/en/douyin/viral-content-analysis',
    title: /Douyin Viral Video Analysis|MediaClaw/i,
    text: /Douyin Viral Video Analysis: Find Low-Follower Hits and See Why They Work/i,
    heroImage: true,
    heroImageSrc:
      '/imgs/docs/viral-research/single-post-breakdown/03-拆解报告概览.webp',
    featureCards: true,
    faqAccordion: true,
    semanticHeadingHierarchy: true,
    primaryKeyword: /Douyin Viral Video Analysis/i,
    reportHeadingCount: 4,
  },
];

async function clickUntilVisible(trigger: Locator, target: Locator) {
  await expect
    .poll(async () => {
      if (await target.isVisible().catch(() => false)) return true;
      await trigger.click().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 100));
      return target.isVisible().catch(() => false);
    })
    .toBe(true);
}

for (const item of pages) {
  test(`smoke ${item.path}`, async ({ page }) => {
    const response = await page.goto(item.path, {
      waitUntil: 'domcontentloaded',
    });

    expect(
      response?.status(),
      `${item.path} should not return 5xx`
    ).toBeLessThan(500);
    await expect(page).toHaveTitle(item.title);
    if ('text' in item) {
      await expect(page.locator('body')).toContainText(item.text);
    }
    if ('compactHero' in item) {
      await expect
        .poll(() =>
          page
            .locator('#hero')
            .evaluate((element) => getComputedStyle(element).minHeight)
        )
        .toBe('0px');
    }
    if ('heroImage' in item) {
      await expect(page.locator('#hero img')).toBeVisible();
      await expect(page.locator('#hero img')).toHaveAttribute(
        'src',
        'heroImageSrc' in item
          ? item.heroImageSrc
          : '/imgs/features/content-analysis-workflow-v20260719.png'
      );
    }
    if ('semanticHeadingHierarchy' in item) {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toContainText(item.primaryKeyword);
      await expect(page.locator('#value')).toHaveCount(0);
      await expect(page.locator('#core h2')).toHaveCount(1);
      await expect(page.locator('#core h3')).toHaveCount(4);
      await expect(page.locator('#report h2')).toHaveCount(1);
      await expect(page.locator('#report h3')).toHaveCount(
        'reportHeadingCount' in item ? item.reportHeadingCount : 5
      );
    }
    if ('testimonials' in item) {
      await expect(
        page.locator('#testimonials [data-testimonial-grid]')
      ).toBeVisible();
      await expect(
        page.locator('#testimonials [data-testimonial-card]')
      ).toHaveCount(6);
      await expect(page.locator('#testimonials')).toContainText(/Dayou/);
    }
    if ('faqAccordion' in item) {
      const firstFaqButton = page
        .locator('#faq button[aria-controls^="faq-panel"]')
        .first();
      await expect(firstFaqButton).toHaveAttribute('aria-expanded', 'false');
      await expect
        .poll(async () => {
          const expanded = await firstFaqButton.getAttribute('aria-expanded');
          if (expanded === 'true') return expanded;
          await firstFaqButton.click();
          await page.waitForTimeout(100);
          return firstFaqButton.getAttribute('aria-expanded');
        })
        .toBe('true');
    }
    if ('downloadInstall' in item) {
      await expect(
        page.locator('#download[data-download-section]')
      ).toBeVisible();
      await expect(
        page.locator('#download [data-download-heading]')
      ).toContainText(/下载并安装 MediaClaw|Download and Install MediaClaw/i);
      await expect(
        page.locator('#download [data-download-step-nav]')
      ).toBeVisible();
      await expect(
        page.locator('#download [data-download-step-card]')
      ).toHaveCount(3);
      await expect(
        page.locator('#download [data-download-step-connector]')
      ).toHaveCount(2);
      await expect(
        page.locator('#download [data-download-store-card]')
      ).toHaveCount(2);
      await expect(
        page.locator('#download [data-download-card-button]')
      ).toHaveCount(2);
      await expect(
        page.locator('#download [data-download-install-tabs]')
      ).toBeVisible();
      await expect(
        page.locator('#download-install-options[data-download-install-tabs]')
      ).toBeVisible();

      const packageTab = page.getByRole('tab', {
        name: /离线安装|Offline Installation/i,
      });
      const packagePanel = page.locator(
        '#download [data-download-package-panel]'
      );
      await expect(packageTab).toBeVisible();
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
      ).toContainText(/安全承诺|Security/i);
      await expect(
        page.locator('#download [data-download-manual-step]')
      ).toHaveCount(4);
      await expect(
        page.locator('#download [data-download-faq-grid] > div')
      ).toHaveCount(3);
      await expect(
        page.locator('#download [data-download-video-link]')
      ).toContainText(
        /查看安装及使用教程|Installation and Usage Guide|tutorial/i
      );
    }
    if ('docsSeo' in item) {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        /index,follow/
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://mediaclaw.app/docs/collect/comments'
      );
      await expect(
        page.locator('link[rel="alternate"][type="text/markdown"]')
      ).toHaveAttribute(
        'href',
        'https://mediaclaw.app/docs/collect/comments.md'
      );
      await expect(
        page.locator('script[type="application/ld+json"]')
      ).toHaveCount(2);
    }
    if ('docsDownload' in item) {
      const downloadLink = page.locator('[data-docs-download-link]');
      await expect(downloadLink).toBeVisible();
      await expect(downloadLink).toContainText(/我要使用|Get Started/i);
      await expect(downloadLink).toHaveAttribute('href', /\/download$/);
      await downloadLink.click();
      await expect(page).toHaveURL(/\/download(?:[?#]|$)/);
    }
    if ('chatComposer' in item) {
      await expect(page.locator('[data-chat-composer]')).toBeVisible();
      const reasoningToggle = page.locator('[data-chat-reasoning-toggle]');
      await expect(reasoningToggle).toHaveAttribute('aria-pressed', 'false');
      await expect
        .poll(async () => {
          const pressed = await reasoningToggle.getAttribute('aria-pressed');
          if (pressed === 'true') return pressed;
          await reasoningToggle.click();
          await page.waitForTimeout(100);
          return reasoningToggle.getAttribute('aria-pressed');
        })
        .toBe('true');
      await expect(page.locator('[data-chat-model-trigger]')).toContainText(
        /Kimi K2 Thinking|Deepseek R1|GPT-5|Claude/i
      );
      await expect(page.locator('[data-chat-submit]')).toBeDisabled();
    }
    if ('aiTaskActivity' in item) {
      await expect(page.locator('[data-ai-task-page]')).toBeVisible();
      await expect(page.locator('[data-ai-task-tabs="media"]')).toBeVisible();
      await expect(page.locator('[data-ai-task-tabs="status"]')).toBeVisible();
      await expect(
        page.locator('[data-ai-task-tabs="media"] button')
      ).toHaveCount(6);
      await expect(
        page.locator('[data-ai-task-tabs="status"] button')
      ).toHaveCount(5);
      await expect(page.locator('table')).toBeVisible();
    }
    if ('timeline' in item) {
      await expect(page.locator('#updates [data-timeline-rail]')).toBeVisible();
      await expect(page.locator('#updates [data-timeline-item]')).toHaveCount(
        12
      );
      await expect(page.locator('#updates')).toContainText(
        /v 0\.2\.0|v0\.2\.0/
      );
    }
    if ('featureCards' in item) {
      await expect(page.locator('#safety [data-feature-grid]')).toBeVisible();
      await expect(page.locator('#safety [data-feature-card]')).toHaveCount(3);
      await expect
        .poll(() =>
          page
            .locator('#safety [data-feature-icon]')
            .first()
            .evaluate((element) => {
              const styles = getComputedStyle(element);
              return `${styles.width}x${styles.height}`;
            })
        )
        .toBe('48pxx48px');
    }
    if ('heroSampleModal' in item) {
      const sampleButton = page.getByRole('button', {
        name: /查看数据示例/,
      });
      await expect(sampleButton.first()).toBeVisible();

      const dialog = page.getByRole('dialog');
      await clickUntilVisible(sampleButton.first(), dialog);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[data-sample-download]')).toHaveAttribute(
        'href',
        '/downloads/samples/xiaohongshu-sample-data.csv'
      );
      await expect(dialog.locator('[data-sample-table-scroll]')).toContainText(
        /我向往美好的生活|每日学英语/
      );

      const header = dialog.locator('thead');
      for (const label of [
        '博主',
        '标题',
        '正文',
        '笔记类型',
        '点赞',
        '收藏',
        '评论',
        '视频逐字稿',
        '图文文案',
        '评论内容',
      ]) {
        await expect(header).toContainText(label);
      }
    }
    if ('blogList' in item) {
      await expect(page.locator('#blog [data-blog-grid]')).toBeVisible();
      await expect(
        page.locator('#blog [data-blog-category-nav]')
      ).toBeVisible();
      await expect
        .poll(() => page.locator('#blog [data-blog-category-link]').count())
        .toBeGreaterThan(1);
      await expect
        .poll(() => page.locator('#blog [data-blog-card]').count())
        .toBeGreaterThanOrEqual(6);
      await expect
        .poll(() =>
          page
            .locator('#blog [data-blog-card-image]')
            .first()
            .evaluate((element) => {
              const rect = element.getBoundingClientRect();
              return Math.round((rect.width / rect.height) * 100);
            })
        )
        .toBe(178);
      await expect
        .poll(() =>
          page
            .locator('#blog [data-blog-card-image]')
            .first()
            .evaluate((element) => getComputedStyle(element).objectFit)
        )
        .toBe('cover');
      await expect
        .poll(() =>
          page
            .locator('#blog [data-blog-card-title]')
            .first()
            .evaluate((element) => getComputedStyle(element).webkitLineClamp)
        )
        .toBe('3');
    }
    if ('blogDetail' in item) {
      await expect(page.locator('[data-blog-detail]')).toBeVisible();
      await expect(page.locator('[data-blog-detail-hero]')).toBeVisible();
      await expect(page.locator('[data-blog-detail-title]')).toContainText(
        /Xiaohongshu|小红书评论区/i
      );
      await expect(page.locator('[data-blog-detail-meta]')).toContainText(
        /标签|tags/i
      );
      await expect
        .poll(() => page.locator('[data-blog-detail-tag]').count())
        .toBeGreaterThan(0);
      await expect(page.locator('[data-blog-detail-cover]')).toHaveCount(0);
      await expect(page.locator('[data-blog-detail-article]')).toBeVisible();
      await expect(page.locator('[data-blog-toc]')).toBeVisible();
      await expect
        .poll(() => page.locator('[data-blog-toc] a').count())
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          page
            .locator('[data-blog-detail-article]')
            .evaluate((element) => element.getBoundingClientRect().top)
        )
        .toBeLessThan(620);
      await expect
        .poll(() =>
          page
            .locator('[data-blog-detail-title]')
            .evaluate((element) =>
              parseFloat(getComputedStyle(element).fontSize)
            )
        )
        .toBeGreaterThanOrEqual(48);
      await expect(page.locator('[data-blog-related-desktop]')).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator('[data-blog-related-desktop] [data-blog-related-card]')
            .count()
        )
        .toBeGreaterThan(0);
      await expect(
        page.locator('[data-blog-related-desktop] [data-blog-related-image]')
      ).toHaveCount(0);
    }
    if ('pricingCards' in item) {
      await expect(page.locator('body')).toContainText(
        '从采集分析，到选题创作的一站式内容工作流'
      );
      await expect(
        page.locator('#pricing [data-pricing-group-tabs]')
      ).toBeVisible();
      await expect(page.locator('#pricing [data-pricing-card]')).toHaveCount(3);
      await expect(
        page.locator('#pricing [data-pricing-popular="true"]')
      ).toHaveCount(1);
      await expect(page.locator('#pricing [data-pricing-cta]')).toHaveCount(2);

      const yearlyButton = page.locator(
        '#pricing [data-pricing-group-button="yearly"]'
      );
      await expect
        .poll(async () => {
          const active = await yearlyButton.getAttribute('aria-pressed');
          if (active === 'true') return active;
          await yearlyButton.click();
          await page.waitForTimeout(100);
          return yearlyButton.getAttribute('aria-pressed');
        })
        .toBe('true');
      await expect(page.locator('#pricing')).toContainText(/年付(?:立)?省/);
      await expect(page.locator('[data-table-group-row]')).toHaveCount(3);
      await expect(page.locator('[data-table-subgroup-row]')).toHaveCount(8);
      await expect(page.locator('[data-desktop-data-table]')).toContainText(
        '把内容拿回来：采集、下载、筛选与提取'
      );
      await expect(page.locator('[data-desktop-data-table]')).toContainText(
        '把内容研究透：赛道、对标、选题与创作'
      );
      await expect(page.locator('[data-desktop-data-table]')).toContainText(
        '飞书多维表格同步、协作与 AI 模板'
      );
    }
    await expect(page.locator('body')).not.toContainText(
      /Internal Server Error|Application error|This page could not be found/i
    );
  });
}

test('english legacy sample modal keeps static asset paths', async ({
  page,
  request,
}) => {
  const response = await page.goto('/en/xiaohongshu/scraper', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);

  const sampleButton = page.getByRole('button', {
    name: /View Data Sample/i,
  });
  await expect(sampleButton.first()).toBeVisible();

  const dialog = page.getByRole('dialog');
  await clickUntilVisible(sampleButton.first(), dialog);

  const downloadLink = dialog.locator('[data-sample-download]');
  await expect(downloadLink).toHaveAttribute(
    'href',
    '/downloads/samples/xiaohongshu-sample-data.csv'
  );
  expect(await downloadLink.getAttribute('href')).not.toMatch(
    /^\/en\/downloads/
  );

  const sampleResponse = await request.get(
    '/downloads/samples/xiaohongshu-sample-data.csv'
  );
  expect(sampleResponse.status()).toBe(200);
});

test('legacy csv sample buttons open table previews', async ({ page }) => {
  const cases = [
    {
      path: '/douyin/scraper',
      button: /查看数据示例/,
      href: '/downloads/samples/douyin-sample-data.csv',
      headers: ['博主', '标题', '正文', '视频逐字稿', '图文文案'],
      body: /环球国际教育|采集平台/,
    },
    {
      path: '/xiaohongshu/leads',
      button: /查看客资示例/,
      href: '/downloads/samples/xiaohongshu-leads-sample.csv',
      headers: ['原笔记标题', '评论用户', 'IP属地', '命中关键词'],
      body: /小红薯65F954B2|买/,
    },
  ];

  for (const item of cases) {
    const response = await page.goto(item.path, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(200);

    const sampleButton = page
      .getByRole('button', { name: item.button })
      .first();
    await expect(sampleButton).toBeVisible();
    const dialog = page.getByRole('dialog');
    await clickUntilVisible(sampleButton, dialog);
    await expect(dialog.locator('[data-sample-download]')).toHaveAttribute(
      'href',
      item.href
    );
    await expect(dialog.locator('[data-sample-table-scroll]')).toContainText(
      item.body
    );

    const header = dialog.locator('thead');
    for (const label of item.headers) {
      await expect(header).toContainText(label);
    }
  }
});

test('changelog redirects to localized updates page', async ({ page }) => {
  const response = await page.goto('/en/changelog', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBeLessThan(500);
  expect(new URL(page.url()).pathname).toBe('/en/updates');
  await expect(page.locator('body')).toContainText(
    /Update Logs|Product updates/i
  );
});

const legacyZhRedirects = [
  {
    from: '/zh/douyin/downloader',
    to: '/douyin/downloader',
    title: /抖音去水印下载/,
  },
  {
    from: '/zh/douyin/transcript',
    to: '/douyin/transcript',
    title: /抖音视频(?:口播)?逐字稿/,
  },
  {
    from: '/zh/douyin/image-text',
    to: '/douyin/image-text',
    title: /抖音图文文案提取/,
  },
  {
    from: '/zh/xiaohongshu/transcript',
    to: '/xiaohongshu/transcript',
    title: /小红书视频(?:口播)?逐字稿/,
  },
  {
    from: '/zh/xiaohongshu/image-text',
    to: '/xiaohongshu/image-text',
    title: /小红书图文文案提取/,
  },
] as const;

for (const item of legacyZhRedirects) {
  test(`legacy zh URL redirects ${item.from}`, async ({ page }) => {
    const response = await page.goto(item.from, {
      waitUntil: 'domcontentloaded',
    });

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(item.to);
    await expect(page).toHaveTitle(item.title);
  });
}

test('documentation discovery resources expose every tutorial', async ({
  request,
}) => {
  const slugs = getAllDocSlugs();
  const [docsIndex, sampleDoc, llms, llmsFull, sitemap, robots] =
    await Promise.all([
      request.get('/docs.md'),
      request.get('/docs/collect/comments.md'),
      request.get('/llms.txt'),
      request.get('/llms-full.txt'),
      request.get('/sitemap.xml'),
      request.get('/robots.txt'),
    ]);

  for (const response of [
    docsIndex,
    sampleDoc,
    llms,
    llmsFull,
    sitemap,
    robots,
  ]) {
    expect(response.status()).toBe(200);
  }

  expect(sampleDoc.headers()['content-type']).toContain('text/markdown');
  expect(sampleDoc.headers().link).toContain(
    '<https://mediaclaw.app/docs/collect/comments>; rel="canonical"'
  );
  expect(await sampleDoc.text()).toContain('# 采集作品评论');

  const docsIndexText = await docsIndex.text();
  const llmsText = await llms.text();
  const llmsFullText = await llmsFull.text();
  const sitemapText = await sitemap.text();
  const robotsText = await robots.text();

  for (const slug of slugs) {
    expect(docsIndexText).toContain(`https://mediaclaw.app/docs/${slug}.md`);
    expect(llmsText).toContain(`https://mediaclaw.app/docs/${slug}.md`);
    expect(llmsFullText).toContain(
      `Canonical: https://mediaclaw.app/docs/${slug}`
    );
    expect(sitemapText).toContain(
      `<loc>https://mediaclaw.app/docs/${slug}</loc>`
    );
  }

  expect(robotsText).toContain('User-Agent: OAI-SearchBot');
  expect(robotsText).toContain('Sitemap: https://mediaclaw.app/sitemap.xml');
});
