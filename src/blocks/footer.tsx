import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['site.footer.xiaohongshu_hub'](),
      titleHref: '/xiaohongshu',
      links: [
        {
          label: m['site.footer.xiaohongshu_keywords'](),
          href: '/xiaohongshu/keywords',
        },
        {
          label: m['site.footer.xiaohongshu_viral_analysis'](),
          href: '/xiaohongshu/viral-content-analysis',
        },
        {
          label: m['site.footer.xiaohongshu_account_analysis'](),
          href: '/xiaohongshu/account-analysis',
        },
        {
          label: m['site.footer.xiaohongshu_scraper'](),
          href: '/xiaohongshu/scraper',
        },
        {
          label: m['site.footer.xiaohongshu_comments'](),
          href: '/xiaohongshu/comments',
        },
        {
          label: m['site.footer.xiaohongshu_downloader'](),
          href: '/xiaohongshu/downloader',
        },
        {
          label: m['site.footer.xiaohongshu_image_text'](),
          href: '/xiaohongshu/image-text',
        },
        {
          label: m['site.footer.xiaohongshu_transcript'](),
          href: '/xiaohongshu/transcript',
        },
        {
          label: m['site.footer.xiaohongshu_leads'](),
          href: '/xiaohongshu/leads',
        },
        {
          label: m['site.footer.xiaohongshu_monitoring'](),
          href: '/xiaohongshu/monitoring',
        },
      ],
    },
    {
      title: m['site.footer.douyin_hub'](),
      titleHref: '/douyin',
      links: [
        {
          label: m['site.footer.douyin_account_analysis'](),
          href: '/douyin/account-analysis',
        },
        {
          label: m['site.footer.douyin_viral_analysis'](),
          href: '/douyin/viral-content-analysis',
        },
        {
          label: m['site.footer.douyin_keywords'](),
          href: '/douyin/keywords',
        },
        {
          label: m['site.footer.douyin_scraper'](),
          href: '/douyin/scraper',
        },
        {
          label: m['site.footer.douyin_comments'](),
          href: '/douyin/comments',
        },
        {
          label: m['site.footer.douyin_downloader'](),
          href: '/douyin/downloader',
        },
        {
          label: m['site.footer.douyin_transcript'](),
          href: '/douyin/transcript',
        },
        {
          label: m['site.footer.douyin_image_text'](),
          href: '/douyin/image-text',
        },
        {
          label: m['site.footer.douyin_leads'](),
          href: '/douyin/leads',
        },
        {
          label: m['site.footer.douyin_monitoring'](),
          href: '/douyin/monitoring',
        },
      ],
    },
    {
      title: m['site.header.integrations'](),
      links: [
        {
          label: m['site.header.feishu_integration'](),
          href: '/features/feishu-integration',
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
        { label: m['site.footer.reviews'](), href: '/customers' },
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
