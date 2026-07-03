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

const PAGE_SIZE = 10;
const TABS = ['commissions', 'withdrawals'] as const;
type Tab = (typeof TABS)[number];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format(amount / 100);
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'settled') return 'default';
  if (status === 'rejected' || status === 'canceled') return 'destructive';
  return 'secondary';
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
      toast.success('Withdrawal reviewed');
      setReviewing(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-referral'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const commissionColumns: Column<CommissionRow>[] = [
    {
      header: 'Referrer',
      cell: (row) => row.referrerEmail || row.inviteeUserId || '-',
    },
    {
      header: 'Order',
      cell: (row) => (
        <span className="font-mono text-xs">{row.orderNo || '-'}</span>
      ),
    },
    {
      header: 'Commission',
      cell: (row) => formatMoney(row.amount, row.currency),
    },
    {
      header: 'Rate',
      cell: (row) => `${row.rate}%`,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: 'Created',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const withdrawalColumns: Column<WithdrawalRow>[] = [
    {
      header: 'User',
      cell: (row) => row.userEmail || row.userId,
    },
    {
      header: 'Amount',
      cell: (row) => formatMoney(row.amount, row.currency),
    },
    {
      header: 'Account',
      cell: (row) => row.accountInfo || '-',
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      header: 'Created',
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
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
              Pay
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setReviewing({ row, status: 'rejected' })}
            >
              <X className="size-3" />
              Reject
            </Button>
          </div>
        ) : null,
    },
  ];

  const rows = query.data?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Referral Operations</h1>
        <p className="text-muted-foreground">
          Review commissions, refund effects, and manual withdrawal requests.
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
            {item === 'commissions' ? 'Commissions' : 'Withdrawals'}
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
            searchPlaceholder="Search order, account, or user"
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText="No referral records"
          />
        </CardContent>
      </Card>

      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewing?.status === 'paid'
                ? 'Mark withdrawal paid'
                : 'Reject withdrawal'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="review-reason">Review note</Label>
            <Input
              id="review-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>
              Cancel
            </Button>
            <Button
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
            >
              Confirm
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
