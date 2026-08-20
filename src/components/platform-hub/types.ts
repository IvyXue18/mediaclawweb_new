export type HubIconName =
  | 'audio'
  | 'bot'
  | 'database'
  | 'download'
  | 'imageText'
  | 'keywords'
  | 'leads'
  | 'messages'
  | 'monitoring'
  | 'reports'
  | 'sparkles'
  | 'table'
  | 'trending'
  | 'users'
  | 'workflow';

export type PlatformHubImage = {
  src: string;
  width: number;
  height: number;
  position?: string;
};

export type PlatformHubFeature = {
  id: string;
  title: string;
  description: string;
  href?: string;
  icon: HubIconName;
  badge?: string;
  proof?: string;
  actionLabel?: string;
  /** Overrides the shared per-feature-id thumbnail (see featureImages in hub-feature-directory.tsx) when a platform needs its own screenshot. */
  image?: PlatformHubImage;
};

export type PlatformHubScene = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: HubIconName;
  featureIds: string[];
};

export type PlatformHubWorkflow = {
  id: string;
  label: string;
  title: string;
  description: string;
  steps: string[];
  statusLabel?: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export type PlatformHubFaq = {
  question: string;
  answer: string;
};

export type PlatformHubContent = {
  locale: 'zh' | 'en';
  /** Display name, e.g. 小红书. */
  platform: string;
  /** Stable slug used as the `platform` property on every hub analytics event. */
  platformSlug: 'xiaohongshu' | 'douyin';
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  breadcrumbs: {
    home: string;
    current: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    /** Exact substring of `title` (and of the matching mobileTitleLines entry) to render in the brand accent color — typically the platform name. */
    titleHighlight?: string;
    mobileTitleLines?: string[];
    description: string;
    primaryAction: string;
    primaryHref: string;
    secondaryAction: string;
    secondaryHref: string;
    microcopy: string;
    /** Overrides the default (Xiaohongshu) foreground extension-panel screenshot for platforms with their own capture. */
    image?: Pick<PlatformHubImage, 'src' | 'width' | 'height'>;
  };
  scenes: PlatformHubScene[];
  workflowSection: {
    eyebrow: string;
    title: string;
    description: string;
    stepLabel: string;
  };
  workflows: PlatformHubWorkflow[];
  directorySection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  features: PlatformHubFeature[];
  faqSection: {
    eyebrow: string;
    title: string;
  };
  faqs: PlatformHubFaq[];
  /** Secondary pointer to the other platform hub; must not compete with the primary CTA. */
  crossPlatform: {
    title: string;
    description: string;
    actionLabel: string;
    href: string;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
  };
};
