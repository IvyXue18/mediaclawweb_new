import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { ApiError, apiGet, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

type BillingCancelSearch = {
  subscription_no?: string;
};

type Subscription = {
  id: string;
  subscriptionNo: string;
  status: string;
  planName?: string | null;
  productName?: string | null;
  interval?: string | null;
  intervalCount?: number | null;
  amount?: number | null;
  currency?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  createdAt?: string | null;
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function formatAmount(amount?: number | null, currency?: string | null) {
  if (!amount) return '—';
  const normalized = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalized,
  }).format(amount / 100);
}

function formatInterval(subscription?: Subscription | null) {
  if (!subscription?.interval) return '—';
  return subscription.intervalCount
    ? `${subscription.intervalCount} ${subscription.interval}`
    : subscription.interval;
}

function isCancellable(status?: string | null) {
  const s = (status || '').toLowerCase();
  return s === 'active' || s === 'trialing';
}

function BillingCancelPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const subscriptionNo = search.subscription_no || '';

  const subscriptionQuery = useQuery({
    queryKey: ['billing-cancel', subscriptionNo],
    queryFn: () =>
      apiGet<Subscription>(
        `/api/user/subscriptions/detail?subscriptionNo=${encodeURIComponent(
          subscriptionNo
        )}`
      ),
    enabled: !!subscriptionNo,
    retry: false,
  });
  const subscription = subscriptionQuery.data;

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/user/subscriptions/cancel', { subscriptionNo }),
    onSuccess: () => {
      toast.success(m['settings.billing.cancel_page.success']());
      navigate({ to: '/settings/billing' });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : m['settings.billing.cancel_failed']()
      );
    },
  });

  const loadError =
    subscriptionQuery.error instanceof ApiError
      ? subscriptionQuery.error.message
      : subscriptionQuery.error
        ? m['settings.billing.cancel_page.load_failed']()
        : '';

  return (
    <div className="space-y-6 p-6" data-billing-cancel-page>
      <Link
        href="/settings/billing"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        {m['settings.billing.cancel_page.back']()}
      </Link>

      <div className="flex items-start gap-3">
        <div className="text-destructive bg-destructive/10 rounded-md p-2">
          <Ban className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {m['settings.billing.cancel_page.title']()}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {m['settings.billing.cancel_page.description']()}
          </p>
        </div>
      </div>

      {!subscriptionNo ? (
        <StateCard
          message={m['settings.billing.cancel_page.invalid_subscription']()}
        />
      ) : subscriptionQuery.isPending ? (
        <StateCard
          icon={<Loader2 className="size-4 animate-spin" />}
          message={m['settings.billing.cancel_page.loading']()}
        />
      ) : loadError ? (
        <StateCard message={loadError} tone="destructive" />
      ) : subscription ? (
        <Card className="max-w-2xl" data-billing-cancel-form>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {subscription.planName || subscription.productName || '—'}
              </h2>
              <Badge variant="outline">{subscription.status}</Badge>
            </div>
            {!isCancellable(subscription.status) ? (
              <p className="text-muted-foreground text-sm" role="status">
                {m['settings.billing.cancel_page.not_cancellable']()}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            <dl className="divide-border grid divide-y text-sm">
              <DetailRow label={m['settings.billing.subscription_no']()}>
                <span className="font-mono text-xs">
                  {subscription.subscriptionNo}
                </span>
              </DetailRow>
              <DetailRow
                label={m[
                  'settings.billing.cancel_page.fields.subscription_amount'
                ]()}
              >
                {formatAmount(subscription.amount, subscription.currency)}
              </DetailRow>
              <DetailRow
                label={m[
                  'settings.billing.cancel_page.fields.interval_cycle'
                ]()}
              >
                {formatInterval(subscription)}
              </DetailRow>
              <DetailRow
                label={m[
                  'settings.billing.cancel_page.fields.subscription_created_at'
                ]()}
              >
                {formatDate(subscription.createdAt)}
              </DetailRow>
              <DetailRow
                label={m[
                  'settings.billing.cancel_page.fields.current_period'
                ]()}
              >
                {formatDate(subscription.currentPeriodStart)} ~{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </DetailRow>
            </dl>
          </CardContent>
          <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/settings/billing"
              className={buttonVariants({ variant: 'outline' })}
            >
              {m['settings.billing.cancel_back']()}
            </Link>
            <Button
              variant="destructive"
              disabled={
                cancelMutation.isPending || !isCancellable(subscription.status)
              }
              onClick={() => cancelMutation.mutate()}
              data-billing-cancel-submit
            >
              {cancelMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {cancelMutation.isPending
                ? m['settings.billing.canceling']()
                : m['settings.billing.cancel_page.confirm_cancel']()}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

function StateCard({
  message,
  icon,
  tone,
}: {
  message: string;
  icon?: React.ReactNode;
  tone?: 'destructive';
}) {
  return (
    <Card className="max-w-2xl">
      <CardContent
        className={
          tone === 'destructive'
            ? 'text-destructive flex items-center gap-2 py-6 text-sm'
            : 'text-muted-foreground flex items-center gap-2 py-6 text-sm'
        }
        role={tone === 'destructive' ? 'alert' : 'status'}
      >
        {icon}
        {message}
      </CardContent>
    </Card>
  );
}

export const Route = createFileRoute('/settings/billing/cancel')({
  validateSearch: (search: Record<string, unknown>): BillingCancelSearch => ({
    subscription_no:
      typeof search.subscription_no === 'string'
        ? search.subscription_no
        : undefined,
  }),
  component: BillingCancelPage,
});
