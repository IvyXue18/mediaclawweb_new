import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
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
  TrendingUp,
  UserCheck,
  UserSearch,
  Workflow,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { envConfigs } from '@/config';
import {
  queueAnalyticsEventSafe,
  recordAnalyticsEventSafe,
} from '@/lib/client-analytics';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DouyinIcon, XiaohongshuIcon } from '@/components/brand-icons';
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
  /** Feature categories shown inside a platform tab (the one-platform-at-a-time menu). */
  categories?: NavCategory[];
  /** Platform hub this group belongs to; the tab title and "see all" link point here. */
  hubUrl?: string;
  /** Analytics slug, shared with the hub pages so nav_* and hub_* events use one vocabulary. */
  platform?: 'xiaohongshu' | 'douyin';
  /** Marks the tabbed "core features" menu that shows a single platform at a time. */
  platformSwitch?: boolean;
};

type NavCategory = {
  title: string;
  children: NavItem[];
};

/** Hub feature ids are the last URL segment, so nav and hub events report the same value. */
function featureIdFromUrl(url?: string) {
  if (!url) return '';
  return url.split('?')[0].split('/').filter(Boolean).pop() || '';
}

/** Nav categories mirror the platform hub's scene structure
 * (src/content/platform-hubs/*.ts): same category names, same feature
 * membership, same order. Two hub scenes are intentionally absent — "Agent 接入"
 * has no feature pages yet, and Feishu lives in the Integrations menu. */
function getPlatformCategories(
  platform: 'xiaohongshu' | 'douyin'
): NavCategory[] {
  const isXhs = platform === 'xiaohongshu';
  const base = `/${platform}`;
  const pick = (xhs: string, douyin: string) => (isXhs ? xhs : douyin);

  const feature = {
    keywords: {
      title: m['site.header.keyword_insights'](),
      description: m['site.header.keyword_insights_desc'](),
      url: `${base}/keywords`,
      icon: 'Search',
    },
    viral: {
      title: m['site.header.viral_content_analysis'](),
      description: pick(
        m['site.header.xhs_viral_content_analysis_desc'](),
        m['site.header.douyin_viral_content_analysis_desc']()
      ),
      url: `${base}/viral-content-analysis`,
      icon: 'TrendingUp',
    },
    account: {
      title: m['site.header.account_analysis'](),
      description: pick(
        m['site.header.xhs_account_analysis_desc'](),
        m['site.header.douyin_account_analysis_desc']()
      ),
      url: `${base}/account-analysis`,
      icon: 'UserSearch',
    },
    scraper: {
      title: pick(
        m['site.header.note_scraping'](),
        m['site.header.video_scraping']()
      ),
      description: pick(
        m['site.header.note_scraping_desc'](),
        m['site.header.douyin_video_scraping_desc']()
      ),
      url: `${base}/scraper`,
      icon: 'Database',
    },
    comments: {
      title: m['site.header.comment_scraping'](),
      description: m['site.header.comment_scraping_desc'](),
      url: `${base}/comments`,
      icon: 'MessageCircle',
    },
    downloader: {
      title: m['site.header.watermark_free_download'](),
      description: pick(
        m['site.header.xhs_download_desc'](),
        m['site.header.douyin_download_desc']()
      ),
      url: `${base}/downloader`,
      icon: 'Download',
    },
    imageText: {
      title: m['site.header.image_text'](),
      description: pick(
        m['site.header.xhs_image_text_desc'](),
        m['site.header.douyin_image_text_desc']()
      ),
      url: `${base}/image-text`,
      icon: 'ScanText',
    },
    transcript: {
      title: m['site.header.video_transcript'](),
      description: pick(
        m['site.header.xhs_video_transcript_desc'](),
        m['site.header.douyin_video_transcript_desc']()
      ),
      url: `${base}/transcript`,
      icon: 'AudioLines',
    },
    leads: {
      title: m['site.header.lead_scraping'](),
      description: m['site.header.lead_scraping_desc'](),
      url: `${base}/leads`,
      icon: 'UserCheck',
    },
    monitoring: {
      title: m['site.header.competitor_monitoring'](),
      description: pick(
        m['site.header.xhs_competitor_monitoring_desc'](),
        m['site.header.douyin_competitor_monitoring_desc']()
      ),
      url: `${base}/monitoring`,
      icon: 'Radar',
    },
  };

  return [
    {
      title: m['site.header.category_research'](),
      children: isXhs
        ? [feature.keywords, feature.viral, feature.account]
        : [feature.account, feature.viral, feature.keywords],
    },
    {
      title: m['site.header.category_data'](),
      children: [feature.scraper, feature.comments, feature.downloader],
    },
    {
      title: m['site.header.category_extract'](),
      children: isXhs
        ? [feature.imageText, feature.transcript, feature.leads]
        : [feature.transcript, feature.imageText, feature.leads],
    },
    {
      title: m['site.header.category_track'](),
      children: [feature.monitoring],
    },
  ];
}

function getNavItems(): NavItem[] {
  return [
    {
      title: m['site.header.core_features'](),
      icon: 'LayoutGrid',
      // Plan A: one platform at a time. Tabs switch the visible platform; every
      // feature link still renders server-side, so internal-link crawlability is
      // preserved (see internal-link-building-and-tracking.md §6.2) even though
      // features are now grouped by category instead of a flat expose-six list.
      platformSwitch: true,
      children: [
        {
          title: m['site.header.xiaohongshu'](),
          icon: 'BookOpen',
          hubUrl: '/xiaohongshu',
          platform: 'xiaohongshu',
          categories: getPlatformCategories('xiaohongshu'),
        },
        {
          title: m['site.header.douyin'](),
          icon: 'Clapperboard',
          hubUrl: '/douyin',
          platform: 'douyin',
          categories: getPlatformCategories('douyin'),
        },
      ],
    },
    {
      // Integrations live in their own top-level menu, separate from the core
      // feature set. Feishu today; Codex, workbuddy and others land here next.
      title: m['site.header.integrations'](),
      icon: 'Workflow',
      children: [
        {
          title: m['site.header.feishu_integration'](),
          description: m['site.header.feishu_integration_desc'](),
          url: '/features/feishu-integration',
          icon: 'Table2',
        },
      ],
    },
    {
      title: m['site.header.resources'](),
      icon: 'Library',
      children: [
        {
          title: m['site.header.blog'](),
          description: m['site.header.blog_desc'](),
          url: '/blog',
          icon: 'BookText',
        },
        {
          title: m['site.header.product_docs'](),
          description: m['site.header.product_docs_desc'](),
          url: '/docs',
          icon: 'BookOpen',
        },
        {
          title: m['site.header.tutorials'](),
          description: m['site.header.tutorials_desc'](),
          url: 'https://my.feishu.cn/wiki/TczWwrrGmiDRw3kWeojcXd5CnHh?from=from_copylink',
          icon: 'GraduationCap',
          target: '_blank',
        },
        {
          title: m['site.header.rewards'](),
          description: m['site.header.rewards_desc'](),
          url: '/welfare?entry=header_nav',
          icon: 'Gift',
        },
        {
          title: m['site.header.updates'](),
          description: m['site.header.updates_desc'](),
          url: '/updates',
          icon: 'History',
        },
        {
          title: m['site.header.partner_program'](),
          description: m['site.header.partner_program_desc'](),
          url: '/referral',
          icon: 'Handshake',
        },
      ],
    },
    { title: m['site.header.download'](), url: '/download', icon: 'Download' },
    { title: m['site.header.pricing'](), url: '/pricing', icon: 'CreditCard' },
  ];
}

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
  TrendingUp,
  UserCheck,
  UserSearch,
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

function trackNavFeatureClick(
  platform: string,
  child: NavItem,
  position: number,
  placement: 'desktop' | 'mobile'
) {
  recordAnalyticsEventSafe('nav_feature_click', {
    platform,
    feature: featureIdFromUrl(child.url),
    target_page: child.url || '',
    position,
    placement,
  });
}

function trackNavPlatformSelect(
  group: NavItem,
  surface: 'desktop' | 'mobile',
  // 'tab' = switched the visible platform; 'hub' = followed the "see all" link.
  action: 'tab' | 'hub'
) {
  recordAnalyticsEventSafe('nav_platform_select', {
    platform: group.platform || '',
    target_page: group.hubUrl || '',
    action,
    surface,
  });
}

/** Real platform marks, so a tab is recognisable before its label is read. */
function PlatformBrandIcon({
  platform,
  className,
}: {
  platform?: string;
  className?: string;
}) {
  if (platform === 'xiaohongshu')
    return <XiaohongshuIcon className={className} />;
  if (platform === 'douyin') return <DouyinIcon className={className} />;
  return null;
}

/** Segmented platform switcher — the heart of Plan A. Both platforms stay in the
 * DOM; only the selected one is visible, so the menu reads as one platform at a
 * time without dropping the other's links. */
function PlatformTabBar({
  platforms,
  active,
  onSelect,
}: {
  platforms: NavItem[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
      {platforms.map((platform, index) => {
        const isActive = active === index;
        return (
          <button
            key={platform.title}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(index)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-all',
              // The selected platform has to be unmistakable: raised pill, ring,
              // bolder label and a full-colour logo against desaturated ones.
              isActive
                ? 'bg-background text-foreground ring-primary/40 font-semibold shadow-sm ring-2'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground font-medium'
            )}
          >
            <PlatformBrandIcon
              platform={platform.platform}
              className={cn(
                'size-4 shrink-0 transition-all',
                !isActive && 'opacity-40 grayscale'
              )}
            />
            <span>{platform.title}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The active platform's features, grouped by category. `position` is a running
 * index across categories so analytics keep a stable per-platform ordering. */
function PlatformCategoryList({
  platform,
  categories,
  surface,
  onNavigate,
}: {
  platform: string;
  categories: NavCategory[];
  surface: 'desktop' | 'mobile';
  /** Mobile passes the drawer-close handler so following a link dismisses the menu. */
  onNavigate?: () => void;
}) {
  let offset = 0;
  const sections = categories.map((category) => {
    const section = { category, start: offset };
    offset += category.children.length;
    return section;
  });

  return (
    <div
      className={cn(
        // Four categories stack too tall for a hover panel, so on desktop the
        // categories themselves are the two columns and each one lists its
        // features in a single column.
        surface === 'mobile'
          ? 'space-y-4 px-2'
          : 'grid grid-cols-2 gap-x-4 gap-y-4'
      )}
    >
      {sections.map(({ category, start }) => (
        <div key={category.title}>
          {/* Deliberately icon-free: the feature rows below already carry icons,
              and a second icon column made the panel read as noise. */}
          <div className="text-muted-foreground px-2 pb-1.5 text-xs font-semibold">
            {category.title}
          </div>
          <ul className={cn('grid gap-1')}>
            {category.children.map((child, index) => (
              <li key={child.title}>
                <MenuItemLink
                  item={child}
                  onClick={() => {
                    trackNavFeatureClick(
                      platform,
                      child,
                      start + index + 1,
                      surface
                    );
                    onNavigate?.();
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Desktop "core features" dropdown: platform tabs + the active platform's
 * categorized features. Tab state persists while the panel stays mounted. */
function PlatformFeaturesPanel({ item }: { item: NavItem }) {
  const platforms =
    item.children?.filter((child) => child.categories?.length) || [];
  const [active, setActive] = useState(0);

  return (
    <div className="invisible absolute top-full left-1/2 z-50 mt-2 w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
      {/* The panel closes when the pointer leaves it, so keep any overflow scrolling inside. */}
      <div className="border-border/60 bg-popover max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border p-3 shadow-2xl">
        <div className="border-border/60 mb-3 flex items-center gap-3 border-b pb-3">
          <div className="flex-1">
            <PlatformTabBar
              platforms={platforms}
              active={active}
              onSelect={(index) => {
                setActive(index);
                trackNavPlatformSelect(platforms[index], 'desktop', 'tab');
              }}
            />
          </div>
          {platforms.map((group, index) =>
            group.hubUrl ? (
              <Link
                key={group.title}
                href={group.hubUrl}
                onClick={() => trackNavPlatformSelect(group, 'desktop', 'hub')}
                className={cn(
                  'text-muted-foreground hover:text-primary flex shrink-0 items-center gap-1 px-1 text-xs font-medium whitespace-nowrap transition-colors',
                  index !== active && 'hidden'
                )}
              >
                {m['site.header.view_all_platform_features']({
                  platform: group.title,
                })}
                <ArrowUpRight className="size-3.5" />
              </Link>
            ) : null
          )}
        </div>

        {/* Every platform renders; switching tabs only toggles visibility, so all
            feature and hub links stay in the served HTML
            (internal-link-building-and-tracking.md §6.2). */}
        {platforms.map((group, index) => (
          <div key={group.title} className={cn(index !== active && 'hidden')}>
            <PlatformCategoryList
              platform={group.platform || ''}
              categories={group.categories || []}
              surface="desktop"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mobile "core features" section: the same platform tabs and categorized list,
 * rendered inline inside the drawer instead of a floating panel. */
function MobilePlatformFeatures({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const platforms =
    item.children?.filter((child) => child.categories?.length) || [];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3 px-2">
      <PlatformTabBar
        platforms={platforms}
        active={active}
        onSelect={(index) => {
          setActive(index);
          trackNavPlatformSelect(platforms[index], 'mobile', 'tab');
        }}
      />
      {platforms.map((group, index) => (
        <div
          key={group.title}
          className={cn('space-y-3', index !== active && 'hidden')}
        >
          {group.hubUrl ? (
            <Link
              href={group.hubUrl}
              onClick={() => {
                trackNavPlatformSelect(group, 'mobile', 'hub');
                onNavigate();
              }}
              className="text-primary flex items-center gap-1 px-2 text-xs font-medium"
            >
              {m['site.header.view_all_platform_features']({
                platform: group.title,
              })}
              <ArrowUpRight className="size-3.5" />
            </Link>
          ) : null}
          <PlatformCategoryList
            platform={group.platform || ''}
            categories={group.categories || []}
            surface="mobile"
            onNavigate={onNavigate}
          />
        </div>
      ))}
    </div>
  );
}

/** Simple list dropdown for menus without platform tabs (Integrations, Resources). */
function DropdownPanel({ item }: { item: NavItem }) {
  return (
    <div className="invisible absolute top-full left-1/2 z-50 mt-2 w-[22rem] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
      <div className="border-border/60 bg-popover max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border p-3 shadow-2xl">
        <ul className="space-y-1">
          {item.children?.map((child) => (
            <li key={child.title}>
              <MenuItemLink item={child} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MenuItemLink({
  item,
  onClick,
}: {
  item: NavItem;
  onClick?: () => void;
}) {
  const href = item.url || '#';
  const inner = (
    <>
      <div className="bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors">
        <SmartIcon name={item.icon} className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground truncate text-sm font-medium">
          {item.title}
        </div>
        {item.description ? (
          <p className="text-muted-foreground/80 line-clamp-1 text-xs leading-snug">
            {item.description}
          </p>
        ) : null}
      </div>
    </>
  );

  // Dense list: hover changes background and icon tint only. No lift, scale or
  // text shift — at ten rows per column that reads as jitter.
  const className =
    'group/item flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50';

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={item.target || '_blank'}
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {inner}
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
      {inner}
    </Link>
  );
}

function DesktopNav() {
  const navItems = getNavItems();
  // The dropdown opens on CSS hover/focus, so "opened" is reported once per menu
  // per page view rather than on every pointer pass.
  const openedMenus = useRef(new Set<string>());
  const trackOpen = (title: string) => {
    if (openedMenus.current.has(title)) return;
    openedMenus.current.add(title);
    queueAnalyticsEventSafe('nav_open', { menu: title, surface: 'desktop' });
  };

  return (
    <nav className="hidden flex-1 items-center justify-center lg:flex">
      <ul className="flex items-center gap-1">
        {navItems.map((item) => (
          <li key={item.title} className="group/nav relative">
            {item.children?.length ? (
              <>
                <button
                  type="button"
                  onPointerEnter={() => trackOpen(item.title)}
                  onFocus={() => trackOpen(item.title)}
                  className="hover:bg-accent/50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  <SmartIcon name={item.icon} className="size-4" />
                  <span>{item.title}</span>
                  <ChevronDown className="size-3.5 opacity-70 transition-transform group-hover/nav:rotate-180" />
                </button>
                {item.platformSwitch ? (
                  <PlatformFeaturesPanel item={item} />
                ) : (
                  <DropdownPanel item={item} />
                )}
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
  const navItems = getNavItems();
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
              {item.platformSwitch ? (
                <MobilePlatformFeatures item={item} onNavigate={closeMenu} />
              ) : (
                item.children.map((child) => (
                  <HeaderLink
                    key={child.title}
                    item={child}
                    onClick={closeMenu}
                    className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                  />
                ))
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

export function HeaderAuthAction({
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
      {m['site.header.sign_in']()}
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
          'border-border/50 mx-auto max-w-7xl border backdrop-blur-lg transition-all duration-300',
          // The glassy pill works at bar height; once the mobile drawer fills the
          // screen the page bleeds through it, so go opaque while it is open.
          isMobileMenuOpen ? 'bg-background' : 'bg-background/85',
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
