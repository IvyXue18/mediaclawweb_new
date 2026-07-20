import { useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  Chrome,
  Copy,
  Download,
  ExternalLink,
  Globe,
  KeyRound,
  MessageCircle,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ActivationCodeGuideFlow = {
  success_modal?: {
    title?: string;
    extension_title?: string;
    subtitle?: string;
    code_label?: string;
    action?: string;
  };
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
    image?: string;
    image_alt?: string;
  };
  next_step?: {
    title?: string;
    description?: string;
  };
};

export type ActivationCodeGuideTask = {
  rewardType?: string | null;
  rewardCredentialCode?: string | null;
};

export type ActivationCodeGuideSurveyCopy = {
  trial_done?: string;
  paid_extension_done?: string;
  view_reward?: string;
};

export type ActivationCodeGuideContact = {
  action: string;
  title: string;
  description: string;
  qrImage: string;
  qrAlt: string;
  note: string;
  close: string;
};

const guideIconMap: Record<string, LucideIcon> = {
  Chrome,
  Download,
  Globe,
};

function SmartIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <CheckCircle2 className={className} aria-hidden="true" />;

  const Icon = guideIconMap[name];
  if (!Icon) return <CheckCircle2 className={className} aria-hidden="true" />;

  return <Icon className={className} aria-hidden="true" />;
}

export function ActivationCodeGuideSteps({
  english,
  rewardFlow,
  isExtension,
  contact,
  onContactClick,
  className,
}: {
  english?: boolean;
  rewardFlow?: ActivationCodeGuideFlow;
  isExtension?: boolean;
  contact?: ActivationCodeGuideContact;
  onContactClick?: () => void;
  className?: string;
}) {
  const isEnglish = Boolean(english);
  const install = rewardFlow?.install;
  const installTitle =
    install?.title ||
    (isEnglish ? 'Install or open MediaClaw' : '安装或打开 MediaClaw');
  const installDescription =
    install?.description ||
    (isEnglish
      ? 'Already installed? Just open the extension and skip this step.'
      : '已安装的话，直接打开插件即可跳过这一步。');
  const installChannels = install?.channels?.length
    ? install.channels
    : [
        {
          label: isEnglish ? 'Chrome Web Store' : 'Chrome 商店',
          url: `https://chromewebstore.google.com/detail/mediaclaw/ihclbgfnkclacfkbedkdnbpmkcdaccje?authuser=0&hl=${
            isEnglish ? 'en-GB' : 'zh-CN'
          }`,
          icon: 'Chrome',
          external: true,
        },
        {
          label: isEnglish ? 'Edge Add-ons' : 'Edge 商店',
          url: 'https://microsoftedge.microsoft.com/addons/detail/mediaclaw-%E7%A4%BE%E5%AA%92%E8%99%BE%EF%BD%9C%E5%B0%8F%E7%BA%A2%E4%B9%A6%E6%8A%96%E9%9F%B3ai%E8%BF%90%E8%90%A5%E5%B7%A5/moalagonhjmhmoiaehciejkkingpajpl',
          icon: 'Globe',
          external: true,
        },
        {
          label: isEnglish ? 'Offline package (.crx)' : '离线安装包 (.crx)',
          url: '/downloads/mediaclaw.crx',
          icon: 'Download',
        },
      ];
  const guide = rewardFlow?.guide;
  const guideTitle =
    guide?.title ||
    (isEnglish ? 'Paste the code and verify' : '粘贴激活码并验证');
  const guideDescription = [
    guide?.description ||
      (isEnglish
        ? 'Open the top-right menu in the extension -> System Settings -> paste the code into Product Authorization -> click Verify and Bind.'
        : '打开插件右上角菜单 ->「系统配置」-> 在「产品授权」粘贴激活码 -> 点击「验证并绑定」。'),
    isExtension
      ? isEnglish
        ? 'If this code is already bound, re-verifying refreshes the benefits.'
        : '该激活码已绑定过的话，重新验证即可刷新权益。'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const guideImage = guide?.image || '/imgs/features/activcode.png';
  const guideImageAlt =
    guide?.image_alt ||
    (isEnglish
      ? 'MediaClaw activation code and system settings guide'
      : 'MediaClaw 激活码输入与系统配置引导');
  const nextTitle =
    rewardFlow?.next_step?.title || (isEnglish ? 'Start using it' : '开始使用');
  const nextDescription =
    rewardFlow?.next_step?.description ||
    (isEnglish
      ? 'Back in MediaClaw, complete one high-value task: scrape a search result, extract a transcript, or sync data to Feishu.'
      : '回到 MediaClaw 完成一个高价值动作：采集搜索结果、提取逐字稿，或同步到飞书。');

  const steps: Array<{
    title: string;
    description: string;
    content?: ReactNode;
  }> = [
    {
      title: installTitle,
      description: installDescription,
      content: (
        <div className="mt-2.5">
          <div className="flex flex-wrap gap-2">
            {installChannels.map((channel) => (
              <a
                key={channel.url}
                href={channel.url}
                target={channel.external ? '_blank' : undefined}
                rel={channel.external ? 'noreferrer' : undefined}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-8 gap-1.5 px-3 text-xs'
                )}
              >
                <SmartIcon
                  name={channel.icon || 'Download'}
                  className="size-3.5"
                />
                {channel.label}
                {channel.external ? (
                  <ExternalLink
                    className="text-muted-foreground size-3"
                    aria-hidden="true"
                  />
                ) : null}
              </a>
            ))}
          </div>
          {contact && onContactClick ? (
            <button
              type="button"
              onClick={onContactClick}
              className="text-primary hover:text-primary/80 mt-2.5 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium underline underline-offset-4 transition-colors"
              data-activation-contact-trigger
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {contact.action}
            </button>
          ) : null}
        </div>
      ),
    },
    {
      title: guideTitle,
      description: guideDescription,
      content: (
        <a
          href={guideImage}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block"
        >
          <img
            src={guideImage}
            alt={guideImageAlt}
            loading="lazy"
            className="bg-muted/40 w-full rounded-lg border"
          />
        </a>
      ),
    },
    {
      title: nextTitle,
      description: nextDescription,
    },
  ];

  return (
    <ol className={className}>
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex gap-3 pb-4 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span
                className="bg-border mt-1.5 w-px flex-1"
                aria-hidden="true"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm leading-6 font-semibold">
              {step.title}
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm leading-6">
              {step.description}
            </p>
            {step.content}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActivationCodeContactDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: ActivationCodeGuideContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-[560px]"
        showCloseButton={false}
        data-activation-contact-dialog
      >
        <div className="from-primary/60 via-primary to-primary/60 h-1.5 w-full bg-gradient-to-r" />

        <div className="relative space-y-5 p-5 sm:p-6">
          <button
            type="button"
            aria-label={contact.close}
            onClick={() => onOpenChange(false)}
            className="border-border/60 bg-background/90 text-muted-foreground hover:text-foreground absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-md border transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <DialogHeader className="flex-row items-start gap-3 pr-10">
            <div className="bg-primary/10 text-primary rounded-full p-2.5">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold">
                {contact.title}
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                {contact.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="bg-card rounded-xl border p-3 sm:p-4">
            <div className="bg-muted/30 rounded-lg border p-2 sm:p-3">
              <img
                src={contact.qrImage}
                alt={contact.qrAlt}
                className="mx-auto max-h-[55vh] w-full rounded-md object-contain"
                data-activation-contact-qr
              />
            </div>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            {contact.note}
          </p>

          <div className="flex justify-end">
            <Button type="button" onClick={() => onOpenChange(false)}>
              {contact.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActivationCodeGuideDialog({
  open,
  onOpenChange,
  english,
  survey,
  rewardFlow,
  task,
  credentialsAction,
  title: titleOverride,
  description: descriptionOverride,
  contact,
  onCopyCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  english?: boolean;
  survey?: ActivationCodeGuideSurveyCopy;
  rewardFlow?: ActivationCodeGuideFlow;
  task: ActivationCodeGuideTask | null;
  credentialsAction?: string;
  title?: string;
  description?: string;
  contact?: ActivationCodeGuideContact;
  onCopyCode: (code: string) => void;
}) {
  const [contactOpen, setContactOpen] = useState(false);
  const code = task?.rewardCredentialCode || '';
  const isEnglish = Boolean(english);
  const isExtension = task?.rewardType === 'paid_extension';
  const modalCopy = rewardFlow?.success_modal;
  const title =
    titleOverride ||
    (isExtension
      ? modalCopy?.extension_title ||
        (isEnglish ? 'Benefits Extended' : '权益已延长')
      : modalCopy?.title || (isEnglish ? 'Reward Claimed' : '领取成功'));
  const description =
    descriptionOverride ||
    (isExtension
      ? survey?.paid_extension_done ||
        (isEnglish
          ? 'The selected activation code has received the reward. Re-verify it in the extension to refresh benefits.'
          : '所选激活码已获得福利奖励。回到插件重新验证后即可刷新权益。')
      : survey?.trial_done ||
        (isEnglish
          ? 'Copy the activation code, then enter and verify it in the extension settings.'
          : '请复制激活码，然后回到插件设置页输入并验证。'));
  const codeLabel =
    modalCopy?.code_label || (isEnglish ? 'Activation Code' : '激活码');
  const credentialsLabel =
    modalCopy?.action ||
    survey?.view_reward ||
    credentialsAction ||
    (isEnglish ? 'View My Activation Codes' : '查看我的激活码');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] gap-3 overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="items-start text-left">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="border-primary/30 bg-primary/5 rounded-xl border px-4 py-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide">
              {codeLabel}
            </p>
            <div className="mt-1 flex items-center gap-3">
              <code className="text-primary min-w-0 flex-1 text-lg font-bold tracking-[0.14em] break-all sm:text-xl">
                {code || '-'}
              </code>
              {code ? (
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => onCopyCode(code)}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  {isEnglish ? 'Copy' : '复制'}
                </Button>
              ) : null}
            </div>
          </div>

          <ActivationCodeGuideSteps
            english={isEnglish}
            rewardFlow={rewardFlow}
            isExtension={isExtension}
            contact={contact}
            onContactClick={() => setContactOpen(true)}
          />

          <DialogFooter>
            <Link
              href="/settings/credentials"
              className={cn(buttonVariants(), 'w-full sm:w-auto')}
            >
              <KeyRound className="size-4" aria-hidden="true" />
              {credentialsLabel}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contact ? (
        <ActivationCodeContactDialog
          contact={contact}
          open={contactOpen}
          onOpenChange={setContactOpen}
        />
      ) : null}
    </>
  );
}
