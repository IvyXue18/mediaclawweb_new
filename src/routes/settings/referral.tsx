import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  Check,
  Clock,
  Copy,
  Gift,
  HelpCircle,
  MessageCircle,
  Percent,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ReferralOverview = {
  account: {
    inviteCode: string;
    totalInvitees: number;
    totalCommission: number;
    availableCommission: number;
    pendingCommission: number;
    withdrawnCommission: number;
    currency: string;
    status: string;
  };
  commissions: Array<{
    id: string;
    orderNo?: string | null;
    amount: number;
    currency: string;
    rate: number;
    status: string;
    createdAt: string;
  }>;
  relations: Array<{
    id: string;
    refereeName?: string | null;
    refereeEmail?: string | null;
    hasFirstOrder: boolean;
    firstOrderNo?: string | null;
    firstOrderAt?: string | null;
    status: string;
    createdAt: string;
  }>;
  relationTotal: number;
  withdrawals: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  config: {
    firstOrderRate: number;
    renewalRate: number;
    inviteeDiscount: number;
    minSettlement: number;
    lockDays: number;
  };
  referralLink: string;
  availableAmount: number;
  pendingAmount: number;
  lockedAmount: number;
  withdrawingAmount: number;
  minWithdrawalAmount: number;
  hasPendingWithdrawal: boolean;
  canRequestWithdrawal: boolean;
  stats: {
    totalReferrals: number;
    totalCommission: number;
  };
};

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency || ''}`.trim();
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: m['settings.referral.statuses.pending'](),
    locked: m['settings.referral.statuses.locked'](),
    settled: m['settings.referral.statuses.settled'](),
    canceled: m['settings.referral.statuses.canceled'](),
    frozen: m['settings.referral.statuses.frozen'](),
    paid: m['settings.referral.statuses.paid'](),
    rejected: m['settings.referral.statuses.rejected'](),
  };
  return labels[status] || status;
}

function StatsHelp({
  config,
  currency,
}: {
  config: ReferralOverview['config'];
  currency: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-1">
              <HelpCircle className="size-4" />
              {m['settings.referral.stats.help.trigger']()}
            </Button>
          }
        />
        <TooltipContent className="grid max-w-sm gap-3 p-3 text-left">
          <div>
            <p className="font-medium">
              {m['settings.referral.stats.help.available_title']()}
            </p>
            <p className="text-background/80">
              {m['settings.referral.stats.help.available_desc']()}
            </p>
          </div>
          <div>
            <p className="font-medium">
              {m['settings.referral.stats.help.pending_title']()}
            </p>
            <p className="text-background/80">
              {m['settings.referral.stats.help.pending_desc']({
                lockDays: config.lockDays,
                minSettlement: formatMoney(config.minSettlement, currency),
              })}
            </p>
          </div>
          <div>
            <p className="font-medium">
              {m['settings.referral.stats.help.referrals_title']()}
            </p>
            <p className="text-background/80">
              {m['settings.referral.stats.help.referrals_desc']()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RuleItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-24 gap-3 rounded-lg border p-4">
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function ReferralPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const withdrawContactText = m['settings.referral.withdraw.contact_text']();

  const query = useQuery({
    queryKey: ['settings-referral'],
    queryFn: () => apiGet<ReferralOverview>('/api/referral'),
  });
  const overview = query.data;
  const account = overview?.account;
  const currency = account?.currency || 'usd';
  const minimum = overview?.minWithdrawalAmount ?? 0;
  const buttonLabel = overview?.hasPendingWithdrawal
    ? m['settings.referral.withdraw.pending_button']()
    : overview?.canRequestWithdrawal
      ? m['settings.referral.withdraw.button']()
      : m['settings.referral.withdraw.disabled_button']({
          amount: formatMoney(minimum, currency),
        });

  const withdrawalMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/referral/withdrawals', {
        contactSnapshot: withdrawContactText,
        currency,
      }),
    onSuccess: () => {
      toast.success(m['settings.referral.withdraw.submitted_title']());
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['settings-referral'] });
    },
    onError: (error: Error) =>
      toast.error(
        error.message || m['settings.referral.withdraw.submit_failed']()
      ),
  });

  async function copyInviteUrl() {
    if (!overview?.referralLink) return;
    await navigator.clipboard.writeText(overview.referralLink);
    setCopied(true);
    toast.success(m['settings.referral.invite.copied']());
    window.setTimeout(() => setCopied(false), 1600);
  }

  const statCards = [
    {
      label: m['settings.referral.stats.available'](),
      value: formatMoney(overview?.availableAmount ?? 0, currency),
      tone: 'text-primary',
    },
    {
      label: m['settings.referral.stats.pending'](),
      value: formatMoney(
        (overview?.pendingAmount ?? 0) + (overview?.lockedAmount ?? 0),
        currency
      ),
      tone: 'text-muted-foreground',
    },
    {
      label: m['settings.referral.stats.total_referrals'](),
      value: String(overview?.stats.totalReferrals ?? 0),
      tone: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {m['settings.referral.title']()}
          </h1>
          <p className="text-muted-foreground">
            {m['settings.referral.description']()}
          </p>
        </div>
        {overview ? (
          <StatsHelp config={overview.config} currency={currency} />
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${item.tone} text-3xl font-semibold tabular-nums`}>
                {query.isLoading ? '-' : item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="size-5" />
            {m['settings.referral.invite.title']()}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-sm font-medium">
              {m['settings.referral.invite.link_label']()}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={overview?.referralLink || ''} />
              <Button
                className="gap-2"
                onClick={copyInviteUrl}
                disabled={!overview?.referralLink}
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {m['settings.referral.invite.copy']()}
              </Button>
            </div>
          </div>
          <div className="text-muted-foreground text-sm">
            {m['settings.referral.invite.code_label']()}:{' '}
            <span className="text-foreground font-mono">
              {account?.inviteCode || '-'}
            </span>
          </div>
        </CardContent>
      </Card>

      {overview ? (
        <Card>
          <CardHeader>
            <CardTitle>{m['settings.referral.rules.title']()}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <RuleItem
              icon={<Gift className="size-4" />}
              title={m['settings.referral.rules.first_order.title']({
                rate: overview.config.firstOrderRate,
              })}
              description={m['settings.referral.rules.first_order.description'](
                {
                  rate: overview.config.firstOrderRate,
                }
              )}
            />
            <RuleItem
              icon={<Percent className="size-4" />}
              title={m['settings.referral.rules.renewal.title']({
                rate: overview.config.renewalRate,
              })}
              description={m['settings.referral.rules.renewal.description']({
                rate: overview.config.renewalRate,
              })}
            />
            <RuleItem
              icon={<Sparkles className="size-4" />}
              title={m['settings.referral.rules.invitee_discount.title']({
                rate: overview.config.inviteeDiscount,
              })}
              description={m[
                'settings.referral.rules.invitee_discount.description'
              ]({
                rate: overview.config.inviteeDiscount,
              })}
            />
            <RuleItem
              icon={<Clock className="size-4" />}
              title={m['settings.referral.rules.settlement.title']()}
              description={m['settings.referral.rules.settlement.description']({
                lockDays: overview.config.lockDays,
                minSettlement: formatMoney(
                  overview.config.minSettlement,
                  currency
                ),
              })}
            />
            <RuleItem
              icon={<MessageCircle className="size-4" />}
              title={m['settings.referral.rules.withdrawal.title']()}
              description={m[
                'settings.referral.rules.withdrawal.description'
              ]()}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{m['settings.referral.withdraw.title']()}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">
                {m['settings.referral.withdraw.available_label']()}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(overview?.availableAmount ?? 0, currency)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                {m['settings.referral.withdraw.withdrawing_label']()}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(overview?.withdrawingAmount ?? 0, currency)}
              </p>
            </div>
            <p className="text-muted-foreground text-sm sm:col-span-2">
              {m['settings.referral.withdraw.description']({
                amount: formatMoney(minimum, currency),
              })}
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            disabled={!overview?.canRequestWithdrawal}
          >
            {buttonLabel}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{m['settings.referral.relations.title']()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.relations ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.refereeName ||
                      item.refereeEmail ||
                      m['settings.referral.relations.unknown_invitee']()}
                  </p>
                  {item.refereeEmail ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {item.refereeEmail}
                    </p>
                  ) : null}
                  <p className="text-muted-foreground text-xs">
                    {m['settings.referral.relations.registered_at']()}:{' '}
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={item.hasFirstOrder ? 'default' : 'secondary'}>
                    {item.hasFirstOrder
                      ? m['settings.referral.relations.first_order_yes']()
                      : m['settings.referral.relations.first_order_no']()}
                  </Badge>
                  {item.firstOrderAt ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDate(item.firstOrderAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
            {overview?.relations?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {m['settings.referral.relations.empty']()}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{m['settings.referral.commissions.title']()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.commissions ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-mono text-xs">{item.orderNo || item.id}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  <Badge variant="secondary">{statusLabel(item.status)}</Badge>
                </div>
              </div>
            ))}
            {overview?.commissions?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {m['settings.referral.commissions.empty']()}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {m['settings.referral.withdraw.history_title']()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.withdrawals ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {formatMoney(item.amount, item.currency)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <Badge variant="secondary">{statusLabel(item.status)}</Badge>
              </div>
            ))}
            {overview?.withdrawals?.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {m['settings.referral.withdraw.empty_history']()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {m['settings.referral.withdraw.dialog_title']()}
            </DialogTitle>
            <DialogDescription>
              {m['settings.referral.withdraw.dialog_description']()}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex justify-center">
              <img
                src="/wechat.png"
                alt={m['settings.referral.withdraw.qr_alt']()}
                className="size-44 rounded-lg border object-cover"
              />
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium">
                {m['settings.referral.withdraw.contact_title']()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
                {withdrawContactText ||
                  m['settings.referral.withdraw.contact_fallback']()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {m['settings.referral.withdraw.cancel']()}
            </Button>
            <Button
              disabled={withdrawalMutation.isPending}
              onClick={() => withdrawalMutation.mutate()}
            >
              {withdrawalMutation.isPending
                ? m['settings.referral.withdraw.submitting']()
                : m['settings.referral.withdraw.confirm']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/settings/referral')({
  component: ReferralPage,
});
