import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  AudioLines,
  BellRing,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  ChartColumn,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Chrome,
  Clapperboard,
  ClipboardCheck,
  Coins,
  Columns3,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  FileCode,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Filter,
  FilterX,
  FolderKanban,
  Gauge,
  Globe,
  GraduationCap,
  History,
  Image,
  ImageDown,
  ImageUp,
  KeyRound,
  Layers,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  LogIn,
  MessageCircle,
  MessageSquareText,
  Minus,
  Mouse,
  PiggyBank,
  Play,
  Plus,
  Radar,
  Rocket,
  Route,
  ScanText,
  Search,
  Share,
  ShieldCheck,
  Sparkles,
  SpellCheck2,
  Table2,
  Timer,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  UserPlus,
  Users,
  UserSearch,
  Video,
  Wand2,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import { apiGet, apiPost, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  parseVideoMediaFragment,
  resolveStaticVideoPoster,
  stripVideoMediaFragment,
  videoPosterSizes,
} from '@/lib/video-posters';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type LegacyPageData = {
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  page?: {
    title?: string;
    description?: string;
    show_sections?: string[];
    sections?: Record<string, LegacySection>;
  };
  hero?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    primary_action?: string;
    sign_in_action?: string;
    secondary_action?: string;
  };
  partner_promo?: {
    eyebrow?: string;
    title?: string;
    you?: string;
    friend?: string;
    action?: string;
    banner_title?: string;
    banner_action?: string;
  };
  reward_flow?: {
    title?: string;
    items?: LegacyItem[];
    guide?: {
      title?: string;
      steps?: string[];
    };
  };
  channel_survey?: {
    title?: string;
    description?: string;
    source_options?: Array<{ label: string; value: string }>;
    role_options?: Array<{ label: string; value: string }>;
    platform_options?: Array<{ label: string; value: string }>;
    use_case_options?: Array<{
      label: string;
      value: string;
      capabilities?: string[];
    }>;
  };
  experience_feedback?: {
    title?: string;
    description?: string;
    progress?: Record<string, string>;
    reward_label?: string;
    reward_value?: string;
  };
};

type LegacySection = {
  id?: string;
  block?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
  highlight_text?: string;
  announcement?: {
    badge?: string;
    title?: string;
    url?: string;
  };
  breadcrumbs?: Array<{ title?: string; url?: string; target?: string }>;
  buttons?: LegacyButton[];
  button?: LegacyButton;
  image?: LegacyImage | null;
  image_invert?: LegacyImage | null;
  video?: {
    src?: string;
    embed_src?: string;
    poster?: string;
    title?: string;
    start?: number | string;
    end?: number | string;
  };
  video_embed_url?: string;
  video_start?: number | string;
  video_end?: number | string;
  items?: LegacyItem[];
  rows?: Array<Record<string, string>>;
  columns?: Array<{ key: string; title: string }> | number | string;
  links?: LegacyItem[];
  groups?: Array<{ name: string; title: string; label?: string }>;
  features?: LegacyItem[];
  market_tab_title?: string;
  package_tab_title?: string;
  market_items?: LegacyDownloadItem[];
  package_items?: LegacyDownloadItem[];
  steps_title?: string;
  steps?: LegacyItem[];
  faq_title?: string;
  download_faq?: Array<{ question: string; answer: string }>;
  video_button?: LegacyButton;
  video_title?: string;
  video_poster?: string;
  video_url?: string;
  security_title?: string;
  security_description?: string;
  tip?: string;
};

type LegacyButton = {
  title?: string;
  url?: string;
  icon?: string;
  variant?: string;
  target?: string;
  action?: string;
  video_url?: string;
  video_embed_url?: string;
  video_poster?: string;
  video_title?: string;
  video_start?: number | string;
  video_end?: number | string;
};

type LegacyImage = {
  src?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
};

type LegacyItem = {
  title?: string;
  name?: string;
  version?: string;
  date?: string;
  description?: string;
  answer?: string;
  question?: string;
  quote?: string;
  role?: string;
  icon?: string;
  url?: string;
  target?: string;
  group?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  is_featured?: boolean;
  is_popular?: boolean;
  label?: string;
  price?: string;
  original_price?: string;
  unit?: string;
  tip?: string;
  features_title?: string;
  product_id?: string;
  product_name?: string;
  valid_days?: number;
  credits?: number;
  payment_providers?: string[];
  image?: LegacyImage;
  button?: LegacyButton;
  links?: LegacyButton[];
  features?: string[];
  tags?: string[];
  highlights?: string[];
  note?: string;
  badge?: string;
};

type LegacyDownloadItem = LegacyItem & {
  button_text?: string;
  button_url?: string;
};

type CheckoutMode = 'issue' | 'recharge';

type DemoVideoConfig = {
  src?: string;
  embedSrc?: string;
  title?: string;
  poster?: string;
  start?: number;
  end?: number;
};

type UserCredentialSummary = {
  id?: string;
  code?: string;
  planCode?: string | null;
  status?: string | null;
  expiresAt?: string | Date | null;
};

type OnboardingCopy = {
  badge: string;
  flowTitle: string;
  flowHint: string;
  currentBadge: string;
  nextBadge: string;
  steps: Array<{
    id: string;
    number: string;
    title: string;
    description: string;
    action?: string;
    href?: string;
    external?: boolean;
    icon: typeof Download;
  }>;
};

const TUTORIAL_URL =
  'https://my.feishu.cn/wiki/TczWwrrGmiDRw3kWeojcXd5CnHh?from=from_copylink';

function getOnboardingCopy(section: LegacySection): OnboardingCopy {
  const isEnglish =
    /download|install|extension|chrome|edge/i.test(
      `${section.title || ''} ${section.description || ''}`
    ) && !/[一-龥]/.test(`${section.title || ''}${section.description || ''}`);

  if (isEnglish) {
    return {
      badge: 'New user setup path',
      flowTitle: 'Get started in 3 steps',
      flowHint:
        'Start with Step 1 to install the extension, then claim or buy an activation code and follow the tutorial.',
      currentBadge: 'Current step',
      nextBadge: 'Next step',
      steps: [
        {
          id: 'install',
          number: '01',
          title: 'Install extension',
          description:
            'Install from the Chrome / Edge store first; use the offline CRX package when store access is unavailable.',
          icon: Download,
        },
        {
          id: 'activate',
          number: '02',
          title: 'Claim / enter activation code',
          description:
            'Without a code, visit the welfare center to claim a 2-day trial; if you already have a code, enter it in the extension.',
          action: 'Claim trial',
          href: '/welfare?source=onboarding&entry=download',
          icon: KeyRound,
        },
        {
          id: 'tutorial',
          number: '03',
          title: 'Follow setup tutorial',
          description:
            'Finish first-time setup and collection, then export data or sync it to Feishu.',
          action: 'View tutorial',
          href: TUTORIAL_URL,
          external: true,
          icon: GraduationCap,
        },
      ],
    };
  }

  return {
    badge: '新用户上手路径',
    flowTitle: '3 步完成上手',
    flowHint:
      '先在第 1 步完成插件安装，安装后继续领取或购买激活码，并按教程完成首次采集。',
    currentBadge: '当前步骤',
    nextBadge: '后续步骤',
    steps: [
      {
        id: 'install',
        number: '01',
        title: '安装插件',
        description:
          '优先通过 Chrome / Edge 商店安装；商店访问不便时，可使用离线 CRX 安装包。',
        icon: Download,
      },
      {
        id: 'activate',
        number: '02',
        title: '领取/输入激活码',
        description:
          '没有激活码时，可到福利中心完成渠道反馈领取 2 天试用；已有激活码可直接在插件里输入。',
        action: '领取试用',
        href: '/welfare?source=onboarding&entry=download',
        icon: KeyRound,
      },
      {
        id: 'tutorial',
        number: '03',
        title: '跟随教程配置',
        description:
          '按教程完成首次配置与实操采集，把小红书/抖音数据导出或同步到飞书。',
        action: '看教程',
        href: TUTORIAL_URL,
        external: true,
        icon: GraduationCap,
      },
    ],
  };
}

const legacyIconMap: Record<string, LucideIcon> = {
  Activity,
  AudioLines,
  BellRing,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  ChartColumn,
  CheckCircle,
  CheckCircle2,
  Chrome,
  Clapperboard,
  ClipboardCheck,
  Coins,
  Columns3,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  FileCode,
  FileSearch,
  FileSpreadsheet,
  FileText,
  Filter,
  FilterX,
  FolderKanban,
  Gauge,
  Globe,
  GraduationCap,
  History,
  Image,
  ImageDown,
  ImageUp,
  KeyRound,
  Layers,
  Link: LinkIcon,
  ListChecks,
  Loader2,
  LogIn,
  MessageCircle,
  MessageSquareText,
  Minus,
  Mouse,
  PiggyBank,
  Play,
  Plus,
  Radar,
  RiEdgeNewLine: Chrome,
  Route,
  Rocket,
  ScanText,
  Search,
  Share,
  ShieldCheck,
  Sparkles,
  SpellCheck2,
  Table2,
  Timer,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  UserPlus,
  UserSearch,
  Users,
  Video,
  Wand2,
  Workflow,
  Zap,
};

const legacyImageSizes: Record<string, { width: number; height: number }> = {
  '/imgs/features/1-v20260424.webp': { width: 1200, height: 744 },
  '/imgs/features/2-v20260309.webp': { width: 1200, height: 750 },
  '/imgs/features/3-v20260309.webp': { width: 1200, height: 728 },
  '/imgs/features/4-v20260309.webp': { width: 1200, height: 766 },
  '/imgs/features/7-v20260309.webp': { width: 1200, height: 922 },
  '/imgs/features/9-v20260424.webp': { width: 1200, height: 794 },
  '/imgs/features/10-v20260424.webp': { width: 1200, height: 694 },
  '/imgs/features/11-v20260424.webp': { width: 1200, height: 778 },
  '/imgs/features/12-v20260424.webp': { width: 1650, height: 1038 },
  '/imgs/features/12-v20260425.webp': { width: 1600, height: 1049 },
  '/imgs/features/13-v20260424.webp': { width: 1058, height: 1200 },
  '/imgs/features/13-v20260425.webp': { width: 1600, height: 1085 },
  '/imgs/features/14-v20260424.webp': { width: 1200, height: 1142 },
  '/imgs/features/14-v20260425.webp': { width: 1600, height: 1048 },
  '/imgs/features/15-v20260425.webp': { width: 1600, height: 1212 },
  '/imgs/features/16-v20260424.webp': { width: 1600, height: 1151 },
  '/imgs/features/1-v20260513.png': { width: 2518, height: 1872 },
  '/imgs/features/11-v20260425.webp': { width: 1600, height: 848 },
  ...videoPosterSizes,
  '/imgs/features/platform-douyin.webp': { width: 952, height: 1978 },
  '/imgs/features/platform-xiaohongshu.webp': { width: 970, height: 1982 },
  '/logo.png': { width: 128, height: 128 },
};

const defaultVideoPoster = '/imgs/features/1-v20260424.webp';

function SmartIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <CheckCircle2 className={className} aria-hidden="true" />;

  const Icon = legacyIconMap[name];
  if (!Icon) return <CheckCircle2 className={className} aria-hidden="true" />;

  return <Icon className={className} aria-hidden="true" />;
}

function isEmbedUrl(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function toEmbedUrl(url: string): string {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }

  return url;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function resolveLegacyImageSize(image?: LegacyImage) {
  if (!image?.src) return undefined;

  const width = readNumber(image.width);
  const height = readNumber(image.height);
  if (width && height) return { width, height };

  return legacyImageSizes[image.src];
}

function collectSectionImages(section?: LegacySection): LegacyImage[] {
  if (!section) return [];

  const images: LegacyImage[] = [];
  if (section.image?.src) images.push(section.image);
  if (section.image_invert?.src) images.push(section.image_invert);

  const groups = [
    section.items,
    section.features,
    section.links,
    section.steps,
    section.market_items,
    section.package_items,
  ];

  for (const group of groups) {
    for (const item of group || []) {
      if (item.image?.src) images.push(item.image);
    }
  }

  return images;
}

function resolvePageVideoFallbackPoster(data: LegacyPageData): string {
  const sections = data.page?.sections;
  if (!sections) return defaultVideoPoster;

  const sectionKeys = data.page?.show_sections || Object.keys(sections);
  const nonHeroKeys = sectionKeys.filter((key) => key !== 'hero');
  const orderedKeys = [
    ...nonHeroKeys,
    ...sectionKeys.filter((key) => key === 'hero'),
  ];

  for (const key of orderedKeys) {
    const image = collectSectionImages(sections[key])[0];
    if (image?.src) return image.src;
  }

  return defaultVideoPoster;
}

function LegacyImageElement({
  image,
  alt,
  className,
  loading = 'lazy',
  sizes,
  fetchPriority,
}: {
  image: LegacyImage;
  alt?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  sizes?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  if (!image.src) return null;

  const size = resolveLegacyImageSize(image);

  return (
    <img
      src={image.src}
      alt={alt ?? image.alt ?? ''}
      width={size?.width}
      height={size?.height}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      sizes={sizes}
      className={className}
    />
  );
}

function formatTime(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildTimedSrc(src: string, start?: number): string {
  const base = stripVideoMediaFragment(src);
  if (typeof start === 'number' && start > 0) {
    return `${base}#t=${formatTime(start)}`;
  }

  return base;
}

function resolveDemoVideoConfig(
  section?: LegacySection,
  source?: LegacyButton,
  fallbackPoster?: string
): DemoVideoConfig | null {
  const rawEmbed =
    source?.video_embed_url ||
    section?.video_embed_url ||
    section?.video?.embed_src;
  const rawSrc =
    source?.video_url ||
    section?.video_url ||
    section?.video?.src ||
    (source?.action === 'open_video_modal' ? source.url : undefined);
  const title =
    source?.video_title ||
    source?.title ||
    section?.video_title ||
    section?.video?.title ||
    section?.title ||
    'Product demo video';

  const fragment = parseVideoMediaFragment(rawSrc);
  const start =
    readNumber(source?.video_start) ??
    readNumber(section?.video_start) ??
    readNumber(section?.video?.start) ??
    fragment.start;
  const end =
    readNumber(source?.video_end) ??
    readNumber(section?.video_end) ??
    readNumber(section?.video?.end) ??
    fragment.end;
  const rawPoster =
    source?.video_poster ||
    section?.video_poster ||
    section?.video?.poster ||
    resolveStaticVideoPoster(rawSrc || rawEmbed, start) ||
    section?.image?.src ||
    fallbackPoster;

  if (rawEmbed) {
    return {
      embedSrc: toEmbedUrl(rawEmbed),
      title,
      poster: rawPoster,
      start,
      end,
    };
  }

  if (!rawSrc) return null;

  if (isEmbedUrl(rawSrc)) {
    return {
      embedSrc: toEmbedUrl(rawSrc),
      title,
      poster: rawPoster,
      start,
      end,
    };
  }

  return {
    src: rawSrc,
    title,
    poster: rawPoster,
    start,
    end,
  };
}

function SegmentedVideo({
  config,
  preview = false,
}: {
  config: DemoVideoConfig;
  preview?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const start = config.start ?? 0;
  const src = config.src ? buildTimedSrc(config.src, start) : undefined;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const seekToStart = () => {
      if (start > 0 && Math.abs(video.currentTime - start) > 0.5) {
        try {
          video.currentTime = start;
        } catch {
          // Browsers can reject early seeking before enough metadata is loaded.
        }
      }
    };

    const stopAtEnd = () => {
      if (!preview && config.end && video.currentTime >= config.end) {
        video.pause();
        try {
          video.currentTime = start;
        } catch {
          // Keep playback stable if range seeking is rejected.
        }
      }
    };

    video.addEventListener('loadedmetadata', seekToStart);
    video.addEventListener('loadeddata', seekToStart);
    video.addEventListener('timeupdate', stopAtEnd);
    seekToStart();

    return () => {
      video.removeEventListener('loadedmetadata', seekToStart);
      video.removeEventListener('loadeddata', seekToStart);
      video.removeEventListener('timeupdate', stopAtEnd);
    };
  }, [config.end, preview, src, start]);

  if (!src) return null;

  return (
    <video
      ref={videoRef}
      className="size-full bg-black object-contain"
      controls={!preview}
      preload="metadata"
      autoPlay={!preview}
      muted={preview}
      playsInline
      poster={config.poster}
    >
      <source src={src} />
    </video>
  );
}

function formatVersionLabel(version?: string) {
  const normalized = version?.trim();
  if (!normalized) return '';
  if (/^[vV]\s*/.test(normalized)) {
    return normalized.replace(/^[V]/, 'v');
  }
  return `v ${normalized}`;
}

function RichText({
  children,
  className,
}: {
  children?: string;
  className?: string;
}) {
  if (!children) return null;

  return (
    <p className={className} dangerouslySetInnerHTML={{ __html: children }} />
  );
}

function ActionButton({
  button,
  onVideo,
  className,
}: {
  button: LegacyButton;
  onVideo?: (button: LegacyButton) => void;
  className?: string;
}) {
  const isOutline = button.variant === 'outline';
  const buttonClass = cn(
    'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors',
    isOutline
      ? 'border border-neutral-300 bg-white text-neutral-950 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50'
      : 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90',
    className
  );

  if (button.action === 'open_video_modal') {
    return (
      <button
        type="button"
        className={buttonClass}
        onClick={() => onVideo?.(button)}
      >
        <SmartIcon name={button.icon} className="size-4" />
        {button.title}
      </button>
    );
  }

  const href = button.url || '#';
  if (/^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target={button.target || '_blank'}
        rel="noopener noreferrer"
        className={buttonClass}
      >
        <SmartIcon name={button.icon} className="size-4" />
        {button.title}
      </a>
    );
  }

  return (
    <Link href={href} target={button.target} className={buttonClass}>
      <SmartIcon name={button.icon} className="size-4" />
      {button.title}
    </Link>
  );
}

function HeroVideoPreview({
  section,
  onVideo,
  fallbackPoster,
  compact = false,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  fallbackPoster?: string;
  compact?: boolean;
}) {
  const config = resolveDemoVideoConfig(section, undefined, fallbackPoster);
  if (!config) return null;

  const title = config.title || section.title || 'Product demo';

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[1360px]',
        compact ? 'mt-10 md:mt-12' : 'mt-12 md:mt-14'
      )}
      data-hero-video
    >
      <button
        type="button"
        onClick={() =>
          onVideo({
            title,
            video_url: config.src,
            video_embed_url: config.embedSrc,
            video_poster: config.poster,
            video_title: config.title,
            video_start: config.start,
            video_end: config.end,
          })
        }
        className="group border-border/60 bg-card/70 shadow-primary/10 hover:border-primary/40 hover:shadow-primary/20 focus-visible:ring-primary relative block aspect-video w-full overflow-hidden rounded-2xl border p-2 text-left shadow-2xl backdrop-blur-sm transition-all outline-none focus-visible:ring-2"
        aria-label={title}
      >
        <div className="bg-muted relative size-full overflow-hidden rounded-xl">
          {config.poster ? (
            <LegacyImageElement
              image={{ src: config.poster, alt: title }}
              alt={title}
              loading="eager"
              fetchPriority="low"
              sizes="(max-width: 768px) 100vw, 1360px"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="from-primary/10 to-accent/10 flex size-full items-center justify-center bg-gradient-to-br" />
          )}
          <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="bg-primary text-primary-foreground shadow-primary/40 border-primary/40 inline-flex size-16 items-center justify-center rounded-full border shadow-2xl backdrop-blur-sm transition-transform group-hover:scale-105">
              <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
            </span>
          </span>
        </div>
      </button>
    </div>
  );
}

function InlineArrowLink({ button }: { button: LegacyButton }) {
  const className =
    'text-primary hover:text-primary/80 group inline-flex items-center gap-1.5 text-base font-medium transition-colors';
  const content = (
    <>
      {button.title}
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );
  const href = button.url || '#';

  if (/^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target={button.target || '_blank'}
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} target={button.target || '_self'} className={className}>
      {content}
    </Link>
  );
}

function PageHero({
  section,
  onVideo,
  fallbackPoster,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  fallbackPoster?: string;
}) {
  const title = section.title || '';
  const highlight = section.highlight_text;
  const baseTitle =
    highlight && title.endsWith(highlight)
      ? title.slice(0, -highlight.length).trim()
      : title;

  return (
    <section
      id={section.id}
      className={cn(
        'bg-background relative flex min-h-[85vh] items-center justify-center overflow-hidden border-b py-20 md:py-32',
        section.className
      )}
    >
      <div className="from-background via-background to-accent/5 absolute inset-0 bg-gradient-to-br" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="bg-primary/5 pointer-events-none absolute top-1/4 left-1/4 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-accent/5 pointer-events-none absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full blur-3xl" />
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        {section.breadcrumbs?.length ? (
          <nav className="mb-8 overflow-x-auto whitespace-nowrap">
            <ol className="inline-flex items-center gap-1 rounded-full border bg-white/80 px-3 py-1.5 text-xs text-neutral-500 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
              {section.breadcrumbs.map((crumb, index) => {
                const isLast = index === (section.breadcrumbs?.length || 0) - 1;
                return (
                  <li
                    key={`${crumb.title || 'crumb'}-${index}`}
                    className="inline-flex items-center"
                  >
                    {index > 0 ? (
                      <ChevronRight className="mx-1 size-3.5" />
                    ) : null}
                    {crumb.url && !isLast ? (
                      <Link
                        href={crumb.url}
                        target={crumb.target}
                        className="hover:text-neutral-950 dark:hover:text-white"
                      >
                        {crumb.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-neutral-950 dark:text-white">
                        {crumb.title}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <div className="mx-auto max-w-4xl text-center">
          {section.announcement ? (
            <Link
              href={section.announcement.url || '#'}
              className="from-primary/10 to-accent/10 text-foreground ring-primary/20 hover:ring-primary/30 mb-8 inline-flex max-w-full items-center gap-3 rounded-full bg-gradient-to-r px-5 py-2 text-sm font-medium shadow-md ring-1 transition-all hover:shadow-lg"
            >
              <span
                className="bg-primary size-2 shrink-0 rounded-full"
                aria-hidden="true"
              />
              <span className="truncate">{section.announcement.title}</span>
              <ChevronRight className="size-4 shrink-0" />
            </Link>
          ) : null}
          {section.label ? (
            <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold">
              {section.label}
            </div>
          ) : null}
          <h1 className="text-foreground mb-6 text-5xl font-bold tracking-normal sm:text-6xl md:text-7xl">
            {baseTitle}
            {highlight ? (
              <>
                {' '}
                <span className="relative inline-block">
                  <span className="from-primary to-primary/70 relative z-10 bg-gradient-to-r bg-clip-text text-transparent">
                    {highlight}
                  </span>
                  <span className="from-primary/20 to-primary/10 absolute -bottom-2 left-0 h-3 w-full bg-gradient-to-r blur-sm" />
                </span>
              </>
            ) : null}
          </h1>
          <RichText className="text-muted-foreground mx-auto max-w-2xl text-lg leading-8 md:text-xl">
            {section.description}
          </RichText>
          {section.buttons?.length ? (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-3">
              {section.buttons.map((button, index) => (
                <ActionButton
                  key={`${button.title || 'button'}-${index}`}
                  button={button}
                  onVideo={onVideo}
                  className="min-w-[150px]"
                />
              ))}
            </div>
          ) : null}
        </div>

        {section.video_url || section.video_embed_url || section.video?.src ? (
          <HeroVideoPreview
            section={section}
            onVideo={onVideo}
            fallbackPoster={fallbackPoster}
          />
        ) : section.image?.src ? (
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="border-border/50 bg-card/50 relative overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-sm">
              <div className="overflow-hidden rounded-xl">
                <LegacyImageElement
                  image={section.image}
                  alt={section.image.alt || section.title || ''}
                  loading="eager"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 1152px"
                  className="w-full"
                />
              </div>
              <div className="from-primary/20 via-accent/20 to-primary/20 absolute -inset-1 -z-10 bg-gradient-to-r opacity-50 blur-2xl" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CompactPageHero({
  section,
  onVideo,
  fallbackPoster,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  fallbackPoster?: string;
}) {
  const crumbs = section.breadcrumbs || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-20 md:py-28',
        section.className
      )}
    >
      <div className="from-primary/5 via-background to-background absolute inset-0 bg-gradient-to-b" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        {crumbs.length ? (
          <nav
            aria-label="breadcrumb"
            className="mb-8 overflow-x-auto whitespace-nowrap"
          >
            <ol className="border-border/60 bg-background/60 text-muted-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                  <li
                    key={`${crumb.title || 'crumb'}-${index}`}
                    className="inline-flex items-center"
                  >
                    {index > 0 ? (
                      <ChevronRight className="mx-1 size-3.5 opacity-70" />
                    ) : null}
                    {crumb.url && !isLast ? (
                      <Link
                        href={crumb.url}
                        target={crumb.target || '_self'}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.title}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">
                        {crumb.title}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <div className="mx-auto max-w-4xl text-center">
          {section.label ? (
            <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold">
              {section.label}
            </div>
          ) : null}

          <h1 className="text-foreground mb-6 text-4xl font-bold tracking-normal sm:text-5xl md:text-6xl">
            {section.title}
          </h1>

          {section.description ? (
            <RichText className="text-muted-foreground mx-auto max-w-3xl text-lg md:text-xl">
              {section.description}
            </RichText>
          ) : null}

          {section.buttons?.length ? (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
              {section.buttons.map((button, index) => (
                <ActionButton
                  key={`${button.title || 'button'}-${index}`}
                  button={button}
                  onVideo={onVideo}
                  className={cn(
                    'rounded-xl px-6 py-3 text-sm',
                    button.variant === 'outline'
                      ? 'border-border/60 bg-background/80 hover:bg-accent/40'
                      : 'from-primary to-primary/90 shadow-primary/25 bg-gradient-to-r shadow-lg hover:shadow-xl'
                  )}
                />
              ))}
            </div>
          ) : null}

          {section.tip ? (
            <RichText className="text-muted-foreground mt-6 text-sm">
              {section.tip}
            </RichText>
          ) : null}

          {section.video_url ? (
            <HeroVideoPreview
              section={section}
              onVideo={onVideo}
              fallbackPoster={fallbackPoster}
              compact
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FeatureCards({ section }: { section: LegacySection }) {
  const items = section.items || section.features || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-24 md:py-32',
        section.className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4">
        <SectionHeading section={section} />
        <div
          data-feature-grid
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, index) => {
            const content = (
              <div className="border-border/50 bg-card/50 group-hover:shadow-primary/5 relative h-full overflow-hidden rounded-2xl border p-8 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                {item.icon ? (
                  <div
                    data-feature-icon
                    className="from-primary/20 to-primary/10 text-primary group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground mb-6 inline-flex size-14 items-center justify-center rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110"
                  >
                    <SmartIcon name={item.icon} className="size-7" />
                  </div>
                ) : null}
                {item.image?.src ? (
                  <LegacyImageElement
                    image={item.image}
                    alt={item.image.alt || item.title || ''}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="border-border/60 mb-6 aspect-[16/10] w-full rounded-xl border object-cover"
                  />
                ) : null}
                <h2 className="text-foreground mb-3 text-xl font-bold tracking-normal">
                  {item.title}
                </h2>
                <RichText className="text-muted-foreground leading-7">
                  {item.description}
                </RichText>
                {item.features?.length ? (
                  <ul className="mt-6 space-y-3">
                    {item.features.map((feature) => (
                      <li
                        key={feature}
                        className="text-muted-foreground flex gap-3 text-sm leading-6"
                      >
                        <CheckCircle2 className="text-primary mt-1 size-4 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-accent/5 pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            );
            const card = (
              <div
                key={`${item.title || 'feature'}-${index}`}
                data-feature-card
                className="group relative h-full"
              >
                {content}
              </div>
            );

            if (!item.url) return card;
            return (
              <Link
                key={`${item.title || 'feature'}-${index}`}
                href={item.url}
                target={item.target}
                className="block h-full transition-transform hover:-translate-y-0.5"
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureMatrixBlock({ section }: { section: LegacySection }) {
  const items = section.items || section.features || [];
  const columns = Number(section.columns || 0);
  const gridClassName =
    columns >= 4
      ? 'md:grid-cols-2 xl:grid-cols-4'
      : columns === 3
        ? 'md:grid-cols-3'
        : columns === 2
          ? 'md:grid-cols-2'
          : items.length >= 4
            ? 'md:grid-cols-2 xl:grid-cols-4'
            : items.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-2';

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-20 md:py-28',
        section.className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className={cn('mt-10 grid gap-4', gridClassName)}>
          {items.map((item, index) => {
            const content = (
              <>
                <div className="mb-3 flex items-center justify-between">
                  {item.icon ? (
                    <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-xl">
                      <SmartIcon name={item.icon} className="size-5" />
                    </span>
                  ) : (
                    <span />
                  )}
                  {item.badge ? (
                    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-base font-semibold text-neutral-950 dark:text-white">
                  {item.title}
                </h2>
                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {item.description}
                  </p>
                ) : null}
                {item.image?.src ? (
                  <div className="border-border/50 bg-muted/20 mt-4 flex h-[360px] items-start justify-center overflow-hidden rounded-xl border p-2 sm:h-[420px] lg:h-[520px]">
                    <LegacyImageElement
                      image={item.image}
                      alt={item.image.alt || item.title || ''}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="h-auto max-h-full w-auto max-w-full object-contain"
                    />
                  </div>
                ) : null}
              </>
            );

            const className =
              'group block rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/60';

            if (!item.url) {
              return (
                <div
                  key={`${item.title || 'matrix'}-${index}`}
                  className={className}
                >
                  {content}
                </div>
              );
            }

            if (/^https?:\/\//.test(item.url)) {
              return (
                <a
                  key={`${item.title || 'matrix'}-${index}`}
                  href={item.url}
                  target={item.target || '_blank'}
                  rel="noopener noreferrer"
                  className={cn(className, 'hover:-translate-y-0.5')}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={`${item.title || 'matrix'}-${index}`}
                href={item.url}
                target={item.target}
                className={cn(className, 'hover:-translate-y-0.5')}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesTabBlock({ section }: { section: LegacySection }) {
  const items = section.items || [];
  const [activeTab, setActiveTab] = useState(0);
  const activeItem = items[activeTab] || items[0];

  if (!items.length) return null;

  return (
    <section
      id={section.id}
      className={cn(
        'bg-background relative overflow-hidden border-b py-24 md:py-32',
        section.className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />

        <div className="mt-10 flex flex-wrap justify-center gap-1">
          {items.map((item, index) => (
            <button
              key={`${item.title || 'tab'}-${index}`}
              type="button"
              onClick={() => setActiveTab(index)}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300',
                activeTab === index
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-10 max-w-5xl overflow-hidden">
          <div className="border-border bg-card rounded-3xl border p-6 shadow-xl md:p-10">
            <div className="flex min-h-[380px] flex-col gap-6 md:flex-row md:items-center">
              <div className="flex-1 space-y-5">
                {activeItem.icon ? (
                  <div className="bg-primary/10 text-primary inline-flex size-14 items-center justify-center rounded-2xl">
                    <SmartIcon name={activeItem.icon} className="size-7" />
                  </div>
                ) : null}
                <h2 className="text-2xl font-bold text-neutral-950 md:text-3xl dark:text-white">
                  {activeItem.title}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {activeItem.description}
                </p>
              </div>

              {activeItem.image?.src ? (
                <div className="border-border/50 relative h-[220px] w-full flex-1 overflow-hidden rounded-2xl border shadow-md md:h-[340px]">
                  <LegacyImageElement
                    image={activeItem.image}
                    alt={activeItem.image.alt || activeItem.title || ''}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="size-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesScroll({ section }: { section: LegacySection }) {
  return (
    <section
      id={section.id}
      className={cn(
        'bg-secondary/30 relative overflow-hidden border-b py-24 md:py-32',
        section.className
      )}
      data-features-scroll
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className="mt-16 space-y-32">
          {section.items?.map((item, index) => (
            <div
              key={`${item.title || 'item'}-${index}`}
              data-features-scroll-item
              className={cn(
                'flex flex-col items-center gap-12 lg:gap-20',
                index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'
              )}
            >
              <div className="flex-1 space-y-6 text-center md:text-left">
                {item.icon ? (
                  <div className="border-primary/20 bg-primary/10 text-primary mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-2xl border shadow-sm md:mx-0">
                    <SmartIcon name={item.icon} className="size-8" />
                  </div>
                ) : null}
                <h2 className="text-foreground text-3xl font-bold tracking-normal">
                  {item.title}
                </h2>
                <p className="text-muted-foreground text-xl leading-relaxed">
                  {item.description}
                </p>
                {item.button ? <InlineArrowLink button={item.button} /> : null}
              </div>
              <div
                className="border-border bg-card relative w-full flex-1 overflow-hidden rounded-3xl border p-4 shadow-2xl sm:p-6"
                data-features-scroll-media
              >
                <div className="border-border bg-muted relative max-h-[500px] w-full overflow-hidden rounded-xl border shadow-inner">
                  {item.image?.src ? (
                    <LegacyImageElement
                      image={item.image}
                      alt={item.image.alt || item.title || ''}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-auto w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="bg-muted flex h-64 w-full items-center justify-center sm:h-80 md:h-[450px]">
                      <SmartIcon
                        name={item.icon || 'Image'}
                        className="text-muted-foreground/30 size-20"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function normalizeTableColumns(section: LegacySection) {
  const columns = section.columns || [];
  if (!Array.isArray(columns)) return [];

  return columns.map((column, index) => ({
    key: column.key || `col_${index}`,
    title: column.title || column.key || `Column ${index + 1}`,
    align: index === 0 ? 'left' : 'center',
  }));
}

function DataTableBlock({ section }: { section: LegacySection }) {
  const columns = normalizeTableColumns(section);
  const rows = section.rows || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-20 md:py-28',
        section.className
      )}
      data-legacy-data-table
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className="bg-card/40 border-border/60 mt-10 overflow-hidden rounded-2xl border backdrop-blur-sm">
          <div
            className="hidden overflow-x-auto md:block"
            data-desktop-data-table
          >
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-primary/5">
                <tr className="border-border/60 border-b">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'text-foreground px-5 py-4 text-sm font-semibold',
                        column.align === 'center' ? 'text-center' : 'text-left'
                      )}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-border/50 border-b last:border-b-0"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'text-muted-foreground px-5 py-4',
                          column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        )}
                      >
                        {row[column.key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-border/50 divide-y md:hidden">
            {rows.map((row, rowIndex) => (
              <article
                key={rowIndex}
                className="space-y-3 p-4"
                data-mobile-data-row
              >
                {columns.map((column) => (
                  <div
                    key={`${rowIndex}-${column.key}`}
                    className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {column.title}
                    </span>
                    <span className="text-foreground font-medium">
                      {row[column.key] || '-'}
                    </span>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </div>
        {section.tip ? (
          <RichText className="text-muted-foreground mt-4 text-center text-sm">
            {section.tip}
          </RichText>
        ) : null}
      </div>
    </section>
  );
}

function RelatedLinks({ section }: { section: LegacySection }) {
  const links = section.links || section.items || [];
  if (!links.length) return null;

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-16 md:py-20',
        section.className
      )}
      data-related-links
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-8">
          <h2 className="text-foreground text-3xl font-bold tracking-normal sm:text-4xl">
            {section.title || '相关'}
          </h2>
          {section.description ? (
            <RichText className="text-muted-foreground mt-3 max-w-2xl">
              {section.description}
            </RichText>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {links.map((item, index) => (
            <Link
              key={`${item.title || 'link'}-${index}`}
              href={item.url || '#'}
              target={item.target || '_self'}
              className="border-border/60 bg-card/40 hover:border-primary/30 hover:bg-card/60 group rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
              data-related-link-card
            >
              <div className="mb-2 flex items-center gap-2">
                {item.icon ? (
                  <span className="bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-md">
                    <SmartIcon name={item.icon} className="size-4" />
                  </span>
                ) : null}
                <h3 className="text-foreground group-hover:text-primary text-sm font-semibold transition-colors">
                  {item.title}
                </h3>
              </div>
              {item.description ? (
                <RichText className="text-muted-foreground text-sm leading-6">
                  {item.description}
                </RichText>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqBlock({ section }: { section: LegacySection }) {
  const items = section.items || section.download_faq || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-24 md:py-32',
        section.className
      )}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const question = item.question || item.title || '';
            const answer = item.answer || item.description || '';
            const panelId = `faq-panel-${section.id || 'item'}-${index}`;
            const buttonId = `faq-button-${section.id || 'item'}-${index}`;

            return (
              <article
                key={`${question || 'faq'}-${index}`}
                className={cn(
                  'border-border/50 bg-card/50 overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
                  isOpen &&
                    'border-primary/30 bg-card shadow-primary/5 shadow-lg'
                )}
              >
                <h3 className="m-0 text-base font-bold">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenIndex((current) =>
                        current === index ? null : index
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="flex items-center gap-4">
                      {item.icon ? (
                        <span
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                            isOpen
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          <SmartIcon name={item.icon} className="size-5" />
                        </span>
                      ) : null}
                      <span className="text-foreground text-base leading-snug font-bold">
                        {question}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                        isOpen
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </span>
                  </button>
                </h3>

                {isOpen ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-5"
                  >
                    <RichText
                      className={cn(
                        'border-border/30 text-muted-foreground border-t pt-4 leading-relaxed',
                        item.icon && 'sm:ml-14'
                      )}
                    >
                      {answer}
                    </RichText>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        {section.tip ? (
          <RichText className="text-muted-foreground mt-8 text-center text-sm">
            {section.tip}
          </RichText>
        ) : null}
      </div>
      <div className="bg-primary/5 pointer-events-none absolute top-1/4 left-1/4 -z-10 size-72 rounded-full blur-3xl" />
      <div className="bg-accent/5 pointer-events-none absolute right-1/4 bottom-1/4 -z-10 size-96 rounded-full blur-3xl" />
    </section>
  );
}

function TimelineBlock({ section }: { section: LegacySection }) {
  const items = section.items || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-20 md:py-28',
        section.className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className="mx-auto mt-12 max-w-5xl">
          <div
            data-timeline-rail
            className="border-border/60 relative border-l pl-6 md:pl-10"
          >
            {items.map((item, index) => {
              const actions = [
                ...(Array.isArray(item.links) ? item.links : []),
                item.button,
              ].filter((action): action is LegacyButton =>
                Boolean(action?.title && action?.url)
              );

              return (
                <article
                  key={`${item.version || item.title || 'timeline'}-${index}`}
                  data-timeline-item
                  className="relative pb-10 last:pb-0"
                >
                  <span className="border-primary/40 bg-background absolute top-1 -left-[31px] inline-flex size-4 rounded-full border md:-left-[41px]" />

                  <div className="border-border/60 bg-card/40 rounded-2xl border p-5 backdrop-blur-sm">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {item.version ? (
                        <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
                          {formatVersionLabel(item.version)}
                        </span>
                      ) : null}
                      {item.date ? (
                        <time className="text-muted-foreground text-xs font-medium">
                          {item.date}
                        </time>
                      ) : null}
                    </div>

                    <h2 className="text-foreground text-xl font-semibold tracking-normal">
                      {item.title}
                    </h2>
                    <RichText className="text-muted-foreground mt-2 text-sm leading-6">
                      {item.description}
                    </RichText>

                    {item.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="border-border/60 bg-background/70 text-muted-foreground rounded-full border px-2.5 py-1 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {item.highlights?.length ? (
                      <div className="mt-4">
                        <p className="text-foreground text-sm font-semibold">
                          主要特性
                        </p>
                        <ul className="mt-2 space-y-2">
                          {item.highlights.map((highlight, highlightIndex) => (
                            <li
                              key={`${item.title || 'highlight'}-${highlightIndex}`}
                              className="text-muted-foreground flex items-start gap-2 text-sm leading-6"
                            >
                              <span className="bg-primary/70 mt-2 size-1.5 shrink-0 rounded-full" />
                              <span
                                dangerouslySetInnerHTML={{ __html: highlight }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {item.note ? (
                      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
                        {item.note}
                      </div>
                    ) : null}

                    {item.image?.src ? (
                      <div className="border-border/60 bg-background/70 mt-4 overflow-hidden rounded-xl border">
                        <LegacyImageElement
                          image={item.image}
                          alt={item.image.alt || item.title || ''}
                          sizes="(max-width: 768px) 100vw, 768px"
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    ) : null}

                    {actions.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map((action, actionIndex) => {
                          const className =
                            'border-border/60 bg-background/80 text-foreground hover:bg-accent/40 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors';
                          const content = (
                            <>
                              {action.icon ? (
                                <SmartIcon
                                  name={action.icon}
                                  className="size-4"
                                />
                              ) : null}
                              {action.title}
                            </>
                          );

                          if (/^https?:\/\//.test(action.url || '')) {
                            return (
                              <a
                                key={`${action.title}-${actionIndex}`}
                                href={action.url}
                                target={action.target || '_blank'}
                                rel="noopener noreferrer"
                                className={className}
                              >
                                {content}
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={`${action.title}-${actionIndex}`}
                              href={action.url || '#'}
                              target={action.target}
                              className={className}
                            >
                              {content}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DownloadBlock({ section }: { section: LegacySection }) {
  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b bg-white py-24 dark:bg-neutral-950',
        section.className
      )}
      data-download-section
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:56px_56px]"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div
          className="mx-auto mb-16 max-w-4xl text-center"
          data-download-heading
        >
          {section.title ? (
            <h2 className="text-foreground mb-4 text-4xl font-bold tracking-normal sm:text-5xl">
              {section.title}
            </h2>
          ) : null}
          {section.description ? (
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-8">
              {section.description}
            </p>
          ) : null}
        </div>
        <DownloadOnboardingGuide section={section} />
      </div>
    </section>
  );
}

function DownloadOnboardingGuide({ section }: { section: LegacySection }) {
  const copy = getOnboardingCopy(section);
  const buyLabel = /[一-龥]/.test(copy.badge)
    ? '购买激活码'
    : 'Buy activation code';

  return (
    <div className="mx-auto max-w-6xl" data-download-onboarding-guide>
      <div className="mb-7 flex flex-col gap-3 text-center lg:text-left">
        <div className="flex justify-center lg:justify-start">
          <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
            <Route className="size-4" />
            {copy.badge}
          </span>
        </div>
        <p className="mx-auto max-w-3xl text-sm leading-relaxed text-neutral-600 lg:mx-0 dark:text-neutral-300">
          {copy.flowHint}
        </p>
      </div>

      <div
        className="border-border/60 bg-background/90 sticky top-16 z-20 -mx-4 mb-6 border-y px-4 py-3 backdrop-blur lg:hidden"
        data-download-mobile-step-nav
      >
        <div className="grid grid-cols-3 gap-2">
          {copy.steps.map((step, index) => (
            <a
              key={step.id}
              href={`#download-step-${step.id}`}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold',
                index === 0
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-border/60 bg-card/60 text-muted-foreground'
              )}
            >
              <span>{index + 1}</span>
              <span className="truncate">{step.title}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav
            className="border-border/60 bg-card/45 sticky top-28 rounded-xl border p-4 backdrop-blur-sm"
            data-download-step-nav
          >
            <p className="text-foreground mb-4 text-sm font-semibold">
              {copy.flowTitle}
            </p>
            <ol className="relative space-y-4">
              <span className="bg-border/70 absolute top-5 bottom-5 left-[1.0625rem] w-px" />
              {copy.steps.map((step, index) => (
                <li key={step.id} className="relative flex gap-3">
                  <span
                    className={cn(
                      'z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                      index === 0
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <a
                    href={`#download-step-${step.id}`}
                    className="min-w-0 pt-0.5"
                  >
                    <span className="text-foreground block text-sm font-semibold">
                      {step.title}
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                      {index === 0 ? copy.currentBadge : copy.nextBadge}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="space-y-5">
          {copy.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id}>
                <section
                  id={`download-step-${step.id}`}
                  className="border-border/60 bg-card/45 scroll-mt-28 rounded-xl border p-5 backdrop-blur-sm sm:p-7"
                  data-download-step-card
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="bg-primary/10 text-primary ring-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-primary text-sm font-bold">
                            {step.number}
                          </span>
                          {index === 0 ? (
                            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
                              {copy.currentBadge}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {step.href ? (
                      <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-[23rem]">
                        {step.id === 'activate' ? (
                          <>
                            <Link
                              href={step.href}
                              className={buttonVariants({
                                className: 'w-full',
                              })}
                            >
                              {step.action}
                            </Link>
                            <Link
                              href="/pricing?source=onboarding&entry=download"
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-amber-300/80 bg-amber-300 px-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-200"
                            >
                              {buyLabel}
                            </Link>
                          </>
                        ) : step.external ? (
                          <a
                            href={step.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              className:
                                'w-full border-cyan-300/80 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-200 md:w-44',
                            })}
                          >
                            {step.action}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  {step.id === 'install' ? (
                    <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-800">
                      <DownloadInstallOptions section={section} />
                    </div>
                  ) : null}
                </section>
                {index < copy.steps.length - 1 ? (
                  <div
                    className="flex justify-center py-5"
                    aria-hidden="true"
                    data-download-step-connector
                  >
                    <div className="border-border/60 bg-card/70 text-primary flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm">
                      <ArrowRight className="size-4 rotate-90" />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DownloadInstallOptions({ section }: { section: LegacySection }) {
  return (
    <Tabs
      id="download-install-options"
      defaultValue="market"
      data-download-install-tabs
    >
      <TabsList className="bg-muted/50 mb-8 grid h-auto min-h-14 w-full grid-cols-2 rounded-xl p-1 backdrop-blur-sm">
        <TabsTrigger
          value="market"
          className="data-active:bg-background gap-2 rounded-lg py-3 text-base data-active:shadow-lg"
          data-download-market-tab
        >
          <Globe className="size-4" />
          <span className="truncate">
            {section.market_tab_title || '商店安装'}
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="package"
          className="data-active:bg-background gap-2 rounded-lg py-3 text-base data-active:shadow-lg"
          data-download-package-tab
        >
          <Download className="size-4" />
          <span className="truncate">
            {section.package_tab_title || '离线安装'}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="market" className="mt-0">
        <div className="grid gap-5 md:grid-cols-2" data-download-market-grid>
          {section.market_items?.map((item, index) => (
            <DownloadCard
              key={`${item.title}-${index}`}
              item={item}
              kind="market"
            />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="package" className="mt-0 focus-visible:outline-none">
        <div className="space-y-6" data-download-package-panel>
          <div
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-5"
            data-download-package-grid
          >
            <div
              className={cn(
                'grid h-full gap-5',
                section.package_items?.length === 1
                  ? 'lg:col-span-3'
                  : 'sm:grid-cols-2 lg:col-span-5'
              )}
            >
              {section.package_items?.map((item, index) => (
                <DownloadCard
                  key={`${item.title}-${index}`}
                  item={item}
                  kind="package"
                />
              ))}
            </div>

            {section.package_items?.length === 1 ? (
              <Card
                className="border-primary/20 bg-primary/5 flex flex-col justify-center backdrop-blur-sm lg:col-span-2"
                data-download-security-card
              >
                <CardContent className="p-6 text-center">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                      <ShieldCheck className="size-9" />
                    </div>
                    <h3 className="mb-3 text-lg font-bold">
                      {section.security_title || '安全承诺'}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {section.security_description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {section.steps?.length ? (
            <div
              className="border-border/50 bg-muted/30 rounded-xl border p-6 shadow-sm"
              data-download-manual-steps
            >
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <BookOpen className="text-primary size-5" />
                {section.steps_title}
              </h3>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {section.steps.map((step, index) => (
                  <div
                    key={`${step.title}-${index}`}
                    className="flex gap-4"
                    data-download-manual-step
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{step.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        <StrongTextParts>{step.description}</StrongTextParts>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {Boolean(section.download_faq?.length || section.video_button) ? (
            <div
              className="border-border/50 bg-card/30 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm"
              data-download-faq-panel
            >
              <h3 className="mb-6 flex items-center gap-3 text-xl font-bold">
                <SmartIcon name="HelpCircle" className="text-primary size-5" />
                {section.faq_title || '安装常见问题'}
              </h3>

              {section.download_faq?.length ? (
                <div
                  className="grid gap-4 md:grid-cols-3"
                  data-download-faq-grid
                >
                  {section.download_faq.map((faq, index) => (
                    <div
                      key={`${faq.question}-${index}`}
                      className="border-border/50 bg-muted/20 rounded-xl border p-4"
                    >
                      <p className="text-foreground flex items-start gap-2 text-sm font-bold">
                        <span className="text-primary mt-0.5">Q:</span>
                        {faq.question}
                      </p>
                      <p className="text-muted-foreground mt-2 pl-6 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {section.video_button ? (
                <div className="border-border/50 mt-6 flex justify-center border-t pt-6">
                  <a
                    href={section.video_button.url || '#'}
                    target={section.video_button.target || '_blank'}
                    rel="noopener noreferrer"
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all"
                    data-download-video-link
                  >
                    <Play className="size-5" />
                    {section.video_button.title}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function StrongTextParts({ children }: { children?: string }) {
  if (!children) return null;

  return children.split(/(\*\*.*?\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index} className="text-primary font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function DownloadCard({
  item,
  kind = 'market',
}: {
  item: LegacyDownloadItem;
  kind?: 'market' | 'package';
}) {
  return <DownloadCardContent item={item} kind={kind} />;
}

function DownloadCardContent({
  item,
  kind,
}: {
  item: LegacyDownloadItem;
  kind: 'market' | 'package';
}) {
  const isPackage = kind === 'package';

  return (
    <Card
      className={cn(
        'group border-border/50 bg-card/50 h-full overflow-hidden backdrop-blur-sm transition-all duration-300',
        isPackage
          ? 'hover:border-primary/50 shadow-sm hover:shadow-lg'
          : 'hover:border-primary/50 hover:shadow-primary/5 hover:-translate-y-1 hover:shadow-2xl'
      )}
      data-download-store-card={!isPackage ? '' : undefined}
      data-download-package-card={isPackage ? '' : undefined}
    >
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-5 flex items-start gap-4">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-xl transition-colors',
              isPackage
                ? 'bg-accent/10 text-accent group-hover:bg-accent/20 size-12'
                : 'bg-primary/10 text-primary ring-primary/20 size-12 ring-1'
            )}
          >
            <SmartIcon
              name={item.icon || (isPackage ? 'FileArchive' : 'Chrome')}
              className={cn(isPackage ? 'size-7' : 'size-6')}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {item.description}
            </p>
          </div>
        </div>
        {item.features?.length ? (
          <ul className="mb-6 space-y-3">
            {item.features.map((feature) => (
              <li
                key={feature}
                className="text-muted-foreground flex items-start gap-3 text-sm"
              >
                <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        ) : null}
        {item.button_url ? (
          <a
            href={item.button_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/35 mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95"
            data-download-card-button
          >
            {isPackage ? (
              <Download className="size-5" />
            ) : (
              <ExternalLink className="size-5" />
            )}
            {item.button_text}
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

function isCreditPackItem(item: LegacyItem | null) {
  if (!item) return false;
  return item.group === 'credits' || item.product_id?.startsWith('credits-');
}

function isPaidPricingItem(item: LegacyItem) {
  return Boolean(item.product_id && Number(item.amount || 0) > 0);
}

function credentialOptionLabel(credential: UserCredentialSummary) {
  const code = credential.code || '';
  const plan = credential.planCode || 'formal';
  const expiresAt =
    credential.expiresAt instanceof Date
      ? credential.expiresAt.toISOString().slice(0, 10)
      : credential.expiresAt
        ? String(credential.expiresAt).slice(0, 10)
        : '长期';
  return `${code} · ${plan} · ${expiresAt}`;
}

function PricingBlock({ section }: { section: LegacySection }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const groups = section.groups || [];
  const defaultGroup = groups[0]?.name || 'month';
  const [group, setGroup] = useState(defaultGroup);
  const [checkoutItem, setCheckoutItem] = useState<LegacyItem | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>('issue');
  const [credentials, setCredentials] = useState<UserCredentialSummary[]>([]);
  const [selectedCredentialCode, setSelectedCredentialCode] = useState('');
  const [customCredentialCode, setCustomCredentialCode] = useState('');
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const items = useMemo(
    () => (section.items || []).filter((item) => item.group === group),
    [group, section.items]
  );
  const selectedCredentials = useMemo(() => {
    const active = credentials.filter(
      (credential) => credential.status === 'active' && credential.code
    );
    if (!isCreditPackItem(checkoutItem)) return active;
    return active.filter(
      (credential) =>
        String(credential.planCode || '')
          .trim()
          .toLowerCase() !== 'trial'
    );
  }, [checkoutItem, credentials]);
  const checkoutNeedsCredential =
    Boolean(checkoutItem) &&
    (isCreditPackItem(checkoutItem) || checkoutMode === 'recharge');

  async function loadCredentials(item: LegacyItem, mode: CheckoutMode) {
    if (!session?.user) return;
    if (!isCreditPackItem(item) && mode !== 'recharge') return;

    setCredentialsLoading(true);
    try {
      const result = await apiGet<PageResult<UserCredentialSummary>>(
        '/api/user/get-credentials?page=1&pageSize=100&status=active'
      );
      const rows = result?.items || [];
      const usableRows = isCreditPackItem(item)
        ? rows.filter(
            (credential) =>
              String(credential.planCode || '')
                .trim()
                .toLowerCase() !== 'trial'
          )
        : rows;
      setCredentials(rows);
      setSelectedCredentialCode(usableRows[0]?.code || '');
    } catch (error: any) {
      toast.error(error?.message || '激活码列表加载失败');
    } finally {
      setCredentialsLoading(false);
    }
  }

  async function openCheckout(item: LegacyItem) {
    if (!isPaidPricingItem(item)) return;
    if (sessionPending) return;
    if (!session?.user) {
      const redirect = encodeURIComponent(
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/pricing'
      );
      router.push(`/sign-in?redirect=${redirect}`);
      return;
    }

    const mode = isCreditPackItem(item) ? 'recharge' : 'issue';
    setCheckoutItem(item);
    setCheckoutMode(mode);
    setCustomCredentialCode('');
    setSelectedCredentialCode('');
    await loadCredentials(item, mode);
  }

  async function switchCheckoutMode(mode: CheckoutMode) {
    if (!checkoutItem) return;
    setCheckoutMode(mode);
    setCustomCredentialCode('');
    setSelectedCredentialCode('');
    await loadCredentials(checkoutItem, mode);
  }

  async function confirmCheckout() {
    if (!checkoutItem?.product_id) return;
    const credentialCode = (
      customCredentialCode.trim() || selectedCredentialCode.trim()
    ).toUpperCase();

    if (checkoutNeedsCredential && !credentialCode) {
      toast.error('请选择或输入激活码');
      return;
    }

    setCheckoutLoading(true);
    try {
      const result = await apiPost<{
        checkoutUrl?: string;
        checkout_url?: string;
      }>('/api/payment/checkout', {
        product_id: checkoutItem.product_id,
        payment_provider: checkoutItem.payment_providers?.[0],
        credential_code: checkoutNeedsCredential ? credentialCode : undefined,
        redirect: '/settings/payments',
      });
      const checkoutUrl = result?.checkoutUrl || result?.checkout_url;
      if (!checkoutUrl) throw new Error('Checkout failed');
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.message || 'Checkout failed');
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <section
        id={section.id}
        className={cn(
          'relative overflow-hidden py-24 md:py-32',
          section.className
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-4">
          <SectionHeading section={section} />
          {groups.length ? (
            <div className="mt-10 mb-12 flex justify-center">
              <div
                data-pricing-group-tabs
                className="border-border/50 bg-card/50 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border p-1 backdrop-blur-sm"
              >
                {groups.map((item) => {
                  const isActive = group === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      data-pricing-group-button={item.name}
                      aria-pressed={isActive}
                      className={cn(
                        'relative flex shrink-0 items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => setGroup(item.name)}
                    >
                      {item.title}
                      {item.label ? (
                        <span
                          className={cn(
                            'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                            isActive
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-primary/10 text-primary'
                          )}
                        >
                          {item.label}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div
            data-pricing-grid
            className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3"
          >
            {items.map((item, index) => {
              const isFeatured = Boolean(item.is_popular || item.is_featured);
              return (
                <article
                  key={`${item.title}-${index}`}
                  data-pricing-card
                  data-pricing-popular={isFeatured ? 'true' : undefined}
                  className={cn(
                    'relative flex h-full flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300',
                    isFeatured
                      ? 'border-primary/50 from-primary/5 shadow-primary/10 bg-gradient-to-b to-transparent shadow-2xl lg:-mt-4 lg:scale-105'
                      : 'border-border/50 bg-card/50 hover:shadow-primary/5 hover:shadow-xl'
                  )}
                >
                  {isFeatured && (
                    <div className="absolute top-6 right-6">
                      <div className="from-primary to-primary/80 text-primary-foreground rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold shadow-lg">
                        {item.label || '最受欢迎'}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-8">
                    <h3 className="text-foreground mb-2 text-2xl font-bold">
                      {item.title}
                    </h3>
                    <RichText className="text-muted-foreground mb-6 text-sm leading-6">
                      {item.description}
                    </RichText>

                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-foreground text-5xl font-bold tracking-normal">
                          {item.price}
                        </span>
                        {item.unit ? (
                          <span className="text-muted-foreground">
                            {item.unit}
                          </span>
                        ) : null}
                      </div>
                      {item.original_price ? (
                        <p className="text-muted-foreground mt-1 text-sm line-through">
                          原价 {item.original_price}
                          {item.unit ? ` ${item.unit}` : ''}
                        </p>
                      ) : null}
                      {item.tip ? (
                        <p className="text-primary mt-2 text-sm font-medium">
                          {item.tip}
                        </p>
                      ) : null}
                    </div>

                    {isPaidPricingItem(item) ? (
                      <button
                        type="button"
                        data-pricing-cta
                        className={cn(
                          'mb-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition-all disabled:opacity-60',
                          isFeatured
                            ? 'from-primary to-primary/90 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 bg-gradient-to-r shadow-lg hover:shadow-xl'
                            : 'border-primary/20 bg-background text-foreground hover:bg-primary/5 border-2'
                        )}
                        disabled={sessionPending}
                        onClick={() => openCheckout(item)}
                      >
                        <SmartIcon
                          name={item.button?.icon}
                          className="size-5"
                        />
                        <span>{item.button?.title || '选择购买'}</span>
                      </button>
                    ) : (
                      <ActionButton
                        button={
                          item.button || { title: '选择', url: '/pricing' }
                        }
                        className="border-primary/20 bg-background text-foreground hover:bg-primary/5 mb-8 w-full rounded-xl px-6 py-4 text-base shadow-none"
                      />
                    )}

                    {item.features?.length ? (
                      <div>
                        {item.features_title ? (
                          <p className="text-foreground mb-3 text-sm font-semibold">
                            {item.features_title}
                          </p>
                        ) : null}
                        <ul className="space-y-3">
                          {item.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3"
                            >
                              <span className="bg-primary/10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                                <CheckCircle2 className="text-primary size-3" />
                              </span>
                              <span className="text-foreground text-sm leading-6">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  {isFeatured && (
                    <div className="from-primary/20 to-accent/20 pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br via-transparent opacity-50" />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(checkoutItem)}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutItem(null);
            setCheckoutLoading(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {checkoutItem?.product_name || checkoutItem?.title}
            </DialogTitle>
            <DialogDescription>
              {checkoutItem?.price}
              {checkoutItem?.unit ? ` ${checkoutItem.unit}` : ''}
              {checkoutItem?.credits ? ` · ${checkoutItem.credits} 积分` : ''}
            </DialogDescription>
          </DialogHeader>

          {checkoutItem && !isCreditPackItem(checkoutItem) ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={checkoutMode === 'issue' ? 'default' : 'outline'}
                onClick={() => switchCheckoutMode('issue')}
              >
                新购激活码
              </Button>
              <Button
                type="button"
                variant={checkoutMode === 'recharge' ? 'default' : 'outline'}
                onClick={() => switchCheckoutMode('recharge')}
              >
                续费已有码
              </Button>
            </div>
          ) : null}

          {checkoutNeedsCredential ? (
            <div className="space-y-4 rounded-lg border bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="space-y-2">
                <Label htmlFor="credential-select">选择已有激活码</Label>
                <select
                  id="credential-select"
                  className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                  value={selectedCredentialCode}
                  disabled={credentialsLoading || !selectedCredentials.length}
                  onChange={(event) =>
                    setSelectedCredentialCode(event.target.value)
                  }
                >
                  {selectedCredentials.length ? (
                    selectedCredentials.map((credential) => (
                      <option key={credential.code} value={credential.code}>
                        {credentialOptionLabel(credential)}
                      </option>
                    ))
                  ) : (
                    <option value="">
                      {credentialsLoading ? '正在加载...' : '暂无可用激活码'}
                    </option>
                  )}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential-code">手动输入激活码</Label>
                <Input
                  id="credential-code"
                  value={customCredentialCode}
                  placeholder="MC-XXXX-XXXX-XXXX"
                  onChange={(event) =>
                    setCustomCredentialCode(event.target.value)
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={checkoutLoading}
              onClick={() => setCheckoutItem(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={checkoutLoading || credentialsLoading}
              onClick={confirmCheckout}
            >
              {checkoutLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              去支付
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TestimonialsBlock({ section }: { section: LegacySection }) {
  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-24', section.className)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center text-balance">
          {section.title ? (
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-normal md:text-4xl">
              {section.title}
            </h2>
          ) : null}
          {section.description ? (
            <RichText className="text-muted-foreground mb-6 md:mb-12 lg:mb-16">
              {section.description}
            </RichText>
          ) : null}
        </div>
        <div
          data-testimonial-grid
          className="border-border/50 relative rounded-[var(--radius)]"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-px">
            {section.items?.map((item, index) => (
              <article
                key={`${item.name || item.title || 'testimonial'}-${index}`}
                data-testimonial-card
                className="bg-card/25 ring-foreground/[0.07] flex h-full flex-col justify-end gap-6 rounded-[var(--radius)] border border-transparent p-8 ring-1"
              >
                <p className='text-foreground w-full text-left text-balance before:mr-1 before:content-["\201C"] after:ml-1 after:content-["\201D"]'>
                  {item.quote || item.description}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="ring-foreground/10 aspect-square size-9 overflow-hidden rounded-lg border border-transparent shadow-md ring-1 shadow-black/15">
                    <LegacyImageElement
                      image={
                        item.image ||
                        (item as { avatar?: LegacyImage }).avatar || {
                          src: '/logo.png',
                        }
                      }
                      alt={item.image?.alt || item.name || ''}
                      sizes="36px"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="sr-only">
                    {item.name}, {item.role || item.title}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.role ? (
                      <p className="text-muted-foreground text-xs">
                        {item.role}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcasesBlock({ section }: { section: LegacySection }) {
  const groups = section.groups || [];
  const [group, setGroup] = useState(groups[0]?.name || 'all');
  const items = useMemo(() => {
    if (group === 'all') return section.items || [];
    return (section.items || []).filter((item) => item.group === group);
  }, [group, section.items]);

  return (
    <section
      id={section.id}
      className={cn('py-24 md:py-36', section.className)}
    >
      <div className="mx-auto mb-12 w-full max-w-6xl px-6 text-center">
        {section.title ? (
          <h2 className="mx-auto mb-6 max-w-full text-3xl font-bold text-pretty md:max-w-5xl lg:text-4xl">
            {section.title}
          </h2>
        ) : null}
        {section.description ? (
          <RichText className="text-muted-foreground mx-auto mb-4 max-w-full text-base md:max-w-5xl">
            {section.description}
          </RichText>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-6xl px-6">
        {groups.length ? (
          <div
            data-showcase-groups
            className="mb-12 flex flex-wrap justify-center gap-4"
          >
            {groups.map((item) => (
              <button
                key={item.name}
                type="button"
                data-showcase-group-button={item.name}
                aria-pressed={group === item.name}
                className={cn(
                  'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 active:scale-95',
                  group === item.name
                    ? 'text-primary ring-primary/30 bg-background ring-2 ring-inset'
                    : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground border'
                )}
                onClick={() => setGroup(item.name)}
              >
                {item.title}
              </button>
            ))}
          </div>
        ) : null}
        <div
          data-showcase-grid
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, index) => {
            const hasButton = Boolean(item.button);
            const content = (
              <article
                data-showcase-card
                className="bg-card text-card-foreground dark:hover:shadow-primary/10 h-full overflow-hidden rounded-lg border p-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                {item.image?.src ? (
                  <div
                    data-showcase-image
                    className="relative aspect-[16/10] w-full overflow-hidden"
                  >
                    <LegacyImageElement
                      image={item.image}
                      alt={item.image.alt || item.title || ''}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  <h3 className="mb-2 line-clamp-1 text-xl font-semibold text-balance">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
                    {item.description}
                  </p>
                  {hasButton ? (
                    <div className="mt-4">
                      <ActionButton
                        button={item.button || { title: '', url: '#' }}
                        className="bg-primary hover:bg-primary/90 h-8 w-full border-0 px-3 py-1.5 text-sm font-medium text-white"
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            );

            if (hasButton || !item.url) {
              return (
                <div key={`${item.title || 'showcase'}-${index}`}>
                  {content}
                </div>
              );
            }
            return /^https?:\/\//.test(item.url) ? (
              <a
                key={`${item.title || 'showcase'}-${index}`}
                href={item.url}
                target={item.target || '_blank'}
                rel="noopener noreferrer"
                className="block h-full"
              >
                {content}
              </a>
            ) : (
              <Link
                key={`${item.title || 'showcase'}-${index}`}
                href={item.url}
                target={item.target}
                className="block h-full"
              >
                {content}
              </Link>
            );
          })}
          {!items.length ? (
            <div className="text-muted-foreground col-span-full text-center">
              No items found in this category.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({
  section,
  onVideo,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
}) {
  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden border-b py-24 md:py-32',
        section.className
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="border-border/50 from-primary/10 via-accent/5 to-primary/5 relative overflow-hidden rounded-3xl border bg-gradient-to-br p-10 text-center shadow-2xl backdrop-blur-sm sm:p-12 md:p-16 lg:p-20">
          <div className="from-primary/15 to-primary/5 pointer-events-none absolute -top-24 right-12 size-64 rounded-full bg-gradient-to-br blur-3xl" />
          <div className="from-accent/10 to-primary/10 pointer-events-none absolute bottom-0 left-0 size-56 rounded-full bg-gradient-to-tr blur-3xl" />
          <div className="relative z-10 mx-auto max-w-4xl">
            {section.subtitle || section.label ? (
              <p className="bg-primary/20 text-primary mb-4 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold">
                {section.subtitle || section.label}
              </p>
            ) : null}
            <h2 className="text-foreground text-4xl font-bold tracking-normal sm:text-5xl md:text-6xl">
              {section.title}
            </h2>
            {section.description ? (
              <RichText className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-8">
                {section.description}
              </RichText>
            ) : null}
            {section.buttons?.length ? (
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
                {section.buttons.map((button, index) => (
                  <ActionButton
                    key={`${button.title}-${index}`}
                    button={button}
                    onVideo={onVideo}
                    className={cn(
                      'rounded-xl px-8 py-4 text-base shadow-xl transition-all hover:-translate-y-0.5',
                      button.variant === 'outline'
                        ? 'border-primary/30 bg-background text-foreground hover:border-primary/50 hover:bg-accent/10'
                        : 'from-primary to-primary/90 text-primary-foreground shadow-primary/30 hover:shadow-primary/40 bg-gradient-to-r hover:shadow-2xl'
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ section }: { section: LegacySection }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {section.subtitle || section.label ? (
        <p className="bg-primary/10 text-primary mb-3 inline-flex rounded-full px-4 py-1.5 text-sm font-semibold">
          {section.subtitle || section.label}
        </p>
      ) : null}
      {section.title ? (
        <h2 className="text-foreground mb-4 text-3xl font-bold tracking-normal sm:text-4xl md:text-5xl">
          {section.title}
        </h2>
      ) : null}
      {section.description ? (
        <p className="text-muted-foreground text-lg leading-8">
          {section.description}
        </p>
      ) : null}
    </div>
  );
}

function GenericSection({ section }: { section: LegacySection }) {
  return (
    <section
      id={section.id}
      className="border-b bg-white py-18 dark:bg-neutral-950"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        {section.items?.length ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {section.items.map((item, index) => (
              <Card key={`${item.title || item.name || 'item'}-${index}`}>
                <CardContent className="p-5">
                  {item.image?.src ? (
                    <LegacyImageElement
                      image={item.image}
                      alt={item.image.alt || item.title || ''}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="mb-4 aspect-video w-full rounded-md object-cover"
                    />
                  ) : null}
                  <h2 className="font-semibold">{item.title || item.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PartnerPromoCard({
  promo,
}: {
  promo?: LegacyPageData['partner_promo'];
}) {
  if (!promo?.title && !promo?.banner_title) return null;

  return (
    <section className="border-b bg-white py-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="border-primary/25 from-primary/10 to-primary/5 grid gap-5 rounded-lg border bg-gradient-to-r p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex min-w-0 gap-4">
            <div className="bg-primary/15 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
              <PiggyBank className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {promo.eyebrow ? (
                <p className="text-primary text-sm font-bold">
                  {promo.eyebrow}
                </p>
              ) : null}
              <h2 className="mt-1 text-2xl font-bold tracking-normal">
                {promo.title || promo.banner_title}
              </h2>
              <ul className="text-muted-foreground mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2">
                {promo.you ? <li>{promo.you}</li> : null}
                {promo.friend ? <li>{promo.friend}</li> : null}
              </ul>
            </div>
          </div>
          <Link
            href="/referral"
            className={cn(buttonVariants(), 'w-full md:w-auto')}
          >
            {promo.action || promo.banner_action}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PartnerPromoBanner({
  promo,
}: {
  promo?: LegacyPageData['partner_promo'];
}) {
  if (!promo?.banner_title && !promo?.title) return null;

  return (
    <Link
      href="/referral"
      className="border-primary/25 from-primary/10 to-primary/5 mx-auto mt-8 flex max-w-6xl items-center gap-3 rounded-lg border bg-gradient-to-r p-4"
    >
      <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
        <Share className="size-5" aria-hidden="true" />
      </div>
      <span className="text-foreground min-w-0 flex-1 text-sm font-semibold sm:text-base">
        {promo.banner_title || promo.title}
      </span>
      <span className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-bold">
        {promo.banner_action || promo.action}
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function BusinessDictionaryPage({ data }: { data: LegacyPageData }) {
  const survey = data.channel_survey;
  const feedback = data.experience_feedback;
  return (
    <>
      <section className="relative overflow-hidden border-b bg-white py-20 md:py-28 dark:bg-neutral-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {data.hero?.eyebrow ? (
            <p className="text-sm font-semibold text-pink-600">
              {data.hero.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-6xl">
            {data.hero?.title || data.metadata?.title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
            {data.hero?.description || data.metadata?.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-md bg-neutral-950 px-5 py-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950"
            >
              {data.hero?.sign_in_action || data.hero?.primary_action}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/settings/credentials"
              className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm font-semibold"
            >
              {data.hero?.secondary_action || '查看激活码'}
            </Link>
          </div>
        </div>
      </section>

      <PartnerPromoCard promo={data.partner_promo} />

      {data.reward_flow?.items?.length ? (
        <section className="border-b bg-neutral-50 py-18 dark:bg-neutral-950">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              section={{
                title: data.reward_flow.title,
                description: data.reward_flow.guide?.title,
              }}
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {data.reward_flow.items.map((item, index) => (
                <Card key={`${item.title}-${index}`}>
                  <CardContent className="p-6">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-200">
                      <SmartIcon name={item.icon} className="size-5" />
                    </div>
                    <h2 className="text-xl font-semibold">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <PartnerPromoBanner promo={data.partner_promo} />
          </div>
        </section>
      ) : null}

      {survey ? (
        <section className="border-b bg-white py-18 dark:bg-neutral-950">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              section={{ title: survey.title, description: survey.description }}
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <OptionGroup title="了解来源" items={survey.source_options} />
              <OptionGroup title="用户身份" items={survey.role_options} />
              <OptionGroup
                title="核心运营平台"
                items={survey.platform_options}
              />
              <OptionGroup
                title="使用目的"
                items={survey.use_case_options?.map((item) => ({
                  label: item.label,
                  value: item.capabilities?.join(' / ') || item.value,
                }))}
              />
            </div>
          </div>
        </section>
      ) : null}

      {feedback ? (
        <section className="border-b bg-neutral-50 py-18 dark:bg-neutral-950">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading
              section={{
                title: feedback.title,
                description: feedback.description,
              }}
            />
            <div className="mt-10 rounded-lg border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-500">
                    {feedback.reward_label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {feedback.reward_value}
                  </p>
                </div>
                <Link href="/download" className={buttonVariants()}>
                  下载插件
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function OptionGroup({
  title,
  items,
}: {
  title: string;
  items?: Array<{ label: string; value: string }>;
}) {
  if (!items?.length) return null;
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold">{title}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${item.label}-${item.value}`}
              className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {item.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function renderSection(
  section: LegacySection,
  onVideo: (button: LegacyButton) => void,
  fallbackPoster?: string
) {
  const block = section.block || section.id;

  switch (block) {
    case 'page-hero':
      return (
        <CompactPageHero
          section={section}
          onVideo={onVideo}
          fallbackPoster={fallbackPoster}
        />
      );
    case 'hero':
      return (
        <PageHero
          section={section}
          onVideo={onVideo}
          fallbackPoster={fallbackPoster}
        />
      );
    case 'features':
    case 'workflow-steps':
      return <FeatureCards section={section} />;
    case 'feature-matrix':
      return <FeatureMatrixBlock section={section} />;
    case 'features-tab':
      return <FeaturesTabBlock section={section} />;
    case 'features-bento':
      return <FeatureCards section={section} />;
    case 'features-scroll':
      return <FeaturesScroll section={section} />;
    case 'data-table':
      return <DataTableBlock section={section} />;
    case 'related-links':
    case 'related-links-cta':
      return <RelatedLinks section={section} />;
    case 'faq':
      return <FaqBlock section={section} />;
    case 'timeline':
    case 'updates':
      return <TimelineBlock section={section} />;
    case 'download':
      return <DownloadBlock section={section} />;
    case 'pricing':
    case 'pricing-full':
      return <PricingBlock section={section} />;
    case 'testimonials':
      return <TestimonialsBlock section={section} />;
    case 'showcases':
      return <ShowcasesBlock section={section} />;
    case 'cta':
      return <CtaBlock section={section} onVideo={onVideo} />;
    default:
      return <GenericSection section={section} />;
  }
}

export function LegacyDynamicPage({ data }: { data: LegacyPageData }) {
  const [videoConfig, setVideoConfig] = useState<DemoVideoConfig | null>(null);
  const sections = data.page?.sections;
  const sectionKeys = data.page?.show_sections || Object.keys(sections || {});
  const fallbackPoster = resolvePageVideoFallbackPoster(data);

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white">
      <Header />
      <main className="flex-1">
        {sections ? (
          <>
            {data.page?.title && !sections.hero ? (
              <h1 className="sr-only">{data.page.title}</h1>
            ) : null}
            {sectionKeys.map((key) => {
              const section = sections[key];
              if (!section) return null;
              return (
                <div key={key}>
                  {renderSection(
                    section,
                    (button) =>
                      setVideoConfig(
                        resolveDemoVideoConfig(section, button, fallbackPoster)
                      ),
                    fallbackPoster
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <BusinessDictionaryPage data={data} />
        )}
      </main>
      <Footer />

      <Dialog
        open={Boolean(videoConfig)}
        onOpenChange={(open) => {
          if (!open) setVideoConfig(null);
        }}
      >
        <DialogContent className="border-border/60 bg-card/95 w-[min(96vw,1440px)] max-w-[min(96vw,1440px)] p-2 sm:max-w-[min(96vw,1440px)] sm:p-3">
          <DialogTitle className="sr-only">
            {videoConfig?.title || '产品演示视频'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Product demo playback.
          </DialogDescription>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {videoConfig?.embedSrc ? (
              <iframe
                src={videoConfig.embedSrc}
                title={videoConfig.title || 'Product demo video'}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : videoConfig?.src ? (
              <SegmentedVideo config={videoConfig} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
