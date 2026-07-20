import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@/core/auth/client';
import { Link } from '@/core/i18n/navigation';
import { apiGet, apiPost } from '@/lib/api-client';
import { recordAnalyticsEventSafe } from '@/lib/client-analytics';
import { Footer } from '@/blocks/footer';
import { Header } from '@/blocks/header';
import {
  ActivationCodeContactDialog,
  ActivationCodeGuideSteps,
  type ActivationCodeGuideContact,
  type ActivationCodeGuideFlow,
} from '@/components/activation-code-guide-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import zhWelfarePage from '@/content/legacy-pages/zh/welfare.json';

export type ClaimSearch = {
  order_no?: string;
  preview?: string;
};

type ClaimInfo = {
  orderNo: string;
  orderStatus: string;
  checkoutUrl?: string | null;
  credentialSyncStatus?: string | null;
  credential: {
    credentialId: string;
    code: string;
    expiresAt: string | null;
    status: string | null;
  } | null;
  surveyCompleted: boolean;
};
type StarterProduct = {
  enabled?: boolean;
  priceInCents: number;
  durationDays: number;
  credits: number;
  surveyEnabled?: boolean;
  surveyBonusDays?: number;
};

type SurveyRewardResult = {
  rewardCredentialExpiresAt?: string | null;
};

const SURVEY = (zhWelfarePage as any).channel_survey || {};
const REWARD_FLOW = (zhWelfarePage as any)
  .reward_flow as ActivationCodeGuideFlow;
const INSTALL_SUPPORT: ActivationCodeGuideContact = {
  action: '下载安装遇到问题？扫码答疑',
  title: '扫码获取 MediaClaw 专属支持',
  description:
    '我们将为你提供插件下载激活答疑，持续提供版本更新、功能上新与实战用法交流支持。',
  qrImage: '/wechat.png',
  qrAlt: 'MediaClaw 专属支持微信二维码',
  note: '请使用微信扫码添加，备注「已购买」',
  close: '知道了',
};

export const Route = createFileRoute('/welfare_/claim')({
  validateSearch: (search: Record<string, unknown>): ClaimSearch => ({
    order_no: typeof search.order_no === 'string' ? search.order_no : undefined,
    preview: typeof search.preview === 'string' ? search.preview : undefined,
  }),
  component: StarterClaimPage,
});

function formatExpires(expiresAt: string | null) {
  if (!expiresAt) return '';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

function StarterClaimPage() {
  const { order_no: orderNo, preview } = Route.useSearch();
  const { data: session, isPending: sessionPending } = useSession();
  const previewingSurvey = import.meta.env.DEV && preview === 'survey';

  const [info, setInfo] = useState<ClaimInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [surveyDone, setSurveyDone] = useState(false);
  const [surveySkipped, setSurveySkipped] = useState(false);
  const [rewardExpiresAt, setRewardExpiresAt] = useState<string | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [product, setProduct] = useState<StarterProduct>({
    priceInCents: 900,
    durationDays: 5,
    credits: 50,
  });

  useEffect(() => {
    void apiGet<StarterProduct>('/api/starter/product')
      .then(setProduct)
      .catch(() => {});
  }, []);

  const claimUrl = useMemo(() => {
    const query = orderNo ? `?order_no=${encodeURIComponent(orderNo)}` : '';
    return `/api/starter/claim-info${query}`;
  }, [orderNo]);

  useEffect(() => {
    if (previewingSurvey) return;
    if (sessionPending) return;
    if (!session?.user) return;

    let stopped = false;
    let attempts = 0;

    const load = async () => {
      try {
        const data = await apiGet<ClaimInfo>(claimUrl);
        if (stopped) return;
        setInfo(data);
        setLoadError('');
        if (data.surveyCompleted) setSurveyDone(true);
        // 码未发放前轮询（支付回调/webhook 幂等发码，最长等 90 秒）。
        if (
          !data.credential &&
          ['created', 'pending', 'paid'].includes(data.orderStatus) &&
          attempts < 36
        ) {
          attempts += 1;
          window.setTimeout(load, 2500);
        }
      } catch (error: any) {
        if (stopped) return;
        setLoadError(error?.message || '加载失败，请刷新重试');
      }
    };

    void load();
    return () => {
      stopped = true;
    };
  }, [claimUrl, previewingSurvey, session?.user, sessionPending]);

  if (!previewingSurvey && !sessionPending && !session?.user) {
    return (
      <PageShell>
        <div className="mx-auto max-w-xl py-24 text-center">
          <p className="text-muted-foreground">请先登录后查看你的全能卡</p>
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(
              `/welfare/claim${orderNo ? `?order_no=${orderNo}` : ''}`
            )}`}
            className="text-primary mt-4 inline-block font-semibold underline-offset-4 hover:underline"
          >
            登录 / 注册
          </Link>
        </div>
      </PageShell>
    );
  }

  const paid = previewingSurvey || info?.orderStatus === 'paid';
  const failed = info?.orderStatus === 'failed';
  const credential = previewingSurvey
    ? {
        credentialId: 'preview-starter-credential',
        code: 'MC-PREVIEW-2026',
        expiresAt: new Date(
          Date.now() + product.durationDays * 24 * 60 * 60 * 1000
        ).toISOString(),
        status: 'active',
      }
    : info?.credential || null;
  const displayedCredential = credential
    ? {
        ...credential,
        expiresAt: rewardExpiresAt || credential.expiresAt,
      }
    : null;
  const showSurvey =
    product.surveyEnabled !== false &&
    paid &&
    credential &&
    !surveyDone &&
    !surveySkipped &&
    !info?.surveyCompleted;

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-16 md:py-20">
        {previewingSurvey ? (
          <div className="border-primary/30 bg-primary/5 text-primary mb-6 rounded-xl border px-4 py-3 text-center text-sm font-semibold">
            开发预览模式：以下内容模拟支付成功，不会创建订单或发放权益
          </div>
        ) : null}
        <div className="text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
            {paid ? (
              <CheckCircle2 className="size-7" />
            ) : failed ? (
              <Clock3 className="size-7" />
            ) : (
              <LoaderCircle className="size-7 animate-spin" />
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {paid
              ? '支付成功 🎉'
              : failed
                ? '原支付订单已失效'
                : '正在确认支付结果…'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {paid
              ? credential
                ? '你的全能卡已就绪'
                : '激活码生成中，通常几秒内完成…'
              : failed
                ? '你可以返回福利页重新生成支付订单。'
                : '如果你已完成支付，请稍候，页面会自动刷新状态。'}
          </p>
          {loadError ? (
            <p className="text-destructive mt-2 text-sm">{loadError}</p>
          ) : null}
          {!paid && info?.checkoutUrl ? (
            <Button
              className="mt-5"
              onClick={() => {
                window.location.href = info.checkoutUrl!;
              }}
            >
              继续支付原订单
            </Button>
          ) : null}
          {!paid && info?.orderStatus === 'failed' ? (
            <div className="mt-5">
              <Link
                href="/welfare"
                className="bg-primary text-primary-foreground inline-flex rounded-md px-4 py-2 font-semibold"
              >
                重新发起支付
              </Link>
            </div>
          ) : null}
        </div>

        {showSurvey && displayedCredential ? (
          <StarterSurveyCard
            credentialId={displayedCredential.credentialId}
            product={product}
            preview={previewingSurvey}
            onDone={(nextExpiresAt) => {
              const currentExpiresAt = displayedCredential.expiresAt;
              if (nextExpiresAt) {
                setRewardExpiresAt(nextExpiresAt);
              } else if (currentExpiresAt) {
                const optimisticExpiresAt = new Date(currentExpiresAt);
                if (!Number.isNaN(optimisticExpiresAt.getTime())) {
                  optimisticExpiresAt.setDate(
                    optimisticExpiresAt.getDate() +
                      (product.surveyBonusDays ?? 2)
                  );
                  setRewardExpiresAt(optimisticExpiresAt.toISOString());
                }
              }
              setSurveyDone(true);
              toast.success(`已加时 ${product.surveyBonusDays ?? 2} 天！`);
            }}
            onSkip={() => {
              setSurveySkipped(true);
              recordAnalyticsEventSafe('trial_survey_skip', {
                orderNo: info?.orderNo,
              });
            }}
          />
        ) : null}

        {displayedCredential ? (
          <div className="border-border bg-card/60 mt-8 rounded-2xl border p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              <h2 className="text-lg font-bold">你的激活码</h2>
              {surveyDone ? (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                  已加时 +{product.surveyBonusDays ?? 2} 天
                </span>
              ) : null}
            </div>
            <div className="border-primary/30 bg-primary/5 mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
              <code className="text-foreground text-lg font-bold tracking-wider">
                {displayedCredential.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      displayedCredential.code
                    );
                    toast.success('已复制激活码');
                  } catch {
                    toast.error('复制失败，请手动复制');
                  }
                }}
              >
                <Copy className="mr-1 size-4" />
                复制
              </Button>
            </div>
            {displayedCredential.expiresAt ? (
              <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
                <Clock3 className="size-4" />
                有效期至 {formatExpires(displayedCredential.expiresAt)}
              </p>
            ) : null}
            <div className="border-border mt-6 border-t pt-6">
              <h3 className="text-base font-bold">
                拿到激活码后，按这 3 步完成激活
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                激活码需要在 MediaClaw
                插件里验证绑定后才会生效，跟着下面一步一步操作即可。
              </p>
              <ActivationCodeGuideSteps
                rewardFlow={REWARD_FLOW}
                contact={INSTALL_SUPPORT}
                onContactClick={() => setSupportOpen(true)}
                className="mt-5"
              />
              <Link
                href="/settings/credentials"
                className="text-primary mt-5 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
              >
                查看我的激活码
              </Link>
            </div>
          </div>
        ) : null}
        <ActivationCodeContactDialog
          contact={INSTALL_SUPPORT}
          open={supportOpen}
          onOpenChange={setSupportOpen}
        />
      </div>
    </PageShell>
  );
}

function StarterSurveyCard({
  credentialId,
  product,
  preview,
  onDone,
  onSkip,
}: {
  credentialId: string;
  product: StarterProduct;
  preview?: boolean;
  onDone: (expiresAt?: string | null) => void;
  onSkip: () => void;
}) {
  const sourceOptions: Array<{ label: string; value: string }> =
    SURVEY.source_options || [];
  const roleOptions: Array<{ label: string; value: string }> =
    SURVEY.role_options || [];
  const useCaseOptions: Array<{ label: string; value: string }> =
    SURVEY.use_case_options || [];

  const [source, setSource] = useState('');
  const [sourceAi, setSourceAi] = useState('');
  const [sourceQuestion, setSourceQuestion] = useState('');
  const [searchEngine, setSearchEngine] = useState('');
  const [searchQuestion, setSearchQuestion] = useState('');
  const [sourceOther, setSourceOther] = useState('');
  const [role, setRole] = useState('');
  const [roleOther, setRoleOther] = useState('');
  const [useCases, setUseCases] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const missingExpandedField =
      (source === 'ai' && (!sourceAi.trim() || !sourceQuestion.trim())) ||
      (source === 'search' &&
        (!searchEngine.trim() || !searchQuestion.trim())) ||
      (source === 'other' && !sourceOther.trim()) ||
      (role === 'other' && !roleOther.trim());
    if (!source || !role || useCases.length === 0 || missingExpandedField) {
      toast.error('请完成三个问题和已展开的补充信息');
      return;
    }
    setSubmitting(true);
    try {
      let rewardExpiresAt: string | null | undefined;
      if (!preview) {
        const result = await apiPost<SurveyRewardResult>(
          '/api/rewards/channel-survey',
          {
            surveySource: source,
            surveyRole: role,
            surveyUseCase: useCases.join(','),
            surveyDetail: JSON.stringify({
              sourceAi: sourceAi.trim(),
              sourceQuestion: sourceQuestion.trim(),
              searchEngine: searchEngine.trim(),
              searchQuestion: searchQuestion.trim(),
              sourceOther: sourceOther.trim(),
              roleOther: roleOther.trim(),
            }),
            rewardCredentialId: credentialId,
            entryPoint: 'starter_claim',
          }
        );
        rewardExpiresAt = result.rewardCredentialExpiresAt;
      }
      onDone(rewardExpiresAt);
    } catch (error: any) {
      toast.error(error?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-primary/40 bg-primary/5 mt-8 rounded-2xl border p-6">
      <div className="flex items-center gap-2">
        <Gift className="text-primary size-5" />
        <h2 className="text-lg font-bold">最后一步：30 秒问卷，领取额外时长</h2>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">
        完成渠道问卷，在 {product.durationDays} 天基础上增加{' '}
        {product.surveyBonusDays ?? 2} 天。
      </p>

      <div className="mt-5 space-y-5">
        <SurveyOptionGroup
          title={SURVEY.fields?.source || '你从哪里了解到 MediaClaw？'}
          options={sourceOptions}
          selected={source ? [source] : []}
          onToggle={(value) => setSource(value)}
        />
        {source === 'ai' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SurveyTextField
              id="starter-survey-source-ai"
              label={SURVEY.fields?.source_ai || '是哪个 AI？'}
              placeholder={SURVEY.placeholders?.source_ai}
              value={sourceAi}
              onChange={setSourceAi}
            />
            <SurveyTextField
              id="starter-survey-source-question"
              label={SURVEY.fields?.source_question || '你问了什么问题？'}
              placeholder={SURVEY.placeholders?.source_question}
              value={sourceQuestion}
              onChange={setSourceQuestion}
            />
          </div>
        ) : null}
        {source === 'search' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <SurveyTextField
              id="starter-survey-search-engine"
              label={SURVEY.fields?.search_engine || '是哪个搜索引擎？'}
              placeholder={SURVEY.placeholders?.search_engine}
              value={searchEngine}
              onChange={setSearchEngine}
            />
            <SurveyTextField
              id="starter-survey-search-question"
              label={SURVEY.fields?.search_question || '你搜索了什么问题？'}
              placeholder={SURVEY.placeholders?.search_question}
              value={searchQuestion}
              onChange={setSearchQuestion}
            />
          </div>
        ) : null}
        {source === 'other' ? (
          <SurveyTextField
            id="starter-survey-source-other"
            label={SURVEY.fields?.source_other || '请补充来源'}
            placeholder={SURVEY.placeholders?.source_other}
            value={sourceOther}
            onChange={setSourceOther}
          />
        ) : null}
        <SurveyOptionGroup
          title={SURVEY.fields?.role || '你的身份是？'}
          options={roleOptions}
          selected={role ? [role] : []}
          onToggle={(value) => setRole(value)}
        />
        {role === 'other' ? (
          <SurveyTextField
            id="starter-survey-role-other"
            label={SURVEY.fields?.role_other || '请补充你的身份'}
            placeholder={SURVEY.placeholders?.role_other}
            value={roleOther}
            onChange={setRoleOther}
          />
        ) : null}
        <SurveyOptionGroup
          title={SURVEY.fields?.use_case || '你最想先用 MediaClaw 做什么？'}
          options={useCaseOptions}
          selected={useCases}
          onToggle={(value) =>
            setUseCases((prev) =>
              prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
            )
          }
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : null}
          提交，再领{product.surveyBonusDays ?? 2} 天会员
        </Button>
        <button
          type="button"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          onClick={onSkip}
        >
          跳过
        </button>
      </div>
    </div>
  );
}

function SurveyTextField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SurveyOptionGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Array<{ label: string; value: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={
                active
                  ? 'bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-sm font-medium'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-sm'
              }
              onClick={() => onToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
