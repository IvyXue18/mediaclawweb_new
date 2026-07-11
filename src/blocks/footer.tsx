import { m } from '@/paraglide/messages.js';
import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: m['site.footer.core_features'](),
      links: [
        {
          label: m['site.footer.xhs_scraping'](),
          href: '/xiaohongshu/scraper',
        },
        {
          label: m['site.footer.xhs_comments'](),
          href: '/xiaohongshu/comments',
        },
        { label: m['site.footer.douyin_scraping'](), href: '/douyin/scraper' },
        {
          label: m['site.footer.monitoring'](),
          href: '/xiaohongshu/monitoring',
        },
        {
          label: m['site.footer.feishu_sync'](),
          href: '/features/feishu-integration',
        },
      ],
    },
    {
      title: m['site.footer.product'](),
      links: [
        { label: m['site.footer.download'](), href: '/download' },
        { label: m['site.footer.pricing'](), href: '/pricing' },
        { label: m['site.footer.rewards'](), href: '/welfare?entry=footer' },
        { label: m['site.footer.partner_program'](), href: '/referral' },
        { label: m['site.footer.updates'](), href: '/updates' },
      ],
    },
    {
      title: m['site.footer.resources'](),
      links: [
        { label: m['site.footer.blog'](), href: '/blog' },
        { label: m['site.footer.showcases'](), href: '/showcases' },
        { label: m['site.footer.docs'](), href: '/docs' },
        { label: m['site.footer.settings'](), href: '/settings' },
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
