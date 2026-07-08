import { useEffect, useRef, useState } from 'react';
import {
  AudioLines,
  BookOpen,
  BookText,
  ChevronDown,
  Clapperboard,
  CreditCard,
  Database,
  Download,
  Gift,
  GraduationCap,
  Handshake,
  History,
  LayoutGrid,
  Library,
  Menu,
  MessageCircle,
  Radar,
  ScanText,
  Search,
  Table2,
  UserCheck,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import { cn } from '@/lib/utils';
import { LocaleSelector } from '@/components/locale-selector';
import { SiteUserMenu } from '@/components/site-user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

type NavItem = {
  title: string;
  url?: string;
  icon?: string;
  description?: string;
  target?: string;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    title: '核心功能',
    icon: 'LayoutGrid',
    children: [
      {
        title: '小红书',
        icon: 'BookOpen',
        children: [
          {
            title: '笔记采集',
            description:
              '批量采集笔记数据与搜索结果数据，支持关键词页和账号页入口',
            url: '/xiaohongshu/scraper',
            icon: 'Database',
          },
          {
            title: '视频逐字稿',
            description: '一键提取视频笔记口播逐字稿，输出带时间戳分句稿',
            url: '/xiaohongshu/transcript',
            icon: 'AudioLines',
          },
          {
            title: '图文文案提取',
            description: '对封面和配图做 OCR，提取图片里的文字内容',
            url: '/xiaohongshu/image-text',
            icon: 'ScanText',
          },
          {
            title: '评论采集',
            description: '批量采集评论数据，支持后续评论挖掘与需求分析',
            url: '/xiaohongshu/comments',
            icon: 'MessageCircle',
          },
          {
            title: '客资采集',
            description: '从评论数据中挖掘高意向客户线索，导出客资名单',
            url: '/xiaohongshu/leads',
            icon: 'UserCheck',
          },
          {
            title: '关键词洞察',
            description: '批量做关键词挖掘、搜索词分析与选题规划',
            url: '/xiaohongshu/keywords',
            icon: 'Search',
          },
          {
            title: '竞品监控',
            description: '自动监控对标账号内容更新与爆款趋势',
            url: '/xiaohongshu/monitoring',
            icon: 'Radar',
          },
          {
            title: '去水印下载',
            description: '一键下载图文和视频素材，便于二次分析',
            url: '/xiaohongshu/downloader',
            icon: 'Download',
          },
        ],
      },
      {
        title: '抖音',
        icon: 'Clapperboard',
        children: [
          {
            title: '视频采集',
            description: '按关键词、作者和话题快速采集视频数据与搜索结果数据',
            url: '/douyin/scraper',
            icon: 'Database',
          },
          {
            title: '视频逐字稿',
            description: '一键提取抖音口播逐字稿，带时间戳分句节奏稿',
            url: '/douyin/transcript',
            icon: 'AudioLines',
          },
          {
            title: '图文文案提取',
            description: '对封面和合集图做 OCR，把商品卡片和教程文字提出来',
            url: '/douyin/image-text',
            icon: 'ScanText',
          },
          {
            title: '评论采集',
            description: '批量采集评论数据，支持后续评论挖掘与需求分析',
            url: '/douyin/comments',
            icon: 'MessageCircle',
          },
          {
            title: '客资采集',
            description: '从评论数据中挖掘高意向客户线索，导出客资名单',
            url: '/douyin/leads',
            icon: 'UserCheck',
          },
          {
            title: '关键词洞察',
            description: '批量做关键词挖掘、搜索词分析与选题规划',
            url: '/douyin/keywords',
            icon: 'Search',
          },
          {
            title: '竞品监控',
            description: '自动监控竞品账号内容更新，识别增长动作',
            url: '/douyin/monitoring',
            icon: 'Radar',
          },
          {
            title: '去水印下载',
            description: '提取原始 MP4 直链，无水印保存视频和图文素材',
            url: '/douyin/downloader',
            icon: 'Download',
          },
        ],
      },
      {
        title: '生态',
        icon: 'Workflow',
        children: [
          {
            title: '飞书集成',
            description: '采集数据、评论数据和监控结果自动同步飞书多维表格',
            url: '/features/feishu-integration',
            icon: 'Table2',
          },
        ],
      },
    ],
  },
  {
    title: '资源',
    icon: 'Library',
    children: [
      {
        title: '博客',
        description: '内容营销方法、案例与实战指南',
        url: '/blog',
        icon: 'BookText',
      },
      {
        title: '教程',
        description: '从零开始的产品使用教程与最佳实践',
        url: 'https://my.feishu.cn/wiki/TczWwrrGmiDRw3kWeojcXd5CnHh?from=from_copylink',
        icon: 'GraduationCap',
        target: '_blank',
      },
      {
        title: '福利中心',
        description: '领取试用与使用奖励',
        url: '/welfare?entry=header_nav',
        icon: 'Gift',
      },
      {
        title: '更新日志',
        description: '查看产品版本发布与功能改进记录',
        url: '/updates',
        icon: 'History',
      },
      {
        title: '伙伴计划',
        description: '联盟营销、推广链接与佣金提现',
        url: '/referral',
        icon: 'Handshake',
      },
    ],
  },
  { title: '下载', url: '/download', icon: 'Download' },
  { title: '定价', url: '/pricing', icon: 'CreditCard' },
];

const navIconMap: Record<string, LucideIcon> = {
  AudioLines,
  BookOpen,
  BookText,
  Clapperboard,
  CreditCard,
  Database,
  Download,
  Gift,
  GraduationCap,
  Handshake,
  History,
  LayoutGrid,
  Library,
  MessageCircle,
  Radar,
  ScanText,
  Search,
  Table2,
  UserCheck,
  Workflow,
};

function SmartIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = navIconMap[name];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden="true" />;
}

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}

function HeaderLink({
  item,
  className,
  onClick,
}: {
  item: NavItem;
  className?: string;
  onClick?: () => void;
}) {
  const href = item.url || '#';
  const content = (
    <>
      {item.icon ? <SmartIcon name={item.icon} className="size-4" /> : null}
      <span>{item.title}</span>
    </>
  );

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={item.target || '_blank'}
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={item.target}
      className={className}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}

function DropdownPanel({ item }: { item: NavItem }) {
  const hasGroups = item.children?.some((child) => child.children?.length);

  return (
    <div
      className={cn(
        'invisible absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100',
        hasGroups ? 'w-[min(50rem,calc(100vw-2rem))]' : 'w-[22rem]'
      )}
    >
      <div className="border-border/50 bg-card/95 rounded-xl border p-3 shadow-xl backdrop-blur-md">
        {hasGroups ? (
          <div className="grid gap-3 md:grid-cols-3">
            {item.children?.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <div className="text-muted-foreground flex items-center gap-2 px-2 text-xs font-semibold">
                  <SmartIcon name={group.icon} className="size-3.5" />
                  <span>{group.title}</span>
                </div>
                <ul className="space-y-1">
                  {group.children?.map((child) => (
                    <li key={child.title}>
                      <MenuItemLink item={child} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {item.children?.map((child) => (
              <li key={child.title}>
                <MenuItemLink item={child} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MenuItemLink({ item }: { item: NavItem }) {
  const href = item.url || '#';
  const inner = (
    <>
      <div className="border-border/40 bg-muted/20 text-muted-foreground group-hover/item:text-foreground group-hover/item:bg-muted/40 group-hover/item:border-foreground/20 flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300 group-hover/item:scale-105">
        <SmartIcon name={item.icon} className="size-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-foreground truncate text-[15px] leading-7 font-semibold transition-transform duration-300 group-hover/item:translate-x-1">
          {item.title}
        </div>
        {item.description ? (
          <p className="text-muted-foreground/70 group-hover/item:text-muted-foreground line-clamp-1 text-xs leading-snug transition-colors">
            {item.description}
          </p>
        ) : null}
      </div>
    </>
  );

  const className =
    'group/item flex w-full items-start gap-3.5 rounded-2xl p-2.5 transition-all duration-300 hover:bg-muted/30 hover:-translate-y-0.5 hover:shadow-sm';

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={item.target || '_blank'}
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} target={item.target} className={className}>
      {inner}
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav className="hidden flex-1 items-center justify-center lg:flex">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.title} className="group/nav relative">
            {item.children?.length ? (
              <>
                <button
                  type="button"
                  className="hover:bg-accent/50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  <SmartIcon name={item.icon} className="size-4" />
                  <span>{item.title}</span>
                  <ChevronDown className="size-3.5 opacity-70 transition-transform group-hover/nav:rotate-180" />
                </button>
                <DropdownPanel item={item} />
              </>
            ) : (
              <HeaderLink
                item={item}
                className="hover:bg-accent/50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileNav({ closeMenu }: { closeMenu: () => void }) {
  return (
    <nav className="space-y-2 px-4 pt-4 pb-6 lg:hidden">
      {navItems.map((item) => (
        <div key={item.title} className="space-y-1">
          {item.children?.length ? (
            <>
              <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-sm font-semibold">
                <SmartIcon name={item.icon} className="size-4" />
                <span>{item.title}</span>
              </div>
              {item.children.map((child) =>
                child.children?.length ? (
                  <div key={child.title} className="space-y-1 py-1">
                    <div className="text-muted-foreground flex items-center gap-2 px-4 py-1 text-xs font-semibold">
                      <SmartIcon name={child.icon} className="size-4" />
                      <span>{child.title}</span>
                    </div>
                    {child.children.map((leaf) => (
                      <HeaderLink
                        key={leaf.title}
                        item={leaf}
                        onClick={closeMenu}
                        className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                      />
                    ))}
                  </div>
                ) : (
                  <HeaderLink
                    key={child.title}
                    item={child}
                    onClick={closeMenu}
                    className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                  />
                )
              )}
            </>
          ) : (
            <HeaderLink
              item={item}
              onClick={closeMenu}
              className="hover:bg-accent/50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            />
          )}
        </div>
      ))}
    </nav>
  );
}

function HeaderAuthAction({
  loginClassName,
  onSignInClick,
}: {
  loginClassName: string;
  onSignInClick?: () => void;
}) {
  const { data: session, isPending } = useSession();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || isPending) {
    return (
      <span
        aria-hidden="true"
        className="bg-muted/50 inline-flex size-10 shrink-0 rounded-full"
      />
    );
  }

  const user = session?.user;

  if (user) {
    return (
      <SiteUserMenu
        name={user.name || 'User'}
        email={user.email}
        image={user.image}
      />
    );
  }

  return (
    <Link href="/sign-in" className={loginClassName} onClick={onSignInClick}>
      登录
    </Link>
  );
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const next = window.scrollY > 20;
        if (next !== isScrolledRef.current) {
          isScrolledRef.current = next;
          setIsScrolled(next);
        }
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 lg:px-8 lg:pt-4">
      <div
        className={cn(
          'border-border/50 bg-background/85 mx-auto max-w-7xl border backdrop-blur-lg transition-all duration-300',
          isMobileMenuOpen ? 'overflow-hidden rounded-3xl' : 'rounded-full',
          isScrolled || isMobileMenuOpen ? 'shadow-lg' : 'shadow-md'
        )}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-5 lg:h-16 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            {envConfigs.app_logo ? (
              <img
                src={envConfigs.app_logo}
                alt={envConfigs.app_name}
                width={40}
                height={40}
                decoding="async"
                fetchPriority="high"
                className="size-8 rounded-lg lg:size-9"
              />
            ) : null}
            <span className="text-xl font-semibold tracking-normal">
              {envConfigs.app_name}
            </span>
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="border-border/50 hidden items-center gap-2 border-l pl-3 lg:flex">
              <ThemeToggle />
              <LocaleSelector />
              <HeaderAuthAction loginClassName="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20 transition-colors" />
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="hover:bg-accent/50 flex size-10 items-center justify-center rounded-full transition-colors lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-border/50 max-h-[calc(100dvh-6rem)] overflow-y-auto border-t lg:hidden">
            <MobileNav closeMenu={() => setIsMobileMenuOpen(false)} />
            <div className="border-border/50 flex items-center justify-between gap-4 border-t px-4 py-4">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LocaleSelector />
              </div>
              <HeaderAuthAction
                loginClassName="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
                onSignInClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
