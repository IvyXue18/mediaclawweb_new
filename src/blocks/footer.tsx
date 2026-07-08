import { SiteFooter, type FooterColumn } from '@/components/site-footer';

export function Footer() {
  const columns: FooterColumn[] = [
    {
      title: '核心功能',
      links: [
        { label: '小红书数据采集', href: '/xiaohongshu/scraper' },
        { label: '小红书评论采集', href: '/xiaohongshu/comments' },
        { label: '抖音数据采集', href: '/douyin/scraper' },
        { label: '对标监控', href: '/xiaohongshu/monitoring' },
        { label: '飞书同步', href: '/features/feishu-integration' },
      ],
    },
    {
      title: '产品',
      links: [
        { label: '下载插件', href: '/download' },
        { label: '价格方案', href: '/pricing' },
        { label: '福利中心', href: '/welfare?entry=footer' },
        { label: '伙伴计划', href: '/referral' },
        { label: '更新日志', href: '/updates' },
      ],
    },
    {
      title: '资源',
      links: [
        { label: '博客', href: '/blog' },
        { label: '案例展示', href: '/showcases' },
        { label: '文档', href: '/docs' },
        { label: '账号设置', href: '/settings' },
      ],
    },
    {
      title: '法律',
      links: [
        { label: '隐私政策', href: '/privacy-policy' },
        { label: '服务条款', href: '/terms-of-service' },
      ],
    },
  ];

  return (
    <SiteFooter
      tagline="小红书/抖音采集分析、选题创作一套搞定"
      columns={columns}
    />
  );
}
