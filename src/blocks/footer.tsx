import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['site.footer.core_features'](),
      groups: [
        {
          title: m['site.header.xiaohongshu'](),
          links: [
            {
              label: m['site.header.account_analysis'](),
              href: '/xiaohongshu/account-analysis',
            },
            {
              label: m['site.header.note_scraping'](),
              href: '/xiaohongshu/scraper',
            },
            {
              label: m['site.header.video_transcript'](),
              href: '/xiaohongshu/transcript',
            },
            {
              label: m['site.header.image_text'](),
              href: '/xiaohongshu/image-text',
            },
            {
              label: m['site.header.comment_scraping'](),
              href: '/xiaohongshu/comments',
            },
            {
              label: m['site.header.lead_scraping'](),
              href: '/xiaohongshu/leads',
            },
            {
              label: m['site.header.keyword_insights'](),
              href: '/xiaohongshu/keywords',
            },
            {
              label: m['site.header.competitor_monitoring'](),
              href: '/xiaohongshu/monitoring',
            },
            {
              label: m['site.header.watermark_free_download'](),
              href: '/xiaohongshu/downloader',
            },
          ],
        },
        {
          title: m['site.header.douyin'](),
          links: [
            {
              label: m['site.header.account_analysis'](),
              href: '/douyin/account-analysis',
            },
            {
              label: m['site.header.video_scraping'](),
              href: '/douyin/scraper',
            },
            {
              label: m['site.header.video_transcript'](),
              href: '/douyin/transcript',
            },
            {
              label: m['site.header.image_text'](),
              href: '/douyin/image-text',
            },
            {
              label: m['site.header.comment_scraping'](),
              href: '/douyin/comments',
            },
            { label: m['site.header.lead_scraping'](), href: '/douyin/leads' },
            {
              label: m['site.header.keyword_insights'](),
              href: '/douyin/keywords',
            },
            {
              label: m['site.header.competitor_monitoring'](),
              href: '/douyin/monitoring',
            },
            {
              label: m['site.header.watermark_free_download'](),
              href: '/douyin/downloader',
            },
          ],
        },
        {
          title: m['site.header.ecosystem'](),
          links: [
            {
              label: m['site.header.feishu_integration'](),
              href: '/features/feishu-integration',
            },
          ],
        },
      ],
    },
    {
      title: m['site.footer.product'](),
      links: [
        { label: m['site.footer.download'](), href: '/download' },
        { label: m['site.footer.pricing'](), href: '/pricing' },
      ],
    },
    {
      title: m['site.footer.resources'](),
      links: [
        { label: m['site.footer.blog'](), href: '/blog' },
        {
          label: m['site.footer.tutorials'](),
          href: 'https://my.feishu.cn/wiki/TczWwrrGmiDRw3kWeojcXd5CnHh?from=from_copylink',
        },
        { label: m['site.footer.rewards'](), href: '/welfare?entry=footer' },
        { label: m['site.footer.updates'](), href: '/updates' },
        { label: m['site.footer.partner_program'](), href: '/referral' },
      ],
    },
    {
      title: m['site.footer.legal'](),
      links: [
        { label: m['site.footer.privacy'](), href: '/privacy-policy' },
        { label: m['site.footer.terms'](), href: '/terms-of-service' },
      ],
    },
  ];

  return <SiteFooter tagline={m['site.footer.tagline']()} columns={columns} />;
}
