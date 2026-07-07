import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  CreditCard,
  Gift,
  MousePointerClick,
  PlugZap,
  Star,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { apiGet } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RevenueBucket = {
  currency: string;
  amount: number;
};

type TopItem = {
  name: string;
  count: number;
  value?: number;
};

type AdminAnalyticsSummary = {
  range: {
    type: string;
    start: string | null;
    end: string | null;
  };
  web: {
    pageViews: number;
    visitors: number;
    signUpUsers: number;
    checkoutCreatedUsers: number;
    paymentSuccessUsers: number;
    pricingViewUsers: number;
    downloadClickUsers: number;
    chromeStoreClickUsers: number;
    trialClaimStartedUsers: number;
    trialClaimSuccessUsers: number;
    visitorToSignupRate: number;
    signupToCheckoutRate: number;
    checkoutToPaymentRate: number;
  };
  paid: {
    paidUsers: number;
    newPaidUsers: number;
    repeatPaidUsers: number;
    repeatPaidRate: number;
    paidOrders: number;
    paidAmount: number;
    paidAmountByCurrency: RevenueBucket[];
    averageOrderAmount: number;
  };
  welfare: {
    rewardUsers: number;
    rewardCount: number;
    surveyRewardUsers: number;
    feedbackRewardUsers: number;
    convertedPaidUsers: number;
    formalCredentialUsers: number;
    conversionRate: number;
    rewardSuccessRate: number;
  };
  funnel: {
    extensionOpenedUsers: number;
    credentialVerifiedUsers: number;
    featureGateShownUsers: number;
    trialCtaClickedUsers: number;
    pricingCtaClickedUsers: number;
    featureUsedUsers: number;
    featureUseEvents: number;
    openToCredentialRate: number;
    openToFeatureUseRate: number;
  };
  usage: {
    consumedCredits: number;
    activeConsumeUsers: number;
    consumeTransactions: number;
    topCreditScenes: TopItem[];
  };
  feedback: {
    surveyResponses: number;
    feedbackResponses: number;
    averageRating: number;
    positiveFeedbackRate: number;
    rewardSuccessCount: number;
    topRoles: TopItem[];
  };
  operations: {
    pendingOrders: number;
    unclaimedCredentials: number;
    frozenCredentials: number;
    pendingWithdrawals: number;
  };
};

type RangeKey = 'month' | '7d' | '30d' | 'all';

const RANGES: RangeKey[] = ['month', '7d', '30d', 'all'];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0));
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatCurrencyAmount(amount: number, currency = 'CNY') {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0) / 100);
  } catch {
    return `${currency} ${formatInteger(Number(amount || 0) / 100)}`;
  }
}

function formatRevenue(buckets: RevenueBucket[]) {
  if (buckets.length === 0) return formatCurrencyAmount(0, 'CNY');
  return buckets
    .map((bucket) => formatCurrencyAmount(bucket.amount, bucket.currency))
    .join(' / ');
}

function formatDateTime(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRangeLabel(range: RangeKey) {
  if (range === '7d') return m['admin.analytics.tabs.last_7_days']();
  if (range === '30d') return m['admin.analytics.tabs.last_30_days']();
  if (range === 'all') return m['admin.analytics.tabs.all']();
  return m['admin.analytics.tabs.month']();
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-muted-foreground size-4 shrink-0" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-normal">{value}</div>
        <p className="text-muted-foreground mt-4 text-xs leading-5">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TopList({
  title,
  description,
  items,
  valueFormatter,
}: {
  title: string;
  description: string;
  items: TopItem[];
  valueFormatter?: (item: TopItem) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground truncate">
                {item.name}
              </span>
              <span className="font-medium">
                {valueFormatter
                  ? valueFormatter(item)
                  : formatInteger(item.count)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            {m['admin.analytics.common.empty']()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessAnalyticsPanel({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const [range, setRange] = useState<RangeKey>('month');
  const [month, setMonth] = useState(currentMonth());

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (range === 'month') params.set('month', month);
    return `/api/admin/analytics?${params}`;
  }, [month, range]);

  const query = useQuery({
    queryKey: ['admin-analytics-summary', range, month],
    queryFn: () => apiGet<AdminAnalyticsSummary>(queryPath),
  });

  if (query.isPending) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          {m['admin.analytics.loading']()}
        </CardContent>
      </Card>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card>
        <CardContent className="text-destructive py-8 text-sm">
          {m['admin.analytics.error']()}
        </CardContent>
      </Card>
    );
  }

  const data = query.data;
  const rangeText =
    data.range.start && data.range.end
      ? m['admin.analytics.range_text.period']({
          start: formatDateTime(data.range.start),
          end: formatDateTime(data.range.end),
        })
      : m['admin.analytics.range_text.all']();

  return (
    <section className="space-y-6">
      {showHeader && (
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <TrendingUp className="text-muted-foreground size-5" />
            {m['admin.analytics.title']()}
          </h2>
          <p className="text-muted-foreground text-sm">
            {m['admin.analytics.description']()}
          </p>
        </div>
      )}

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <Button
              key={item}
              type="button"
              variant={range === item ? 'default' : 'outline'}
              onClick={() => setRange(item)}
            >
              {getRangeLabel(item)}
            </Button>
          ))}
        </div>
        {range === 'month' && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <Label htmlFor="analytics-month">
                {m['admin.analytics.month_selector.label']()}
              </Label>
              <Input
                id="analytics-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="w-[13.5rem]"
              />
            </div>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm">{rangeText}</p>

      <Section
        title={m['admin.analytics.sections.web.title']()}
        description={m['admin.analytics.sections.web.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.web_page_views.title']()}
            value={formatInteger(data.web.pageViews)}
            description={m[
              'admin.analytics.stats.web_page_views.description'
            ]()}
            icon={BarChart3}
          />
          <StatCard
            title={m['admin.analytics.stats.web_visitors.title']()}
            value={formatInteger(data.web.visitors)}
            description={m['admin.analytics.stats.web_visitors.description']()}
            icon={Users}
          />
          <StatCard
            title={m['admin.analytics.stats.web_sign_up_users.title']()}
            value={formatInteger(data.web.signUpUsers)}
            description={m[
              'admin.analytics.stats.web_sign_up_users.description'
            ]()}
            icon={Users}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_checkout_created_users.title'
            ]()}
            value={formatInteger(data.web.checkoutCreatedUsers)}
            description={m[
              'admin.analytics.stats.web_checkout_created_users.description'
            ]()}
            icon={CreditCard}
          />
          <StatCard
            title={m['admin.analytics.stats.web_payment_success_users.title']()}
            value={formatInteger(data.web.paymentSuccessUsers)}
            description={m[
              'admin.analytics.stats.web_payment_success_users.description'
            ]()}
            icon={BadgeDollarSign}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_visitor_to_signup_rate.title'
            ]()}
            value={formatPercent(data.web.visitorToSignupRate)}
            description={m[
              'admin.analytics.stats.web_visitor_to_signup_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_signup_to_checkout_rate.title'
            ]()}
            value={formatPercent(data.web.signupToCheckoutRate)}
            description={m[
              'admin.analytics.stats.web_signup_to_checkout_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_checkout_to_payment_rate.title'
            ]()}
            value={formatPercent(data.web.checkoutToPaymentRate)}
            description={m[
              'admin.analytics.stats.web_checkout_to_payment_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m['admin.analytics.stats.web_pricing_view_users.title']()}
            value={formatInteger(data.web.pricingViewUsers)}
            description={m[
              'admin.analytics.stats.web_pricing_view_users.description'
            ]()}
            icon={MousePointerClick}
          />
          <StatCard
            title={m['admin.analytics.stats.web_download_click_users.title']()}
            value={formatInteger(data.web.downloadClickUsers)}
            description={m[
              'admin.analytics.stats.web_download_click_users.description'
            ]()}
            icon={MousePointerClick}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_chrome_store_click_users.title'
            ]()}
            value={formatInteger(data.web.chromeStoreClickUsers)}
            description={m[
              'admin.analytics.stats.web_chrome_store_click_users.description'
            ]()}
            icon={MousePointerClick}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_trial_claim_started_users.title'
            ]()}
            value={formatInteger(data.web.trialClaimStartedUsers)}
            description={m[
              'admin.analytics.stats.web_trial_claim_started_users.description'
            ]()}
            icon={Gift}
          />
          <StatCard
            title={m[
              'admin.analytics.stats.web_trial_claim_success_users.title'
            ]()}
            value={formatInteger(data.web.trialClaimSuccessUsers)}
            description={m[
              'admin.analytics.stats.web_trial_claim_success_users.description'
            ]()}
            icon={Gift}
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.paid.title']()}
        description={m['admin.analytics.sections.paid.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.paid_users.title']()}
            value={formatInteger(data.paid.paidUsers)}
            description={m['admin.analytics.stats.paid_users.description']()}
            icon={Users}
          />
          <StatCard
            title={m['admin.analytics.stats.new_paid_users.title']()}
            value={formatInteger(data.paid.newPaidUsers)}
            description={m[
              'admin.analytics.stats.new_paid_users.description'
            ]()}
            icon={Users}
          />
          <StatCard
            title={m['admin.analytics.stats.repeat_paid_users.title']()}
            value={formatInteger(data.paid.repeatPaidUsers)}
            description={m[
              'admin.analytics.stats.repeat_paid_users.description'
            ]()}
            icon={Users}
          />
          <StatCard
            title={m['admin.analytics.stats.repeat_paid_rate.title']()}
            value={formatPercent(data.paid.repeatPaidRate)}
            description={m[
              'admin.analytics.stats.repeat_paid_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m['admin.analytics.stats.paid_orders.title']()}
            value={formatInteger(data.paid.paidOrders)}
            description={m['admin.analytics.stats.paid_orders.description']()}
            icon={CreditCard}
          />
          <StatCard
            title={m['admin.analytics.stats.paid_amount.title']()}
            value={formatRevenue(data.paid.paidAmountByCurrency)}
            description={m['admin.analytics.stats.paid_amount.description']()}
            icon={BadgeDollarSign}
          />
          <StatCard
            title={m['admin.analytics.stats.average_order_amount.title']()}
            value={formatCurrencyAmount(
              data.paid.averageOrderAmount,
              data.paid.paidAmountByCurrency[0]?.currency || 'CNY'
            )}
            description={m[
              'admin.analytics.stats.average_order_amount.description'
            ]()}
            icon={BadgeDollarSign}
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.welfare.title']()}
        description={m['admin.analytics.sections.welfare.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.reward_users.title']()}
            value={formatInteger(data.welfare.rewardUsers)}
            description={m['admin.analytics.stats.reward_users.description']()}
            icon={Gift}
          />
          <StatCard
            title={m['admin.analytics.stats.converted_paid_users.title']()}
            value={formatInteger(data.welfare.convertedPaidUsers)}
            description={m[
              'admin.analytics.stats.converted_paid_users.description'
            ]()}
            icon={BadgeDollarSign}
          />
          <StatCard
            title={m['admin.analytics.stats.welfare_conversion_rate.title']()}
            value={formatPercent(data.welfare.conversionRate)}
            description={m[
              'admin.analytics.stats.welfare_conversion_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m['admin.analytics.stats.formal_credential_users.title']()}
            value={formatInteger(data.welfare.formalCredentialUsers)}
            description={m[
              'admin.analytics.stats.formal_credential_users.description'
            ]()}
            icon={Gift}
          />
          <StatCard
            title={m['admin.analytics.stats.survey_reward_users.title']()}
            value={formatInteger(data.welfare.surveyRewardUsers)}
            description={m[
              'admin.analytics.stats.survey_reward_users.description'
            ]()}
            icon={Gift}
          />
          <StatCard
            title={m['admin.analytics.stats.feedback_reward_users.title']()}
            value={formatInteger(data.welfare.feedbackRewardUsers)}
            description={m[
              'admin.analytics.stats.feedback_reward_users.description'
            ]()}
            icon={Gift}
          />
          <StatCard
            title={m['admin.analytics.stats.reward_success_rate.title']()}
            value={formatPercent(data.welfare.rewardSuccessRate)}
            description={m[
              'admin.analytics.stats.reward_success_rate.description'
            ]()}
            icon={TrendingUp}
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.funnel.title']()}
        description={m['admin.analytics.sections.funnel.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.extension_opened_users.title']()}
            value={formatInteger(data.funnel.extensionOpenedUsers)}
            description={m[
              'admin.analytics.stats.extension_opened_users.description'
            ]()}
            icon={PlugZap}
          />
          <StatCard
            title={m['admin.analytics.stats.credential_verified_users.title']()}
            value={formatInteger(data.funnel.credentialVerifiedUsers)}
            description={m[
              'admin.analytics.stats.credential_verified_users.description'
            ]()}
            icon={PlugZap}
          />
          <StatCard
            title={m['admin.analytics.stats.feature_gate_shown_users.title']()}
            value={formatInteger(data.funnel.featureGateShownUsers)}
            description={m[
              'admin.analytics.stats.feature_gate_shown_users.description'
            ]()}
            icon={MousePointerClick}
          />
          <StatCard
            title={m['admin.analytics.stats.trial_cta_clicked_users.title']()}
            value={formatInteger(data.funnel.trialCtaClickedUsers)}
            description={m[
              'admin.analytics.stats.trial_cta_clicked_users.description'
            ]()}
            icon={Gift}
          />
          <StatCard
            title={m['admin.analytics.stats.pricing_cta_clicked_users.title']()}
            value={formatInteger(data.funnel.pricingCtaClickedUsers)}
            description={m[
              'admin.analytics.stats.pricing_cta_clicked_users.description'
            ]()}
            icon={CreditCard}
          />
          <StatCard
            title={m['admin.analytics.stats.feature_used_users.title']()}
            value={formatInteger(data.funnel.featureUsedUsers)}
            description={m[
              'admin.analytics.stats.feature_used_users.description'
            ]()}
            icon={Activity}
          />
          <StatCard
            title={m['admin.analytics.stats.feature_use_events.title']()}
            value={formatInteger(data.funnel.featureUseEvents)}
            description={m[
              'admin.analytics.stats.feature_use_events.description'
            ]()}
            icon={Activity}
          />
          <StatCard
            title={m['admin.analytics.stats.open_to_credential_rate.title']()}
            value={formatPercent(data.funnel.openToCredentialRate)}
            description={m[
              'admin.analytics.stats.open_to_credential_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m['admin.analytics.stats.open_to_feature_use_rate.title']()}
            value={formatPercent(data.funnel.openToFeatureUseRate)}
            description={m[
              'admin.analytics.stats.open_to_feature_use_rate.description'
            ]()}
            icon={TrendingUp}
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.usage.title']()}
        description={m['admin.analytics.sections.usage.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.consumed_credits.title']()}
            value={formatInteger(data.usage.consumedCredits)}
            description={m[
              'admin.analytics.stats.consumed_credits.description'
            ]()}
            icon={Activity}
          />
          <StatCard
            title={m['admin.analytics.stats.active_consume_users.title']()}
            value={formatInteger(data.usage.activeConsumeUsers)}
            description={m[
              'admin.analytics.stats.active_consume_users.description'
            ]()}
            icon={Users}
          />
          <StatCard
            title={m['admin.analytics.stats.consume_transactions.title']()}
            value={formatInteger(data.usage.consumeTransactions)}
            description={m[
              'admin.analytics.stats.consume_transactions.description'
            ]()}
            icon={Activity}
          />
          <TopList
            title={m['admin.analytics.stats.top_credit_scenes.title']()}
            description={m[
              'admin.analytics.stats.top_credit_scenes.description'
            ]()}
            items={data.usage.topCreditScenes}
            valueFormatter={(item) =>
              m['admin.analytics.stats.top_credit_scenes.value']({
                credits: formatInteger(item.value || 0),
                count: formatInteger(item.count),
              })
            }
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.feedback.title']()}
        description={m['admin.analytics.sections.feedback.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={m['admin.analytics.stats.survey_responses.title']()}
            value={formatInteger(data.feedback.surveyResponses)}
            description={m[
              'admin.analytics.stats.survey_responses.description'
            ]()}
            icon={Star}
          />
          <StatCard
            title={m['admin.analytics.stats.feedback_responses.title']()}
            value={formatInteger(data.feedback.feedbackResponses)}
            description={m[
              'admin.analytics.stats.feedback_responses.description'
            ]()}
            icon={Star}
          />
          <StatCard
            title={m['admin.analytics.stats.average_rating.title']()}
            value={data.feedback.averageRating.toFixed(1)}
            description={m[
              'admin.analytics.stats.average_rating.description'
            ]()}
            icon={Star}
          />
          <StatCard
            title={m['admin.analytics.stats.positive_feedback_rate.title']()}
            value={formatPercent(data.feedback.positiveFeedbackRate)}
            description={m[
              'admin.analytics.stats.positive_feedback_rate.description'
            ]()}
            icon={TrendingUp}
          />
          <StatCard
            title={m['admin.analytics.stats.feedback_reward_success.title']()}
            value={formatInteger(data.feedback.rewardSuccessCount)}
            description={m[
              'admin.analytics.stats.feedback_reward_success.description'
            ]()}
            icon={Gift}
          />
          <TopList
            title={m['admin.analytics.stats.top_roles.title']()}
            description={m['admin.analytics.stats.top_roles.description']()}
            items={data.feedback.topRoles}
          />
        </div>
      </Section>

      <Section
        title={m['admin.analytics.sections.operations.title']()}
        description={m['admin.analytics.sections.operations.description']()}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [
              m['admin.analytics.operations.pending_orders'](),
              data.operations.pendingOrders,
            ],
            [
              m['admin.analytics.operations.unclaimed_credentials'](),
              data.operations.unclaimedCredentials,
            ],
            [
              m['admin.analytics.operations.frozen_credentials'](),
              data.operations.frozenCredentials,
            ],
            [
              m['admin.analytics.operations.pending_withdrawals'](),
              data.operations.pendingWithdrawals,
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className={cn(
                'rounded-lg border p-4',
                Number(value) > 0 && 'border-primary/40 bg-primary/5'
              )}
            >
              <div className="text-muted-foreground text-sm">{label}</div>
              <div className="mt-2 text-2xl font-semibold">
                {formatInteger(Number(value))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </section>
  );
}
