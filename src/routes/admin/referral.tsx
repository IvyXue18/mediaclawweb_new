import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPatch, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CommissionRow = {
  id: string;
  referrerUserId?: string | null;
  referrerEmail?: string | null;
  inviteeUserId?: string | null;
  orderNo?: string | null;
  amount: number;
  currency: string;
  rate: number;
  status: string;
  reason?: string | null;
  createdAt: string;
};

type WithdrawalRow = {
  id: string;
  userEmail?: string | null;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  accountInfo?: string | null;
  reason?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 50;
const TABS = ['commissions', 'withdrawals'] as const;
type Tab = (typeof TABS)[number];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: (currency || 'cny').toUpperCase(),
  }).format(amount / 100);
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'settled') return 'default';
  if (status === 'rejected' || status === 'canceled') return 'destructive';
  return 'secondary';
}

function formatReferralStatus(status: string) {
  const key = `admin.referral.status.${status}` as keyof typeof m;
  return typeof m[key] === 'function' ? m[key]() : status || '-';
}

function formatTab(tab: Tab) {
  if (tab === 'commissions') return m['admin.referral.tabs.commissions']();
  return m['admin.referral.tabs.withdrawals']();
}

function AdminReferralPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('commissions');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reviewing, setReviewing] = useState<{
    row: WithdrawalRow;
    status: 'paid' | 'rejected';
  } | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [tab, debouncedSearch]);

  const query = useQuery({
    queryKey: ['admin-referral', tab, page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        kind: tab,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<CommissionRow | WithdrawalRow>>(
        `/api/admin/referral?${params}`
      );
    },
    placeholderData: keepPreviousData,
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      apiPatch('/api/admin/referral', {
        id: reviewing!.row.id,
        status: reviewing!.status,
        reason,
      }),
    onSuccess: () => {
      toast.success(m['admin.referral.review_success']());
      setReviewing(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-referral'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const commissionColumns: Column<CommissionRow>[] = [
    {
      header: m['admin.referral.commission.referrer_col'](),
      cell: (row) => row.referrerEmail || row.referrerUserId || '-',
    },
    {
      header: m['admin.referral.commission.invitee_col'](),
      cell: (row) => row.inviteeUserId || '-',
    },
    {
      header: m['admin.referral.commission.order_col'](),
      cell: (row) => (
        <span className="font-mono text-xs">{row.orderNo || '-'}</span>
      ),
    },
    {
      header: m['admin.referral.commission.amount_col'](),
      cell: (row) => formatMoney(row.amount, row.currency),
    },
    {
      header: m['admin.referral.commission.rate_col'](),
      cell: (row) => `${row.rate}%`,
    },
    {
      header: m['admin.referral.status_col'](),
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {formatReferralStatus(row.status)}
        </Badge>
      ),
    },
    {
      header: m['admin.referral.created_col'](),
      cell: (row) => new Date(row.createdAt).toLocaleString('zh-CN'),
    },
  ];

  const withdrawalColumns: Column<WithdrawalRow>[] = [
    {
      header: m['admin.referral.withdrawal.user_col'](),
      cell: (row) => row.userEmail || row.userId,
    },
    {
      header: m['admin.referral.withdrawal.amount_col'](),
      cell: (row) => formatMoney(row.amount, row.currency),
    },
    {
      header: m['admin.referral.withdrawal.account_col'](),
      cell: (row) => row.accountInfo || '-',
    },
    {
      header: m['admin.referral.status_col'](),
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {formatReferralStatus(row.status)}
        </Badge>
      ),
    },
    {
      header: m['admin.referral.created_col'](),
      cell: (row) => new Date(row.createdAt).toLocaleString('zh-CN'),
    },
    {
      header: '',
      className: 'w-[160px]',
      cell: (row) =>
        row.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setReviewing({ row, status: 'paid' })}
            >
              <Check className="size-3" />
              {m['admin.referral.withdrawal.pay']()}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setReviewing({ row, status: 'rejected' })}
            >
              <X className="size-3" />
              {m['admin.referral.withdrawal.reject']()}
            </Button>
          </div>
        ) : null,
    },
  ];

  const rows = query.data?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['admin.referral.title']()}</h1>
        <p className="text-muted-foreground">
          {m['admin.referral.description']()}
        </p>
      </div>

      <div className="border-border flex gap-1 overflow-x-auto border-b">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === item
                ? 'border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {formatTab(item)}
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={
              tab === 'commissions'
                ? (commissionColumns as Column<CommissionRow | WithdrawalRow>[])
                : (withdrawalColumns as Column<CommissionRow | WithdrawalRow>[])
            }
            data={rows}
            total={query.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(row) => row.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={m['admin.referral.search_placeholder']()}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={m['admin.referral.empty']()}
          />
        </CardContent>
      </Card>

      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewing?.status === 'paid'
                ? m['admin.referral.review_paid_title']()
                : m['admin.referral.review_reject_title']()}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="review-reason">
              {m['admin.referral.review_note']()}
            </Label>
            <Input
              id="review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={m['admin.referral.review_note_placeholder']()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              {m['admin.referral.cancel']()}
            </Button>
            <Button
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
            >
              {m['admin.referral.confirm']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/admin/referral')({
  component: AdminReferralPage,
});
