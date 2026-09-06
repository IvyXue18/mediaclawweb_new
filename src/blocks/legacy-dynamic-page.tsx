import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react';
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
  Copy,
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
  Gift,
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
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link, useRouter } from '@/core/i18n/navigation';
import {
  getCredentialPlanTier,
  getPricingProduct,
  type CredentialPlanTier,
} from '@/config/pricing';
import { apiGet, apiPost, type PageResult } from '@/lib/api-client';
import { getBrowserInstallId } from '@/lib/browser-install-id';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { credentialPlanLabel } from '@/lib/credential-plan-display';
import { cn } from '@/lib/utils';
import {
  parseVideoMediaFragment,
  resolveStaticVideoPoster,
  stripVideoMediaFragment,
  videoPosterSizes,
} from '@/lib/video-posters';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import { TestimonialWallSection } from '@/blocks/testimonial-wall';
import { ActivationCodeGuideDialog } from '@/components/activation-code-guide-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
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
  messages?: Record<string, string>;
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
    step?: string;
    signed_in?: string;
    credentials_action?: string;
    download_action?: string;
    sample_code?: string;
    success_modal?: {
      title?: string;
      extension_title?: string;
      subtitle?: string;
      code_label?: string;
      action?: string;
    };
    items?: LegacyItem[];
    install?: {
      title?: string;
      description?: string;
      channels?: Array<{
        label: string;
        url: string;
        icon?: string;
        external?: boolean;
      }>;
    };
    guide?: {
      title?: string;
      description?: string;
      steps?: string[];
      image?: string;
      image_alt?: string;
    };
    next_step?: {
      title?: string;
      description?: string;
    };
  };
  channel_survey?: {
    title?: string;
    description?: string;
    sign_in_required?: string;
    sign_in_action?: string;
    submit?: string;
    submit_extend?: string;
    success?: string;
    trial_done?: string;
    paid_extension_done?: string;
    view_reward?: string;
    auto_reward_note?: string;
    status?: Record<string, string>;
    fields?: Record<string, string>;
    placeholders?: Record<string, string>;
    reward_credential?: {
      title?: string;
      description?: string;
      permanent?: string;
      bindings?: string;
    };
    errors?: Record<string, string>;
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
    status?: Record<string, string>;
    download_plugin?: string;
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
  hide_heading?: boolean;
  messages?: Record<string, string>;
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
  columns?:
    | Array<{ key: string; title: string; highlight?: boolean }>
    | number
    | string;
  links?: LegacyItem[];
  default_group?: string;
  groups?: Array<{ name: string; title: string; label?: string }>;
  features?: LegacyItem[];
  market_tab_title?: string;
  market_tab_description?: string;
  package_tab_title?: string;
  package_tab_description?: string;
  package_tab_badge?: string;
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
  video_tab_title?: string;
  data_tab_title?: string;
  sample_url?: string;
  sample_trigger_title?: string;
  sample_button_title?: string;
  sample_columns?: string[];
  sample_limit?: number | string;
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
  sample_url?: string;
  sample_button_title?: string;
  sample_columns?: string[];
  sample_limit?: number | string;
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
  price_total?: string;
  unit?: string;
  tip?: string;
  features_title?: string;
  credits_title?: string;
  credits_features?: string[];
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
  maxBindings?: number | null;
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
    icon: typeof Download;
  }>;
};

const TUTORIAL_URL = '/docs';

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
        'Install the extension, buy a full activation code when you need all features, then follow the tutorial.',
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
          title: 'Buy an activation code',
          description:
            'Buy a full activation code when you need all features. The free version remains available permanently.',
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
          icon: GraduationCap,
        },
      ],
    };
  }

  return {
    badge: '新用户上手路径',
    flowTitle: '3 步完成上手',
    flowHint:
      '先完成插件安装，需要完整功能时购买正式版激活码，再按教程完成首次采集。',
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
        title: '购买正式版激活码',
        description:
          '需要完整功能可购买正式版激活码；暂不升级，也可永久使用免费版。',
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
  '/imgs/features/1-V20260706.png': { width: 780, height: 696 },
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

// Responsive variants for images that Lighthouse flagged as oversized on
// small viewports. Keyed by the original src; the browser picks the right
// candidate based on the `sizes` attribute passed at the call site.
const legacyImageSrcSets: Record<string, string> = {
  '/imgs/features/7-v20260309.webp':
    '/imgs/features/7-v20260309-640w.webp 640w, /imgs/features/7-v20260309.webp 1200w',
  '/imgs/features/platform-douyin.webp':
    '/imgs/features/platform-douyin-480w.webp 480w, /imgs/features/platform-douyin.webp 952w',
  '/imgs/features/platform-xiaohongshu.webp':
    '/imgs/features/platform-xiaohongshu-480w.webp 480w, /imgs/features/platform-xiaohongshu.webp 970w',
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
      srcSet={legacyImageSrcSets[image.src]}
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

function isExternalUrl(url: string): boolean {
  return /^(?:https?:)?\/\//.test(url) || /^(?:mailto|tel):/i.test(url);
}

function isStaticAssetUrl(url: string): boolean {
  const pathname = url.split(/[?#]/, 1)[0] || '';
  return (
    pathname.startsWith('/downloads/') ||
    /\.(?:avif|csv|docx?|gif|jpe?g|json|md|mp4|pdf|png|svg|webm|webp|xlsx?|zip)$/i.test(
      pathname
    )
  );
}

function shouldUsePlainAnchor(url: string): boolean {
  return isExternalUrl(url) || isStaticAssetUrl(url);
}

function openInNewTab(url: string, target?: string): boolean {
  return Boolean(target && target !== '_self') || isExternalUrl(url);
}

type LegacyLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href?: string;
  /** Forwarded to the router Link. Breadcrumb parents pass `{ exact: true }` so an
   * ancestor URL is not marked aria-current="page" on its child pages. */
  activeOptions?: { exact?: boolean };
};

function LegacyLink({
  href = '#',
  target,
  className,
  children,
  activeOptions,
  ...props
}: LegacyLinkProps) {
  if (shouldUsePlainAnchor(href)) {
    const openNewTab = openInNewTab(href, target);
    return (
      <a
        {...props}
        href={href}
        target={openNewTab ? target || '_blank' : undefined}
        rel={openNewTab ? 'noopener noreferrer' : props.rel}
        className={className}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      target={target}
      className={className}
      {...(activeOptions ? { activeOptions } : {})}
      {...props}
    >
      {children}
    </Link>
  );
}

const defaultContentSampleColumns = [
  '博主',
  '标题',
  '正文',
  '笔记类型',
  '点赞数',
  '收藏数',
  '评论数',
  '视频逐字稿提取',
  '配图文案',
  '评论内容',
];

const defaultLeadSampleColumns = [
  '原笔记标题',
  '评论用户',
  'IP属地',
  '评论时间',
  '评论内容',
  '点赞数',
  '用户主页',
  '命中关键词',
  '采集平台',
];

function isCsvSampleUrl(url?: string): boolean {
  if (!url) return false;
  const pathname = url.split(/[?#]/, 1)[0] || '';
  return (
    pathname.startsWith('/downloads/samples/') && pathname.endsWith('.csv')
  );
}

function isEnglishSampleButton(button: LegacyButton): boolean {
  const title = button.title || '';
  return /[a-z]/i.test(title) && !/[\u4e00-\u9fff]/.test(title);
}

function buildSampleButtonConfig(button: LegacyButton): LegacyButton | null {
  const sampleUrl =
    button.sample_url || (isCsvSampleUrl(button.url) ? button.url : undefined);
  if (!sampleUrl || !isCsvSampleUrl(sampleUrl)) return null;

  const pathname = sampleUrl.split(/[?#]/, 1)[0] || '';
  const isLeadSample = pathname.includes('leads');
  const english = isEnglishSampleButton(button);
  const isExplicitSampleAction = button.action === 'open_sample_modal';

  return {
    ...button,
    action: 'open_sample_modal',
    icon: button.icon || 'Table2',
    title:
      isExplicitSampleAction && button.title
        ? button.title
        : english
          ? isLeadSample
            ? 'View Lead Sample'
            : 'View Data Sample'
          : isLeadSample
            ? '查看客资示例'
            : '查看数据示例',
    sample_url: sampleUrl,
    sample_button_title:
      button.sample_button_title ||
      (english ? 'Download Full CSV' : '下载完整 CSV'),
    sample_limit: button.sample_limit ?? 6,
    sample_columns:
      button.sample_columns ||
      (isLeadSample ? defaultLeadSampleColumns : defaultContentSampleColumns),
  };
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
  onSample,
  className,
}: {
  button: LegacyButton;
  onVideo?: (button: LegacyButton) => void;
  onSample?: (button: LegacyButton) => void;
  className?: string;
}) {
  const isOutline = button.variant === 'outline';
  const buttonClass = cn(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors',
    isOutline
      ? 'border border-border bg-background text-foreground hover:bg-muted'
      : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
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

  const sampleButton = buildSampleButtonConfig(button);
  if ((button.action === 'open_sample_modal' || sampleButton) && onSample) {
    const resolvedButton = sampleButton || button;
    return (
      <button
        type="button"
        className={buttonClass}
        onClick={() => onSample(resolvedButton)}
      >
        <SmartIcon name={resolvedButton.icon} className="size-4" />
        {resolvedButton.title}
      </button>
    );
  }

  const href = button.url || '#';
  return (
    <LegacyLink href={href} target={button.target} className={buttonClass}>
      <SmartIcon name={button.icon} className="size-4" />
      {button.title}
    </LegacyLink>
  );
}

function buildSectionSampleButton(section: LegacySection): LegacyButton | null {
  if (!section.sample_url) return null;

  return {
    title: section.sample_trigger_title || '查看数据示例',
    icon: 'Table2',
    action: 'open_sample_modal',
    variant: 'outline',
    sample_url: section.sample_url,
    sample_button_title: section.sample_button_title,
    sample_columns: section.sample_columns,
    sample_limit: section.sample_limit,
  };
}

function HeroSampleLink({
  sampleButton,
  onSample,
}: {
  sampleButton: LegacyButton;
  onSample: (button: LegacyButton) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSample(sampleButton)}
      className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs font-medium transition-colors"
    >
      {sampleButton.title}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </button>
  );
}

function sectionUsesEnglish(section: LegacySection) {
  const text = [
    section.title,
    section.description,
    section.label,
    ...(section.buttons?.map((button) => button.title) || []),
  ]
    .filter(Boolean)
    .join(' ');

  return /[a-z]/i.test(text) && !/[\u4e00-\u9fff]/.test(text);
}

function hasHeroDemoVideo(section: LegacySection) {
  return Boolean(
    section.video_url ||
    section.video_embed_url ||
    section.video?.src ||
    section.video?.embed_src
  );
}

type HeroActionLayout = {
  structured: boolean;
  demoButton?: LegacyButton;
  useButton?: LegacyButton;
  sampleButton?: LegacyButton | null;
  extraButtons: LegacyButton[];
};

function buildHeroActionLayout(section: LegacySection): HeroActionLayout {
  const buttons = section.buttons || [];
  if (!hasHeroDemoVideo(section)) {
    return { structured: false, extraButtons: buttons };
  }

  const english = sectionUsesEnglish(section);
  const videoIndex = buttons.findIndex(
    (button) => button.action === 'open_video_modal'
  );
  const sampleIndex = buttons.findIndex((button) =>
    Boolean(buildSampleButtonConfig(button))
  );
  const sampleButton =
    buildSectionSampleButton(section) ||
    (sampleIndex >= 0 ? buildSampleButtonConfig(buttons[sampleIndex]) : null);
  const useIndex = buttons.findIndex(
    (button, index) =>
      index !== videoIndex &&
      index !== sampleIndex &&
      (button.url || '').startsWith('/download')
  );
  const fallbackUseIndex = buttons.findIndex(
    (button, index) =>
      index !== videoIndex &&
      index !== sampleIndex &&
      button.action !== 'open_video_modal' &&
      button.url
  );
  const resolvedUseIndex = useIndex >= 0 ? useIndex : fallbackUseIndex;
  const videoSource = videoIndex >= 0 ? buttons[videoIndex] : undefined;
  const useSource = resolvedUseIndex >= 0 ? buttons[resolvedUseIndex] : null;
  const excludedIndexes = new Set(
    [videoIndex, sampleIndex, resolvedUseIndex].filter((index) => index >= 0)
  );

  return {
    structured: true,
    demoButton: {
      ...videoSource,
      title: english ? 'Watch Demo' : '效果演示',
      icon: 'Play',
      action: 'open_video_modal',
      variant: 'outline',
      video_title: videoSource?.video_title || section.video_title,
    },
    useButton: useSource
      ? {
          ...useSource,
          title: english ? 'Get Started' : '我要使用',
          icon: useSource.icon || 'Download',
          variant: 'default',
        }
      : undefined,
    sampleButton,
    extraButtons: buttons.filter((_, index) => !excludedIndexes.has(index)),
  };
}

function HeroActions({
  section,
  onVideo,
  onSample,
  rowClassName,
  actionClassName,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  onSample: (button: LegacyButton) => void;
  rowClassName?: string;
  actionClassName?: string;
}) {
  const layout = buildHeroActionLayout(section);

  if (!layout.structured) {
    if (!section.buttons?.length) return null;

    const english = sectionUsesEnglish(section);
    const buttons = section.buttons.map((button) =>
      (button.url || '').startsWith('/download')
        ? { ...button, title: english ? 'Get Started' : '我要使用' }
        : button
    );

    return (
      <div className={rowClassName}>
        {buttons.map((button, index) => (
          <ActionButton
            key={`${button.title || 'button'}-${index}`}
            button={button}
            onVideo={onVideo}
            onSample={onSample}
            className={actionClassName}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={rowClassName}>
      {layout.useButton ? (
        <ActionButton
          button={layout.useButton}
          onVideo={onVideo}
          onSample={onSample}
          className={actionClassName}
        />
      ) : null}

      {layout.demoButton ? (
        <div className="flex flex-col items-center gap-2">
          <ActionButton
            button={layout.demoButton}
            onVideo={onVideo}
            onSample={onSample}
            className={actionClassName}
          />
          {layout.sampleButton ? (
            <HeroSampleLink
              sampleButton={layout.sampleButton}
              onSample={onSample}
            />
          ) : null}
        </div>
      ) : null}

      {layout.extraButtons.length ? (
        <div className="mt-1 flex basis-full flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {layout.extraButtons.map((button, index) => (
            <InlineArrowLink
              key={`${button.title || 'extra'}-${index}`}
              button={button}
            />
          ))}
        </div>
      ) : null}
    </div>
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
        className="group ring-foreground/10 shadow-primary/10 hover:ring-primary/40 hover:shadow-primary/20 focus-visible:ring-primary relative block aspect-video w-full overflow-hidden rounded-2xl text-left shadow-2xl ring-1 transition-all outline-none focus-visible:ring-2"
        aria-label={title}
      >
        <div className="bg-muted relative size-full overflow-hidden">
          {config.poster ? (
            <LegacyImageElement
              image={{ src: config.poster, alt: title }}
              alt={title}
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, 1360px"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="bg-muted flex size-full items-center justify-center" />
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

  return (
    <LegacyLink
      href={href}
      target={button.target || '_self'}
      className={className}
    >
      {content}
    </LegacyLink>
  );
}

function PageHero({
  section,
  onVideo,
  onSample,
  fallbackPoster,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  onSample: (button: LegacyButton) => void;
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
        'bg-background relative flex min-h-[85vh] items-center justify-center overflow-hidden py-20 md:py-32',
        section.className
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)] bg-[size:64px_64px]" />
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
                      <LegacyLink
                        href={crumb.url}
                        target={crumb.target}
                        activeOptions={{ exact: true }}
                        className="hover:text-neutral-950 dark:hover:text-white"
                      >
                        {crumb.title}
                      </LegacyLink>
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
            <LegacyLink
              href={section.announcement.url || '#'}
              className="border-border/70 bg-background/80 text-foreground hover:border-border mb-8 inline-flex max-w-full items-center gap-3 rounded-full border px-5 py-2 text-sm font-medium transition-colors"
            >
              <span
                className="bg-primary size-2 shrink-0 rounded-full"
                aria-hidden="true"
              />
              <span className="truncate">{section.announcement.title}</span>
              <ChevronRight className="size-4 shrink-0" />
            </LegacyLink>
          ) : null}
          {section.label ? (
            <div className="text-primary mb-4 text-sm font-semibold tracking-wide">
              {section.label}
            </div>
          ) : null}
          <h1 className="text-foreground mb-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
            {baseTitle}
            {highlight ? (
              <>
                {' '}
                <span className="text-primary">{highlight}</span>
              </>
            ) : null}
          </h1>
          <RichText className="text-muted-foreground mx-auto max-w-2xl text-lg leading-8 md:text-xl">
            {section.description}
          </RichText>
          <HeroActions
            section={section}
            onVideo={onVideo}
            onSample={onSample}
            rowClassName="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3"
            actionClassName="min-w-[150px]"
          />
        </div>

        {section.video_url || section.video_embed_url || section.video?.src ? (
          <HeroVideoPreview
            section={section}
            onVideo={onVideo}
            fallbackPoster={fallbackPoster}
          />
        ) : section.image?.src ? (
          <div className="relative mx-auto mt-16 max-w-6xl">
            <div className="ring-foreground/10 relative overflow-hidden rounded-2xl shadow-xl ring-1 shadow-black/10">
              <LegacyImageElement
                image={section.image}
                alt={section.image.alt || section.title || ''}
                loading="eager"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 1152px"
                className="w-full"
              />
              <div
                className="ring-foreground/5 pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset"
                aria-hidden="true"
              />
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
  onSample,
  fallbackPoster,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  onSample: (button: LegacyButton) => void;
  fallbackPoster?: string;
}) {
  const crumbs = section.breadcrumbs || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden pt-28 pb-12 md:pt-32 md:pb-16',
        section.className
      )}
    >
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
                      <LegacyLink
                        href={crumb.url}
                        target={crumb.target || '_self'}
                        activeOptions={{ exact: true }}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.title}
                      </LegacyLink>
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
            <div className="text-primary mb-4 text-sm font-semibold tracking-wide">
              {section.label}
            </div>
          ) : null}

          <h1 className="text-foreground mb-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {section.title}
          </h1>

          {section.description ? (
            <RichText className="text-muted-foreground mx-auto max-w-3xl text-lg md:text-xl">
              {section.description}
            </RichText>
          ) : null}

          <HeroActions
            section={section}
            onVideo={onVideo}
            onSample={onSample}
            rowClassName="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-start"
            actionClassName="min-w-[150px] rounded-xl px-6 py-3 text-sm"
          />

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
              <div className="border-border/60 bg-card group-hover:border-border relative h-full overflow-hidden rounded-2xl border p-8 transition-colors duration-300">
                {item.icon ? (
                  <div
                    data-feature-icon
                    className="bg-primary/10 text-primary mb-6 inline-flex size-12 items-center justify-center rounded-xl"
                  >
                    <SmartIcon name={item.icon} className="size-6" />
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
                <h3 className="text-foreground mb-3 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
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
              <LegacyLink
                key={`${item.title || 'feature'}-${index}`}
                href={item.url}
                target={item.target}
                className="block h-full transition-transform hover:-translate-y-0.5"
              >
                {card}
              </LegacyLink>
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
        'relative overflow-hidden py-20 md:py-28',
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
                <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
                  {item.title}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {item.description}
                  </p>
                ) : null}
                {item.image?.src ? (
                  <div className="ring-foreground/10 bg-muted/20 mt-4 flex h-[360px] items-start justify-center overflow-hidden rounded-xl shadow-lg ring-1 shadow-black/10 sm:h-[420px] lg:h-[520px]">
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
              'group block rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:border-border';

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

            return (
              <LegacyLink
                key={`${item.title || 'matrix'}-${index}`}
                href={item.url}
                target={item.target}
                className={cn(className, 'hover:-translate-y-0.5')}
              >
                {content}
              </LegacyLink>
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
  const isMcnProfileImage =
    activeItem?.title?.startsWith('MCN') &&
    activeItem.image?.src === '/imgs/features/2-v20260309.webp';

  if (!items.length) return null;

  return (
    <section
      id={section.id}
      className={cn(
        'bg-background relative overflow-hidden py-24 md:py-32',
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
                <h3 className="text-2xl font-bold text-neutral-950 md:text-3xl dark:text-white">
                  {activeItem.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {activeItem.description}
                </p>
              </div>

              {activeItem.image?.src ? (
                <div
                  className={cn(
                    'border-border/50 relative h-[220px] w-full flex-1 overflow-hidden rounded-2xl border shadow-md md:h-[340px]',
                    isMcnProfileImage && 'md:mr-4 md:-ml-4'
                  )}
                >
                  <LegacyImageElement
                    image={activeItem.image}
                    alt={activeItem.image.alt || activeItem.title || ''}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="size-full object-cover object-right"
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
        'bg-secondary/30 relative overflow-hidden py-24 md:py-32',
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
                <h3 className="text-foreground text-3xl font-bold tracking-normal">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-xl leading-relaxed">
                  {item.description}
                </p>
                {item.button ? <InlineArrowLink button={item.button} /> : null}
              </div>
              <div
                className="group relative w-full flex-1"
                data-features-scroll-media
              >
                <div className="ring-foreground/10 bg-muted relative max-h-[500px] w-full overflow-hidden rounded-2xl shadow-xl ring-1 shadow-black/10">
                  {item.image?.src ? (
                    <LegacyImageElement
                      image={item.image}
                      alt={item.image.alt || item.title || ''}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="bg-muted flex h-64 w-full items-center justify-center sm:h-80 md:h-[450px]">
                      <SmartIcon
                        name={item.icon || 'Image'}
                        className="text-muted-foreground/30 size-20"
                      />
                    </div>
                  )}
                  <div
                    className="ring-foreground/5 pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset"
                    aria-hidden="true"
                  />
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
    title: column.title ?? column.key ?? `Column ${index + 1}`,
    align: index === 0 ? 'left' : 'center',
    highlight: column.highlight === true,
  }));
}

function DataTableCellValue({ value }: { value?: string }) {
  const text = (value || '').trim();

  if (!text || text === '—' || text === '-' || text === '✕' || text === '×') {
    return (
      <Minus
        className="text-muted-foreground/40 inline-block size-4"
        aria-hidden="true"
      />
    );
  }

  if (text.startsWith('✓')) {
    const rest = text.slice(1).trim();
    return (
      <span className="inline-flex items-center justify-center gap-1.5">
        <span className="bg-primary/10 flex size-5 shrink-0 items-center justify-center rounded-full">
          <CheckCircle2 className="text-primary size-3" aria-hidden="true" />
        </span>
        {rest ? (
          <span className="text-muted-foreground text-xs">{rest}</span>
        ) : null}
      </span>
    );
  }

  return <>{text}</>;
}

function isDataTableGroupRow(row: Record<string, string>) {
  return Boolean(row.section_title);
}

function isDataTableSubgroupRow(row: Record<string, string>) {
  return Boolean(row.subsection_title);
}

const planComparisonColumnWidths: Record<string, string> = {
  feature: '28%',
  free: '14%',
  pro: '14%',
  team: '14%',
  note: '30%',
};

function isPlanComparisonTable(columns: Array<{ key: string }>) {
  return (
    columns.length === 5 &&
    columns.every((column) => planComparisonColumnWidths[column.key])
  );
}

function DataTableBlock({ section }: { section: LegacySection }) {
  const columns = normalizeTableColumns(section);
  const rows = section.rows || [];
  const hasPlanComparisonLayout = isPlanComparisonTable(columns);

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-20 md:py-28',
        section.className
      )}
      data-legacy-data-table
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div className="mt-12">
          <div
            className="hidden overflow-x-auto md:block"
            data-desktop-data-table
          >
            <table
              className={cn(
                'min-w-full border-collapse text-sm',
                hasPlanComparisonLayout && 'table-fixed'
              )}
            >
              {hasPlanComparisonLayout ? (
                <colgroup>
                  {columns.map((column) => (
                    <col
                      key={column.key}
                      style={{ width: planComparisonColumnWidths[column.key] }}
                    />
                  ))}
                </colgroup>
              ) : null}
              <thead>
                <tr className="border-border/60 border-b">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'text-muted-foreground px-4 py-4 align-middle text-sm font-medium whitespace-nowrap',
                        column.align === 'center' ? 'text-center' : 'text-left',
                        column.highlight && 'bg-primary/5 text-foreground'
                      )}
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) =>
                  isDataTableGroupRow(row) ? (
                    <tr
                      key={index}
                      className="border-border/60 border-b"
                      data-table-group-row
                    >
                      <td
                        colSpan={columns.length}
                        className="px-4 pt-10 pb-3 text-left"
                      >
                        <p className="text-foreground text-base font-semibold">
                          {row.section_title}
                        </p>
                        {row.section_description ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {row.section_description}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ) : isDataTableSubgroupRow(row) ? (
                    <tr
                      key={index}
                      className="border-border/50 bg-muted/25 border-b"
                      data-table-subgroup-row
                    >
                      <td
                        colSpan={columns.length}
                        className="px-4 py-4 text-left"
                      >
                        <p className="text-foreground text-sm font-semibold">
                          {row.subsection_title}
                        </p>
                        {row.subsection_description ? (
                          <p className="text-muted-foreground mt-1 text-xs">
                            {row.subsection_description}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ) : (
                    <tr key={index} className="border-border/40 border-b">
                      {columns.map((column, columnIndex) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-5',
                            columnIndex === 0 || column.key === 'note'
                              ? 'text-balance'
                              : 'whitespace-nowrap',
                            columnIndex === 0
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground',
                            column.align === 'center'
                              ? 'text-center'
                              : 'text-left',
                            column.highlight && 'bg-primary/5 text-foreground'
                          )}
                        >
                          {columnIndex === 0 ? (
                            row[column.key] || '-'
                          ) : (
                            <DataTableCellValue value={row[column.key]} />
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-border/40 border-border/60 divide-y border-y md:hidden">
            {rows.map((row, rowIndex) =>
              isDataTableGroupRow(row) ? (
                <div
                  key={rowIndex}
                  className="px-1 pt-8 pb-3"
                  data-mobile-data-group
                >
                  <p className="text-foreground text-sm font-semibold">
                    {row.section_title}
                  </p>
                  {row.section_description ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.section_description}
                    </p>
                  ) : null}
                </div>
              ) : isDataTableSubgroupRow(row) ? (
                <div
                  key={rowIndex}
                  className="bg-muted/25 px-3 py-4"
                  data-mobile-data-subgroup
                >
                  <p className="text-foreground text-sm font-semibold">
                    {row.subsection_title}
                  </p>
                  {row.subsection_description ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {row.subsection_description}
                    </p>
                  ) : null}
                </div>
              ) : (
                <article
                  key={rowIndex}
                  className="space-y-3 px-1 py-5"
                  data-mobile-data-row
                >
                  {columns.map((column, columnIndex) => (
                    <div
                      key={`${rowIndex}-${column.key}`}
                      className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {column.title}
                      </span>
                      <span className="text-foreground font-medium">
                        {columnIndex === 0 ? (
                          row[column.key] || '-'
                        ) : (
                          <DataTableCellValue value={row[column.key]} />
                        )}
                      </span>
                    </div>
                  ))}
                </article>
              )
            )}
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

function resolveOutputOptionIcon(mode?: string) {
  const text = mode || '';

  if (/csv|markdown|导出/i.test(text)) return 'FileSpreadsheet';
  if (/media|媒体|download|下载/i.test(text)) return 'ImageDown';
  if (/lark|feishu|飞书|base|同步/i.test(text)) return 'Table2';

  return 'Database';
}

function OutputOptionsBlock({ section }: { section: LegacySection }) {
  const options = (section.rows || []).filter((row) => row.mode);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeOption = options[activeIndex] || options[0];
  const sceneColumnTitle =
    normalizeTableColumns(section).find((column) => column.key === 'scene')
      ?.title ||
    (/[一-龥]/.test(section.title || '') ? '典型场景' : 'Best for');
  const activeImage =
    activeOption?.image_src || section.image?.src
      ? {
          src: activeOption?.image_src || section.image?.src,
          alt:
            activeOption?.image_alt ||
            section.image?.alt ||
            activeOption?.mode ||
            section.title,
          width: section.image?.width,
          height: section.image?.height,
        }
      : null;
  const iconName =
    activeOption?.icon || resolveOutputOptionIcon(activeOption?.mode);

  if (!options.length || !activeOption) return null;

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-20 md:py-28',
        section.className
      )}
      data-output-options
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />
        <div
          className="mt-10 flex flex-wrap justify-center gap-3"
          role="tablist"
          aria-label={section.title}
          data-output-option-tabs
        >
          {options.map((option, index) => (
            <button
              key={`${option.mode}-${index}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'rounded-full px-5 py-3 text-sm font-semibold transition sm:text-base',
                activeIndex === index
                  ? 'bg-foreground text-background shadow-lg shadow-black/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {option.mode}
            </button>
          ))}
        </div>

        <article
          className="border-border bg-card mt-10 grid items-center gap-8 rounded-3xl border p-6 shadow-xl shadow-black/5 lg:grid-cols-[0.9fr_1.1fr] lg:p-10"
          data-output-option-card
        >
          <div className="min-w-0">
            <div className="bg-primary/10 text-primary mb-6 inline-flex size-14 items-center justify-center rounded-2xl">
              <SmartIcon name={iconName} className="size-7" />
            </div>
            <h3 className="text-foreground text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {activeOption.mode}
            </h3>
            {activeOption.desc ? (
              <p className="text-muted-foreground mt-5 text-lg leading-8">
                {activeOption.desc}
              </p>
            ) : null}
            {activeOption.scene ? (
              <div className="border-border/70 bg-muted/40 mt-8 rounded-2xl border p-5">
                <p className="text-muted-foreground text-sm font-medium">
                  {sceneColumnTitle}
                </p>
                <p className="text-foreground mt-2 text-base leading-7 font-semibold">
                  {activeOption.scene}
                </p>
              </div>
            ) : null}
          </div>

          <div className="bg-muted relative overflow-hidden rounded-2xl">
            {activeImage?.src ? (
              <LegacyImageElement
                image={activeImage}
                alt={activeImage.alt || activeOption.mode}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/10] w-full items-center justify-center">
                <SmartIcon
                  name={iconName}
                  className="text-muted-foreground/30 size-20"
                />
              </div>
            )}
            <div
              className="ring-foreground/10 pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset"
              aria-hidden="true"
            />
          </div>
        </article>
      </div>
    </section>
  );
}

type CsvPreview = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

function parseCsvPreview(csv: string, limit: number): CsvPreview {
  const source = csv.replace(/^\uFEFF/, '');
  const parsedRows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      parsedRows.push(row);
      if (parsedRows.length >= limit + 1) break;
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (parsedRows.length < limit + 1 && (cell || row.length)) {
    row.push(cell);
    parsedRows.push(row);
  }

  const headers = parsedRows[0]?.map((header) => header.trim()) || [];
  const rows = parsedRows
    .slice(1, limit + 1)
    .map((values) =>
      Object.fromEntries(
        headers.map((header, index) => [header, values[index]?.trim() || ''])
      )
    );

  return { headers, rows };
}

function normalizeSampleCell(value?: string) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

const sampleColumnLabels: Record<string, string> = {
  采集平台: '平台',
  点赞数: '点赞',
  收藏数: '收藏',
  评论数: '评论',
  视频逐字稿提取: '视频逐字稿',
  配图文案: '图文文案',
};

function getSampleColumnLabel(column: string) {
  return sampleColumnLabels[column] || column;
}

function SampleDataDialogContent({ sample }: { sample: LegacyButton }) {
  const rowLimit = Math.max(
    1,
    Math.min(20, Math.floor(readNumber(sample.sample_limit) ?? 6))
  );
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    sample.sample_url ? 'loading' : 'idle'
  );

  useEffect(() => {
    if (!sample.sample_url) return;

    let active = true;
    setStatus('loading');

    fetch(sample.sample_url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sample CSV: ${response.status}`);
        }
        return response.text();
      })
      .then((csv) => {
        if (!active) return;
        setPreview(parseCsvPreview(csv, rowLimit));
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [rowLimit, sample.sample_url]);

  const configuredColumns =
    sample.sample_columns?.filter((column) =>
      preview?.headers.includes(column)
    ) || [];
  const columns = configuredColumns.length
    ? configuredColumns
    : preview?.headers.slice(0, 10) || [];

  return (
    <div className="bg-card flex max-h-[88vh] flex-col overflow-hidden rounded-lg">
      <div className="border-border/60 flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle>{sample.title || '数据示例'}</DialogTitle>
          <DialogDescription>
            {preview
              ? `${preview.headers.length} 个字段 · 预览 ${preview.rows.length} 行`
              : status === 'error'
                ? '示例数据暂时无法加载'
                : '正在加载示例数据'}
          </DialogDescription>
        </DialogHeader>

        {sample.sample_url ? (
          <LegacyLink
            href={sample.sample_url}
            target="_blank"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'shrink-0 gap-2'
            )}
            data-sample-download
          >
            <Download className="size-4" aria-hidden="true" />
            {sample.sample_button_title || '下载完整 CSV'}
          </LegacyLink>
        ) : null}
      </div>

      <div className="overflow-auto" data-sample-table-scroll>
        <table className="min-w-[1280px] border-collapse text-sm">
          <thead className="bg-card sticky top-0 z-10">
            <tr className="border-border/60 border-b">
              {columns.map((column) => (
                <th
                  key={column}
                  className="text-foreground px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                >
                  {getSampleColumnLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview?.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-border/50 hover:bg-muted/30 border-b last:border-b-0"
              >
                {columns.map((column) => {
                  const value = normalizeSampleCell(row[column]);
                  return (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="text-muted-foreground px-4 py-3 align-top"
                    >
                      <span
                        className="block max-w-[20rem] truncate"
                        title={value}
                      >
                        {value || '-'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SampleVideoPanel({
  section,
  fallbackPoster,
}: {
  section: LegacySection;
  fallbackPoster?: string;
}) {
  const config = resolveDemoVideoConfig(section, undefined, fallbackPoster);

  if (!config) {
    return (
      <div className="bg-muted/30 flex aspect-video items-center justify-center rounded-lg border">
        <Play className="text-muted-foreground size-10" aria-hidden="true" />
      </div>
    );
  }

  if (config.embedSrc) {
    return (
      <iframe
        src={config.embedSrc}
        title={config.title || section.title || 'Sample preview video'}
        className="aspect-video w-full rounded-lg border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className="bg-muted aspect-video w-full rounded-lg border object-contain"
      controls
      preload="metadata"
      poster={config.poster}
    >
      {config.src ? (
        <source src={buildTimedSrc(config.src, config.start)} />
      ) : null}
    </video>
  );
}

function SamplePreviewBlock({
  section,
  fallbackPoster,
}: {
  section: LegacySection;
  fallbackPoster?: string;
}) {
  const rowLimit = Math.max(
    1,
    Math.min(20, Math.floor(readNumber(section.sample_limit) ?? 6))
  );
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    section.sample_url ? 'loading' : 'idle'
  );

  useEffect(() => {
    if (!section.sample_url) return;

    let active = true;
    setStatus('loading');

    fetch(section.sample_url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load sample CSV: ${response.status}`);
        }
        return response.text();
      })
      .then((csv) => {
        if (!active) return;
        setPreview(parseCsvPreview(csv, rowLimit));
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [rowLimit, section.sample_url]);

  const sampleColumns =
    section.sample_columns?.filter((column) =>
      preview?.headers.includes(column)
    ) || [];
  const columns = sampleColumns.length
    ? sampleColumns
    : preview?.headers.slice(0, 9) || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-20 md:py-28',
        section.className
      )}
      data-sample-preview
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <SectionHeading section={section} />

        <Tabs
          defaultValue="data"
          className="mt-10 flex-col"
          data-sample-preview-tabs
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-muted/50 grid h-auto w-full grid-cols-2 rounded-lg p-1 sm:w-auto">
              <TabsTrigger
                value="data"
                className="gap-2 rounded-md px-4 py-2 text-sm"
              >
                <Table2 className="size-4" aria-hidden="true" />
                {section.data_tab_title || '数据预览'}
              </TabsTrigger>
              <TabsTrigger
                value="video"
                className="gap-2 rounded-md px-4 py-2 text-sm"
              >
                <Play className="size-4" aria-hidden="true" />
                {section.video_tab_title || '视频演示'}
              </TabsTrigger>
            </TabsList>

            {section.sample_url ? (
              <LegacyLink
                href={section.sample_url}
                target="_blank"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'w-full gap-2 sm:w-auto'
                )}
                data-sample-download
              >
                <Download className="size-4" aria-hidden="true" />
                {section.sample_button_title || '下载完整示例'}
              </LegacyLink>
            ) : null}
          </div>

          <TabsContent value="data" className="mt-6 focus-visible:outline-none">
            <div className="border-border/60 bg-card/60 overflow-hidden rounded-lg border shadow-sm">
              <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div className="text-muted-foreground text-sm">
                  {preview
                    ? `${preview.headers.length} 个字段 · 预览 ${preview.rows.length} 行`
                    : status === 'error'
                      ? '示例数据暂时无法加载'
                      : '正在加载示例数据'}
                </div>
                {section.tip ? (
                  <RichText className="text-muted-foreground text-sm">
                    {section.tip}
                  </RichText>
                ) : null}
              </div>

              <div
                className="max-h-[460px] overflow-auto"
                data-sample-table-scroll
              >
                <table className="min-w-[1080px] border-collapse text-sm">
                  <thead className="bg-card sticky top-0 z-10">
                    <tr className="border-border/60 border-b">
                      {columns.map((column) => (
                        <th
                          key={column}
                          className="text-foreground px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview?.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-border/50 hover:bg-muted/30 border-b last:border-b-0"
                      >
                        {columns.map((column) => {
                          const value = normalizeSampleCell(row[column]);
                          return (
                            <td
                              key={`${rowIndex}-${column}`}
                              className="text-muted-foreground px-4 py-3 align-top"
                            >
                              <span
                                className="block max-w-[18rem] truncate"
                                title={value}
                              >
                                {value || '-'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="video"
            className="mt-6 focus-visible:outline-none"
          >
            <SampleVideoPanel
              section={section}
              fallbackPoster={fallbackPoster}
            />
          </TabsContent>
        </Tabs>
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
        'relative overflow-hidden py-16 md:py-20',
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
            <LegacyLink
              key={`${item.title || 'link'}-${index}`}
              href={item.url || '#'}
              target={item.target || '_self'}
              className="border-border/60 bg-card hover:border-border group rounded-2xl border p-5 transition-colors"
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
            </LegacyLink>
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
        'relative overflow-hidden py-24 md:py-32',
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
                  'border-border/60 bg-card overflow-hidden rounded-2xl border transition-colors duration-300',
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
    </section>
  );
}

function TimelineBlock({ section }: { section: LegacySection }) {
  const items = section.items || [];

  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-20 md:py-28',
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

                          return (
                            <LegacyLink
                              key={`${action.title}-${actionIndex}`}
                              href={action.url || '#'}
                              target={action.target}
                              className={className}
                            >
                              {content}
                            </LegacyLink>
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
        'relative overflow-hidden bg-white py-24 dark:bg-neutral-950',
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
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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
  const isChinese = /[一-龥]/.test(copy.badge);
  const buyLabel = isChinese ? '购买正式版激活码' : 'Buy activation code';

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
                    {step.id === 'activate' ? (
                      <div className="grid shrink-0 gap-2 md:w-[23rem]">
                        <Link
                          href="/pricing?source=onboarding&entry=download_page"
                          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-amber-300/80 bg-amber-300 px-4 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/15 transition-colors hover:bg-amber-200"
                        >
                          {buyLabel}
                        </Link>
                        <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1 text-center text-sm leading-6">
                          <span>
                            {isChinese
                              ? '暂不升级，也可永久使用'
                              : 'Or keep using the'}
                          </span>
                          <Link
                            href="/pricing?source=onboarding&entry=free_version"
                            className="text-foreground font-medium underline-offset-4 hover:underline"
                          >
                            {isChinese ? '免费版' : 'free version permanently'}
                          </Link>
                        </p>
                      </div>
                    ) : step.href ? (
                      <div className="grid shrink-0 gap-2 md:w-[23rem]">
                        <Link
                          href={step.href}
                          className={buttonVariants({
                            className:
                              'w-full border-cyan-300/80 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-200 md:w-44',
                          })}
                        >
                          {step.action}
                        </Link>
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
      <TabsList className="mb-8 grid h-auto w-full grid-cols-1 gap-3 bg-transparent p-0 group-data-horizontal/tabs:!h-auto sm:grid-cols-2">
        <TabsTrigger
          value="market"
          className="border-border/70 bg-card/70 hover:border-primary/50 hover:bg-primary/5 data-active:border-primary data-active:bg-primary/10 data-active:ring-primary/20 h-auto min-h-24 justify-start gap-4 rounded-xl border px-5 py-4 text-left whitespace-normal shadow-sm transition-all data-active:shadow-lg data-active:ring-2"
          data-download-market-tab
        >
          <span className="bg-primary/10 text-primary ring-primary/15 flex size-11 shrink-0 items-center justify-center rounded-xl ring-1">
            <Globe className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="text-foreground block text-base font-bold">
              {section.market_tab_title || '商店安装'}
            </span>
            <span className="text-muted-foreground mt-1 block text-xs leading-5 font-normal">
              {section.market_tab_description || '自动更新，推荐优先选择'}
            </span>
          </span>
        </TabsTrigger>
        <TabsTrigger
          value="package"
          className="border-border/70 bg-card/70 hover:border-primary/50 hover:bg-primary/5 data-active:border-primary data-active:bg-primary/10 data-active:ring-primary/20 relative h-auto min-h-24 justify-start gap-4 rounded-xl border px-5 py-4 text-left whitespace-normal shadow-sm transition-all data-active:shadow-lg data-active:ring-2"
          data-download-package-tab
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
            <Download className="size-5" />
          </span>
          <span className="min-w-0 pr-14">
            <span className="text-foreground block text-base font-bold">
              {section.package_tab_title || '离线安装'}
            </span>
            <span className="text-muted-foreground mt-1 block text-xs leading-5 font-normal">
              {section.package_tab_description || '商店无法访问时使用安装包'}
            </span>
          </span>
          <span className="absolute top-3 right-3 rounded-full bg-amber-500/15 px-2 py-1 text-[11px] leading-none font-bold text-amber-700 dark:text-amber-300">
            {section.package_tab_badge || '备用方式'}
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
                  <Link
                    href={section.video_button.url || '#'}
                    target={section.video_button.target}
                    className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all"
                    data-download-video-link
                  >
                    <Play className="size-5" />
                    {section.video_button.title}
                  </Link>
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
        'group border-border/60 bg-card h-full overflow-hidden transition-colors duration-300',
        'hover:border-border'
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
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-medium shadow-sm transition-colors"
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
  const plan = credentialPlanLabel(credential.planCode);
  const expiresAt = formatCredentialExpiresAt(credential.expiresAt);
  return `${code} · ${plan} · ${expiresAt}`;
}

function usableCredentialsForCheckout(
  item: LegacyItem | null,
  credentials: UserCredentialSummary[]
) {
  const active = credentials.filter(
    (credential) => credential.status === 'active' && credential.code
  );
  if (!item) return active;
  if (isCreditPackItem(item)) {
    return active.filter(
      (credential) => getCredentialPlanTier(credential) !== 'trial'
    );
  }

  const targetTier = item.product_id
    ? getPricingProduct(item.product_id)?.credentialTier
    : null;
  if (!targetTier || targetTier === 'trial') return [];
  return active.filter(
    (credential) => getCredentialPlanTier(credential) === targetTier
  );
}

function PricingBlock({ section }: { section: LegacySection }) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const messages = section.messages || {};
  const copy = (key: string, fallback: string) => messages[key] || fallback;
  const groups = section.groups || [];
  const defaultGroup = section.default_group || groups[0]?.name || 'month';
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
    return usableCredentialsForCheckout(checkoutItem, credentials);
  }, [checkoutItem, credentials]);
  const checkoutNeedsCredential =
    Boolean(checkoutItem) &&
    (isCreditPackItem(checkoutItem) || checkoutMode === 'recharge');
  const checkoutCredentialTier = useMemo<CredentialPlanTier | null>(() => {
    if (!checkoutItem?.product_id || isCreditPackItem(checkoutItem))
      return null;
    return getPricingProduct(checkoutItem.product_id)?.credentialTier || null;
  }, [checkoutItem]);
  const renewalUnavailable =
    checkoutMode === 'recharge' &&
    !isCreditPackItem(checkoutItem) &&
    !credentialsLoading &&
    selectedCredentials.length === 0;
  const noMatchingCredentialMessage =
    checkoutCredentialTier === 'team'
      ? copy('no_team_credentials', '暂无团队版激活码，请选择新购激活码')
      : copy('no_personal_credentials', '暂无个人版激活码，请选择新购激活码');

  async function loadCredentials(item: LegacyItem, mode: CheckoutMode) {
    if (!session?.user) return;
    if (!isCreditPackItem(item) && mode !== 'recharge') return;

    setCredentialsLoading(true);
    try {
      const result = await apiGet<PageResult<UserCredentialSummary>>(
        '/api/user/get-credentials?page=1&pageSize=100&status=active'
      );
      const rows = result?.items || [];
      const usableRows = usableCredentialsForCheckout(item, rows);
      setCredentials(rows);
      setSelectedCredentialCode(usableRows[0]?.code || '');
    } catch (error: any) {
      toast.error(
        error?.message || copy('credentials_load_failed', '激活码列表加载失败')
      );
    } finally {
      setCredentialsLoading(false);
    }
  }

  async function openCheckout(item: LegacyItem) {
    if (!isPaidPricingItem(item)) return;
    if (sessionPending) return;
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/pricing'
      );
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
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
      toast.error(copy('credential_required', '请选择或输入激活码'));
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
      if (!checkoutUrl) {
        throw new Error(copy('checkout_failed', 'Checkout failed'));
      }
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.message || copy('checkout_failed', 'Checkout failed'));
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <section
        id={section.id}
        className={cn(
          'relative overflow-hidden',
          section.hide_heading
            ? 'pt-0 pb-24 md:pt-0 md:pb-28'
            : 'py-24 md:py-32',
          section.className
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-4">
          {!section.hide_heading ? <SectionHeading section={section} /> : null}
          {groups.length ? (
            <div
              className={cn(
                'flex justify-center',
                section.hide_heading ? 'mb-8' : 'mb-12',
                section.hide_heading ? 'mt-0' : 'mt-10'
              )}
            >
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
                    'relative flex h-full flex-col overflow-hidden rounded-2xl border transition-colors duration-300',
                    isFeatured
                      ? 'border-primary/60 bg-card shadow-lg shadow-black/5 lg:-mt-4'
                      : 'border-border/60 bg-card hover:border-border'
                  )}
                >
                  {isFeatured && item.label ? (
                    <div className="absolute top-6 right-6">
                      <div className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                        {item.label}
                      </div>
                    </div>
                  ) : null}

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
                      {item.price_total ? (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {item.price_total}
                        </p>
                      ) : null}
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
                          'mb-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-medium transition-colors disabled:opacity-60',
                          isFeatured
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                            : 'border-border bg-background text-foreground hover:bg-muted border'
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
                        className="border-border bg-background text-foreground hover:bg-muted mb-8 w-full border px-6 py-3.5 text-base shadow-none"
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

                    {item.credits_features?.length ? (
                      <div className="border-border/40 mt-6 border-t pt-5">
                        {item.credits_title ? (
                          <p className="text-foreground mb-3 text-sm font-semibold">
                            {item.credits_title}
                          </p>
                        ) : null}
                        <ul className="space-y-3">
                          {item.credits_features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-3"
                            >
                              <span className="bg-primary/10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                                <Sparkles className="text-primary size-3" />
                              </span>
                              <span className="text-muted-foreground text-sm leading-6">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div
            className="text-muted-foreground mt-10 flex items-center justify-center gap-2 text-sm"
            data-pricing-payment-security
          >
            <span>{copy('payment_secure_prefix', 'Secure payment via')}</span>
            <img
              src="/imgs/logos/alipay-logo.png"
              alt="支付宝 Alipay"
              className="h-5 w-auto object-contain"
            />
            {copy('payment_secure_suffix', '') ? (
              <span>{copy('payment_secure_suffix', '')}</span>
            ) : null}
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
              {checkoutItem?.price_total ||
                `${checkoutItem?.price || ''}${
                  checkoutItem?.unit ? ` ${checkoutItem.unit}` : ''
                }`}
              {checkoutItem?.credits
                ? ` · ${checkoutItem.credits} ${copy('credits_unit', '积分')}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {checkoutItem && !isCreditPackItem(checkoutItem) ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={checkoutMode === 'issue' ? 'default' : 'outline'}
                  onClick={() => switchCheckoutMode('issue')}
                >
                  {copy('purchase_mode_new', '新购激活码')}
                </Button>
                <Button
                  type="button"
                  variant={checkoutMode === 'recharge' ? 'default' : 'outline'}
                  onClick={() => switchCheckoutMode('recharge')}
                >
                  {copy('purchase_mode_renew', '续费已有码')}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                {copy(
                  'checkout_modal_description_plan',
                  '个人版只能续费个人版，团队版只能续费团队版。'
                )}
              </p>
            </div>
          ) : null}

          {checkoutNeedsCredential ? (
            <div className="space-y-4 rounded-lg border bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              {renewalUnavailable ? (
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {noMatchingCredentialMessage}
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => switchCheckoutMode('issue')}
                  >
                    {copy('purchase_mode_new', '新购激活码')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="credential-select">
                      {copy('select_credential', '选择已有激活码')}
                    </Label>
                    <select
                      id="credential-select"
                      className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                      value={selectedCredentialCode}
                      disabled={
                        credentialsLoading || !selectedCredentials.length
                      }
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
                          {credentialsLoading
                            ? `${copy('processing', '处理中')}...`
                            : copy(
                                'no_formal_credentials',
                                '暂无可用正式会员激活码'
                              )}
                        </option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credential-code">
                      {copy('custom_input', '手动输入激活码')}
                    </Label>
                    <Input
                      id="credential-code"
                      value={customCredentialCode}
                      placeholder={copy(
                        'custom_credential_placeholder',
                        'ACT-XXXX-XXXX-XXXX'
                      )}
                      onChange={(event) =>
                        setCustomCredentialCode(event.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={checkoutLoading}
              onClick={() => setCheckoutItem(null)}
            >
              {copy('checkout_modal_cancel', '取消')}
            </Button>
            <Button
              type="button"
              disabled={
                checkoutLoading || credentialsLoading || renewalUnavailable
              }
              onClick={confirmCheckout}
            >
              {checkoutLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {copy('checkout_modal_confirm', '继续支付')}
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
                <p className="text-foreground w-full text-left text-balance before:mr-1 before:content-['“'] after:ml-1 after:content-['”']">
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

function TestimonialWallBlock({ section }: { section: LegacySection }) {
  return (
    <div className={cn('py-16 md:py-24', section.className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <TestimonialWallSection id={section.id} />
      </div>
    </div>
  );
}

function CtaBlock({
  section,
  onVideo,
  onSample,
}: {
  section: LegacySection;
  onVideo: (button: LegacyButton) => void;
  onSample: (button: LegacyButton) => void;
}) {
  return (
    <section
      id={section.id}
      className={cn(
        'relative overflow-hidden py-24 md:py-32',
        section.className
      )}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="bg-secondary/40 relative overflow-hidden rounded-3xl p-10 text-center sm:p-12 md:p-16 lg:p-20">
          <div className="relative z-10 mx-auto max-w-4xl">
            {section.subtitle || section.label ? (
              <p className="text-primary mb-4 text-sm font-semibold tracking-wide">
                {section.subtitle || section.label}
              </p>
            ) : null}
            <h2 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
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
                    onSample={onSample}
                    className={cn(
                      'rounded-full px-8 py-4 text-base transition-colors',
                      button.variant === 'outline'
                        ? 'border-border bg-background text-foreground hover:bg-muted border shadow-none'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
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
        <p className="text-primary mb-3 text-sm font-semibold tracking-wide">
          {section.subtitle || section.label}
        </p>
      ) : null}
      {section.title ? (
        <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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
    <section id={section.id} className="bg-white py-18 dark:bg-neutral-950">
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
    <section className="bg-white py-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="border-border/60 bg-secondary/40 grid gap-5 rounded-xl border p-6 md:grid-cols-[1fr_auto] md:items-center">
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
      className="border-border/60 bg-secondary/40 mx-auto mt-8 flex max-w-6xl items-center gap-3 rounded-xl border p-4"
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

type ChannelSurveyTaskState = {
  status?: string | null;
  rewardType?: string | null;
  rewardCredentialCode?: string | null;
};

type ChannelSurveyFormState = {
  source: string;
  sourceAi: string;
  sourceQuestion: string;
  searchEngine: string;
  searchQuestion: string;
  sourceOther: string;
  role: string;
  roleOther: string;
  platform: string;
  useCases: string[];
};

function getInitialChannelSurveyForm(
  survey?: LegacyPageData['channel_survey']
): ChannelSurveyFormState {
  return {
    source: survey?.source_options?.[0]?.value || '',
    sourceAi: '',
    sourceQuestion: '',
    searchEngine: '',
    searchQuestion: '',
    sourceOther: '',
    role: survey?.role_options?.[0]?.value || '',
    roleOther: '',
    platform: survey?.platform_options?.[0]?.value || '',
    useCases: [],
  };
}

function getCurrentPath(fallback = '/welfare') {
  if (typeof window === 'undefined') return fallback;
  return `${window.location.pathname}${window.location.search}`;
}

function getWelfareEntryPoint(fallback = 'welfare_direct') {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get('entry') || fallback;
}

function getWelfareQueryParam(name: string) {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(name) || '';
}

function getSurveyErrorMessage(
  survey: LegacyPageData['channel_survey'] | undefined,
  error: any,
  fallback: string
) {
  const message = String(error?.message || '').trim();
  return survey?.errors?.[message] || message || fallback;
}

function isEnglishWelfarePage(data: LegacyPageData) {
  return String(data.hero?.eyebrow || '')
    .toLowerCase()
    .includes('welfare');
}

function isEnglishSurvey(survey?: LegacyPageData['channel_survey']) {
  return String(survey?.sign_in_action || '')
    .toLowerCase()
    .includes('sign');
}

function NativeSelect({
  id,
  value,
  onChange,
  options = [],
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {options.map((option) => (
        <option key={`${id}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SurveyQuestionBlock({
  title,
  htmlFor,
  children,
  className,
}: {
  title?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'bg-card/70 rounded-xl border p-4 shadow-sm md:p-5',
        className
      )}
    >
      {title ? (
        <Label htmlFor={htmlFor} className="text-base leading-6 font-semibold">
          {title}
        </Label>
      ) : null}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function isExtendableCredential(credential: UserCredentialSummary) {
  const status = String(credential.status || '').toLowerCase();
  return Boolean(
    credential.id &&
    credential.code &&
    (status === 'active' || status === 'trial')
  );
}

function formatCredentialExpiresAt(value?: string | Date | null) {
  if (!value) return '长期';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '长期';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function ChannelSurveyRewardDialog({
  open,
  onOpenChange,
  survey,
  rewardFlow,
  task,
  credentialsAction,
  onCopyCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: LegacyPageData['channel_survey'];
  rewardFlow?: LegacyPageData['reward_flow'];
  task: ChannelSurveyTaskState | null;
  credentialsAction?: string;
  onCopyCode: (code: string) => void;
}) {
  const english = isEnglishSurvey(survey);

  return (
    <ActivationCodeGuideDialog
      open={open}
      onOpenChange={onOpenChange}
      english={english}
      survey={survey}
      rewardFlow={rewardFlow}
      task={task}
      credentialsAction={credentialsAction}
      onCopyCode={onCopyCode}
    />
  );
}

function BenefitGiftNavItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <SmartIcon name={icon} className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BenefitGiftCard({
  icon,
  title,
  description,
  status,
  giftLabel,
  children,
}: {
  icon: string;
  title?: string;
  description?: string;
  status?: string;
  giftLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="bg-primary/10 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
          <SmartIcon name={icon} className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              <Gift className="mr-1 size-3.5" aria-hidden="true" />
              {giftLabel}
            </Badge>
            {status ? (
              <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                {status}
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-normal md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-3 max-w-4xl text-base leading-7">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}

function ChannelSurveyGift({
  survey,
  rewardFlow,
  credentialsAction,
}: {
  survey: LegacyPageData['channel_survey'];
  rewardFlow?: LegacyPageData['reward_flow'];
  credentialsAction?: string;
}) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const english = isEnglishSurvey(survey);
  const copy = {
    loading: english ? 'Loading reward status...' : '正在加载福利状态...',
    loadFailed: english ? 'Failed to load reward status' : '福利状态加载失败',
    required: english
      ? 'Please complete the required choices and expanded fields first'
      : '请先完成必填选项和已展开的补充信息',
    rewardIssued: english ? 'Reward issued' : '奖励已发放',
    submitFailed: english
      ? 'Submit failed. Please try again later'
      : '提交失败，请稍后重试',
  };
  const [task, setTask] = useState<ChannelSurveyTaskState | null>(null);
  const [credentials, setCredentials] = useState<UserCredentialSummary[]>([]);
  const [form, setForm] = useState<ChannelSurveyFormState>(() =>
    getInitialChannelSurveyForm(survey)
  );
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCredentialOpen, setConfirmCredentialOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedRewardCredentialId, setSelectedRewardCredentialId] =
    useState('');

  const completed = task?.status === 'completed';
  const extendableCredentials = useMemo(
    () => credentials.filter(isExtendableCredential),
    [credentials]
  );
  const hasCredentials = extendableCredentials.length > 0;
  const sourceNeedsAi = form.source === 'ai';
  const sourceNeedsSearch = form.source === 'search';
  const sourceNeedsOther = form.source === 'other';
  const roleNeedsOther = form.role === 'other';

  useEffect(() => {
    setForm((current) => ({
      ...current,
      source: current.source || survey?.source_options?.[0]?.value || '',
      role: current.role || survey?.role_options?.[0]?.value || '',
      platform: current.platform || survey?.platform_options?.[0]?.value || '',
    }));
  }, [survey]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || sessionPending) return;
    if (!session?.user) {
      setTask(null);
      setCredentials([]);
      return;
    }

    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [taskResult, credentialResult] = await Promise.all([
          apiGet<{ task?: ChannelSurveyTaskState | null }>(
            '/api/rewards/channel-survey'
          ),
          apiGet<PageResult<UserCredentialSummary>>(
            '/api/user/get-credentials?page=1&pageSize=100&status=all'
          ),
        ]);
        if (!active) return;

        const rows = (credentialResult?.items || []).filter(
          isExtendableCredential
        );
        setTask(taskResult?.task || null);
        setCredentials(rows);
        setSelectedRewardCredentialId(
          (current) => current || rows[0]?.id || ''
        );
      } catch (error: any) {
        if (active) {
          toast.error(getSurveyErrorMessage(survey, error, copy.loadFailed));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [hydrated, sessionPending, session?.user?.id, survey, copy.loadFailed]);

  function updateForm(patch: Partial<ChannelSurveyFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleUseCase(value: string) {
    setForm((current) => {
      const exists = current.useCases.includes(value);
      return {
        ...current,
        useCases: exists
          ? current.useCases.filter((item) => item !== value)
          : [...current.useCases, value],
      };
    });
  }

  function goToSignIn() {
    router.push(`/sign-in?callbackUrl=${encodeURIComponent(getCurrentPath())}`);
  }

  function validateSurvey() {
    const requiredMessage = survey?.errors?.required || copy.required;

    if (!form.source || !form.role || !form.platform || !form.useCases.length) {
      toast.error(requiredMessage);
      return false;
    }
    if (sourceNeedsAi && (!form.sourceAi || !form.sourceQuestion)) {
      toast.error(requiredMessage);
      return false;
    }
    if (sourceNeedsSearch && (!form.searchEngine || !form.searchQuestion)) {
      toast.error(requiredMessage);
      return false;
    }
    if (sourceNeedsOther && !form.sourceOther) {
      toast.error(requiredMessage);
      return false;
    }
    if (roleNeedsOther && !form.roleOther) {
      toast.error(requiredMessage);
      return false;
    }
    return true;
  }

  function buildAnalyticsContext(entryPoint: string, browserInstallId: string) {
    return {
      source: getWelfareQueryParam('source') || undefined,
      entry: entryPoint,
      installId: getWelfareQueryParam('install_id') || undefined,
      browserInstallId,
      feature: getWelfareQueryParam('feature') || undefined,
      intent: getWelfareQueryParam('intent') || undefined,
      reason: getWelfareQueryParam('reason') || undefined,
      hasCredentials,
      surveySource: form.source,
      surveyRole: form.role,
      surveyPlatform: form.platform,
      surveyUseCases: form.useCases,
    };
  }

  async function grantSurveyReward(rewardCredentialId?: string) {
    const entryPoint = getWelfareEntryPoint();
    const browserInstallId = getBrowserInstallId();
    const analyticsContext = buildAnalyticsContext(
      entryPoint,
      browserInstallId
    );

    recordAnalyticsEventSafe('trial_claim_started', analyticsContext);
    setSubmitting(true);
    try {
      const result = await apiPost<{
        task?: ChannelSurveyTaskState;
        rewardType?: string;
        rewardCredentialCode?: string;
      }>('/api/rewards/channel-survey', {
        surveySource: form.source,
        surveyRole: form.role,
        surveyUseCase: form.useCases.join(','),
        surveyDetail: JSON.stringify({
          platform: form.platform,
          sourceAi: form.sourceAi,
          sourceQuestion: form.sourceQuestion,
          searchEngine: form.searchEngine,
          searchQuestion: form.searchQuestion,
          sourceOther: form.sourceOther,
          roleOther: form.roleOther,
        }),
        rewardCredentialId,
        entryPoint,
        browserInstallId,
        urlSource: getWelfareQueryParam('source') || undefined,
        feature: getWelfareQueryParam('feature') || undefined,
        intent: getWelfareQueryParam('intent') || undefined,
        reason: getWelfareQueryParam('reason') || undefined,
        installId: getWelfareQueryParam('install_id') || undefined,
      });

      const nextTask = result.task || {
        status: 'completed',
        rewardType: result.rewardType,
        rewardCredentialCode: result.rewardCredentialCode,
      };
      setTask(nextTask);
      setConfirmCredentialOpen(false);
      setRewardDialogOpen(true);
      recordAnalyticsEventSafe('trial_claim_success', {
        ...analyticsContext,
        rewardType: result.rewardType || result.task?.rewardType,
        rewardCredentialCode:
          result.rewardCredentialCode || result.task?.rewardCredentialCode,
      });
      toast.success(survey?.success || copy.rewardIssued);
    } catch (error: any) {
      toast.error(getSurveyErrorMessage(survey, error, copy.submitFailed));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSurvey() {
    if (!validateSurvey()) return;
    if (hasCredentials) {
      setSelectedRewardCredentialId(
        (current) => current || extendableCredentials[0]?.id || ''
      );
      setConfirmCredentialOpen(true);
      return;
    }

    await grantSurveyReward();
  }

  async function confirmCredentialReward() {
    if (!selectedRewardCredentialId) {
      toast.error(
        survey?.errors?.reward_credential_required ||
          (english
            ? 'Please choose an activation code to extend'
            : '请选择要延长的激活码')
      );
      return;
    }
    await grantSurveyReward(selectedRewardCredentialId);
  }

  function copyRewardCode(code: string) {
    if (!code) return;
    void navigator.clipboard?.writeText(code);
    toast.success(
      survey?.copy_success ||
        (english ? 'Activation code copied' : '激活码已复制')
    );
  }

  const rewardDialog = (
    <ChannelSurveyRewardDialog
      open={rewardDialogOpen}
      onOpenChange={setRewardDialogOpen}
      survey={survey}
      rewardFlow={rewardFlow}
      task={task}
      credentialsAction={credentialsAction}
      onCopyCode={copyRewardCode}
    />
  );

  const confirmCredentialDialog = (
    <Dialog
      open={confirmCredentialOpen}
      onOpenChange={setConfirmCredentialOpen}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {english
              ? 'Choose Activation Code to Extend'
              : '选择要延长的激活码'}
          </DialogTitle>
          <DialogDescription>
            {english
              ? 'Your account already has activation codes. Please confirm which one should receive this welfare reward.'
              : '当前账号下已有激活码，请确认本次福利奖励要延长到哪一个激活码上。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="welfare-reward-credential">
            {english ? 'Activation code' : '激活码'}
          </Label>
          <NativeSelect
            id="welfare-reward-credential"
            value={selectedRewardCredentialId}
            onChange={setSelectedRewardCredentialId}
            options={extendableCredentials.map((credential) => ({
              value: credential.id || '',
              label: credentialOptionLabel(credential),
            }))}
          />
          {selectedRewardCredentialId ? (
            <div className="text-muted-foreground rounded-lg border p-3 text-sm leading-6">
              {extendableCredentials
                .filter(
                  (credential) => credential.id === selectedRewardCredentialId
                )
                .map((credential) => (
                  <div key={credential.id}>
                    <p className="text-foreground font-semibold">
                      {credential.code}
                    </p>
                    <p>
                      {credentialPlanLabel(credential.planCode)} ·{' '}
                      {english ? 'expires' : '到期'}{' '}
                      {formatCredentialExpiresAt(credential.expiresAt)}
                    </p>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmCredentialOpen(false)}
            disabled={submitting}
          >
            {survey?.reward_credential?.cancel || (english ? 'Cancel' : '取消')}
          </Button>
          <Button
            type="button"
            onClick={() => void confirmCredentialReward()}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {english ? 'Confirm and Claim' : '确认延长并领取奖励'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!hydrated || sessionPending || loading) {
    return (
      <div className="bg-background/70 text-muted-foreground mt-5 flex items-center gap-3 rounded-lg border p-4 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {copy.loading}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="bg-background/70 mt-5 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm leading-6">
          {survey?.sign_in_required}
        </p>
        <Button className="mt-4" onClick={goToSignIn}>
          {survey?.sign_in_action || '登录 / 注册'}
        </Button>
      </div>
    );
  }

  if (completed) {
    const message =
      task?.rewardType === 'paid_extension'
        ? survey?.paid_extension_done
        : survey?.trial_done;
    return (
      <>
        <div className="bg-background/70 mt-5 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="text-primary mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {survey?.success || copy.rewardIssued}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                {message}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4 w-full sm:w-auto"
            onClick={() => setRewardDialogOpen(true)}
          >
            {survey?.view_reward || credentialsAction || '查看奖励'}
          </Button>
        </div>
        {rewardDialog}
      </>
    );
  }

  return (
    <>
      <div className="mt-5 space-y-4">
        <SurveyQuestionBlock
          htmlFor="welfare-source"
          title={
            survey?.fields?.source ||
            (english
              ? 'Where did you hear about MediaClaw?'
              : '你从哪里了解到 MediaClaw？')
          }
          className="md:p-6"
        >
          <NativeSelect
            id="welfare-source"
            value={form.source}
            onChange={(source) => updateForm({ source })}
            options={survey?.source_options}
          />

          {sourceNeedsAi ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welfare-source-ai">
                  {survey?.fields?.source_ai}
                </Label>
                <Input
                  id="welfare-source-ai"
                  value={form.sourceAi}
                  onChange={(event) =>
                    updateForm({ sourceAi: event.target.value })
                  }
                  placeholder={survey?.placeholders?.source_ai}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welfare-source-question">
                  {survey?.fields?.source_question}
                </Label>
                <Input
                  id="welfare-source-question"
                  value={form.sourceQuestion}
                  onChange={(event) =>
                    updateForm({ sourceQuestion: event.target.value })
                  }
                  placeholder={survey?.placeholders?.source_question}
                />
              </div>
            </div>
          ) : null}

          {sourceNeedsSearch ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welfare-search-engine">
                  {survey?.fields?.search_engine}
                </Label>
                <Input
                  id="welfare-search-engine"
                  value={form.searchEngine}
                  onChange={(event) =>
                    updateForm({ searchEngine: event.target.value })
                  }
                  placeholder={survey?.placeholders?.search_engine}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welfare-search-question">
                  {survey?.fields?.search_question}
                </Label>
                <Input
                  id="welfare-search-question"
                  value={form.searchQuestion}
                  onChange={(event) =>
                    updateForm({ searchQuestion: event.target.value })
                  }
                  placeholder={survey?.placeholders?.search_question}
                />
              </div>
            </div>
          ) : null}

          {sourceNeedsOther ? (
            <div className="space-y-2">
              <Label htmlFor="welfare-source-other">
                {survey?.fields?.source_other}
              </Label>
              <Input
                id="welfare-source-other"
                value={form.sourceOther}
                onChange={(event) =>
                  updateForm({ sourceOther: event.target.value })
                }
                placeholder={survey?.placeholders?.source_other}
              />
            </div>
          ) : null}
        </SurveyQuestionBlock>

        <div className="grid gap-4 lg:grid-cols-2">
          <SurveyQuestionBlock
            htmlFor="welfare-role"
            title={
              survey?.fields?.role ||
              (english ? 'What best describes you?' : '你的身份是？')
            }
          >
            <NativeSelect
              id="welfare-role"
              value={form.role}
              onChange={(role) => updateForm({ role })}
              options={survey?.role_options}
            />
            {roleNeedsOther ? (
              <div className="space-y-2">
                <Label htmlFor="welfare-role-other">
                  {survey?.fields?.role_other}
                </Label>
                <Input
                  id="welfare-role-other"
                  value={form.roleOther}
                  onChange={(event) =>
                    updateForm({ roleOther: event.target.value })
                  }
                  placeholder={survey?.placeholders?.role_other}
                />
              </div>
            ) : null}
          </SurveyQuestionBlock>

          <SurveyQuestionBlock
            htmlFor="welfare-platform"
            title={
              survey?.fields?.platform ||
              (english ? 'Core operating platform' : '核心运营平台')
            }
          >
            <NativeSelect
              id="welfare-platform"
              value={form.platform}
              onChange={(platform) => updateForm({ platform })}
              options={survey?.platform_options}
            />
          </SurveyQuestionBlock>
        </div>

        <SurveyQuestionBlock title={survey?.fields?.use_case}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(survey?.use_case_options || []).map((item) => {
              const checked = form.useCases.includes(item.value);
              return (
                <label
                  key={item.value}
                  className={cn(
                    'hover:bg-muted/60 flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors',
                    checked && 'border-primary bg-primary/5'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUseCase(item.value)}
                    className="accent-primary mt-1 size-4 shrink-0"
                  />
                  <span>
                    <span className="font-medium">{item.label}</span>
                    {item.capabilities?.length ? (
                      <span className="text-muted-foreground mt-1 block text-xs leading-5">
                        {item.capabilities.join(' / ')}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </SurveyQuestionBlock>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="text-muted-foreground max-w-3xl text-sm leading-6">
            {survey?.auto_reward_note ||
              (english
                ? 'When you submit, MediaClaw checks your account: no activation code creates a trial code; existing activation codes require your confirmation.'
                : '提交后系统会检测当前账号：没有激活码则直接生成新的试用码；已有激活码会先让你确认要延长哪一个。')}
          </p>
          <Button onClick={submitSurvey} disabled={submitting}>
            {submitting ? (
              <Loader2
                className="mr-2 size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {survey?.submit}
          </Button>
        </div>
      </div>
      {confirmCredentialDialog}
      {rewardDialog}
    </>
  );
}

function BusinessDictionaryPage({ data }: { data: LegacyPageData }) {
  const survey = data.channel_survey;
  const feedback = data.experience_feedback;
  const english = isEnglishWelfarePage(data);
  const giftLabel = english ? 'Welfare gift' : '福利礼物';

  return (
    <section className="bg-background text-foreground px-6 pt-24 pb-10 md:pt-24 md:pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl lg:ml-72">
          {data.hero?.eyebrow ? (
            <p className="text-primary text-sm font-semibold">
              {data.hero.eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            {data.hero?.title || data.metadata?.title}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-4xl text-lg leading-8">
            {data.hero?.description || data.metadata?.description}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[17rem_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold">
                  {english ? 'Welfare gifts' : '福利礼物'}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  {english
                    ? 'Choose the reward that matches your current state.'
                    : '选择适合当前状态的奖励领取。'}
                </p>
              </div>
              {survey ? (
                <BenefitGiftNavItem
                  icon="ClipboardCheck"
                  title={survey.title}
                  description={survey.description}
                />
              ) : null}
              {feedback ? (
                <BenefitGiftNavItem
                  icon="MessageSquareText"
                  title={feedback.title}
                  description={feedback.description}
                />
              ) : null}
            </div>

            {data.partner_promo?.title || data.partner_promo?.banner_title ? (
              <Link
                href="/referral"
                className="border-primary/25 bg-primary/5 text-card-foreground hover:bg-primary/10 block rounded-lg border p-5 transition-colors"
              >
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
                  <Gift className="size-5" aria-hidden="true" />
                </div>
                <p className="text-primary mt-4 text-sm font-semibold">
                  {data.partner_promo.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  {data.partner_promo.title || data.partner_promo.banner_title}
                </h2>
                <div className="text-muted-foreground mt-4 space-y-2 text-sm leading-6">
                  {data.partner_promo.you ? (
                    <p>{data.partner_promo.you}</p>
                  ) : null}
                  {data.partner_promo.friend ? (
                    <p>{data.partner_promo.friend}</p>
                  ) : null}
                </div>
                <span className="bg-primary text-primary-foreground mt-5 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold">
                  {data.partner_promo.action ||
                    data.partner_promo.banner_action}
                </span>
              </Link>
            ) : null}
          </aside>

          <div className="space-y-6">
            {survey ? (
              <div id="welfare-reward-channel-survey">
                <BenefitGiftCard
                  icon="ClipboardCheck"
                  title={survey.title}
                  description={survey.description}
                  status={survey.status?.available}
                  giftLabel={giftLabel}
                >
                  <ChannelSurveyGift
                    survey={survey}
                    rewardFlow={data.reward_flow}
                    credentialsAction={
                      data.reward_flow?.credentials_action ||
                      data.hero?.secondary_action
                    }
                  />
                </BenefitGiftCard>
              </div>
            ) : null}

            {feedback ? (
              <BenefitGiftCard
                icon="MessageSquareText"
                title={feedback.title}
                description={feedback.description}
                status={
                  feedback.status?.plugin_required || feedback.status?.available
                }
                giftLabel={giftLabel}
              >
                <div className="border-border mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                  <div className="border-primary/30 bg-primary/5 rounded-md border px-4 py-3">
                    <span className="text-muted-foreground text-sm">
                      {feedback.reward_label}
                    </span>
                    <span className="text-primary ml-2 font-bold">
                      {feedback.reward_value}
                    </span>
                  </div>
                  <Link
                    href="/download"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-bold"
                  >
                    {feedback.download_plugin ||
                      data.reward_flow?.download_action}
                  </Link>
                </div>
              </BenefitGiftCard>
            ) : null}
          </div>
        </div>
      </div>
    </section>
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
  onSample: (button: LegacyButton) => void,
  fallbackPoster?: string
) {
  const block = section.block || section.id;

  switch (block) {
    case 'page-hero':
      return (
        <CompactPageHero
          section={section}
          onVideo={onVideo}
          onSample={onSample}
          fallbackPoster={fallbackPoster}
        />
      );
    case 'hero':
      return (
        <PageHero
          section={section}
          onVideo={onVideo}
          onSample={onSample}
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
    case 'sample-preview':
      return (
        <SamplePreviewBlock section={section} fallbackPoster={fallbackPoster} />
      );
    case 'output-options':
      return <OutputOptionsBlock section={section} />;
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
    case 'testimonial-wall':
      return <TestimonialWallBlock section={section} />;
    case 'cta':
      return (
        <CtaBlock section={section} onVideo={onVideo} onSample={onSample} />
      );
    default:
      return <GenericSection section={section} />;
  }
}

export function LegacyDynamicPage({ data }: { data: LegacyPageData }) {
  const [videoConfig, setVideoConfig] = useState<DemoVideoConfig | null>(null);
  const [sampleConfig, setSampleConfig] = useState<LegacyButton | null>(null);
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
              const localizedSection = data.messages
                ? { ...section, messages: data.messages }
                : section;
              return (
                <div key={key}>
                  {renderSection(
                    localizedSection,
                    (button) =>
                      setVideoConfig(
                        resolveDemoVideoConfig(
                          localizedSection,
                          button,
                          fallbackPoster
                        )
                      ),
                    setSampleConfig,
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

      <Dialog
        open={Boolean(sampleConfig)}
        onOpenChange={(open) => {
          if (!open) setSampleConfig(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="border-border/60 bg-card/95 w-[min(96vw,1280px)] max-w-[min(96vw,1280px)] overflow-visible p-0 sm:max-w-[min(96vw,1280px)]"
        >
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="border-border/70 bg-background/95 text-muted-foreground hover:bg-accent hover:text-foreground absolute top-2 right-2 z-20 border shadow-lg backdrop-blur sm:-top-3 sm:-right-3"
              />
            }
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">关闭</span>
          </DialogClose>
          {sampleConfig ? (
            <SampleDataDialogContent sample={sampleConfig} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
