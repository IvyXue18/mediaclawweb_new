import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, ExternalLink, Info, TriangleAlert } from 'lucide-react';

import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Order = {
  id: string;
  orderNo: string;
  status: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentType?: string | null;
  productId?: string | null;
  productName?: string | null;
  planName?: string | null;
  invoiceUrl?: string | null;
  credentialAction?: string | null;
  credentialSyncStatus?: string | null;
  credentialSyncError?: string | null;
  credentialCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

const TABS = ['all', 'activation', 'credits'] as const;
type Tab = (typeof TABS)[number];

const PAGE_SIZE = 20;

function formatAmount(amount: number, currency: string) {
  const normalized = (currency || 'usd').toUpperCase();
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalized,
  }).format(amount / 100);
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const s = status.toLowerCase();
  if (s === 'paid' || s === 'succeeded' || s === 'active') return 'default';
  if (s === 'failed' || s === 'canceled') return 'destructive';
  return 'secondary';
}

function fulfillmentVariant(
  status?: string | null
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'done') return 'default';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}

function fulfillmentLabel(status?: string | null) {
  if (status === 'done') return m['settings.payments.fulfillment_done']();
  if (status === 'failed') return m['settings.payments.fulfillment_failed']();
  if (status === 'processing') {
    return m['settings.payments.fulfillment_processing']();
  }
  return m['settings.payments.fulfillment_pending']();
}

function purchaseKind(order: Order) {
  if (order.productId?.startsWith('credits-')) {
    return m['settings.payments.kind_credits']();
  }
  if (order.credentialAction === 'recharge') {
    return m['settings.payments.kind_activation_recharge']();
  }
  if (order.credentialAction === 'issue') {
    return m['settings.payments.kind_activation']();
  }
  return m['settings.payments.kind_other']();
}

function paymentCallbackMessage(params: {
  callbackError?: boolean;
  status?: string;
  credentialSyncStatus?: string;
}) {
  if (params.callbackError) {
    return {
      icon: <TriangleAlert className="size-4" />,
      title: m['settings.payments.callback_error_title'](),
      description: m['settings.payments.callback_error_description'](),
      className: 'border-destructive/30 bg-destructive/10 text-destructive',
    };
  }

  if (params.status === 'paid') {
    if (params.credentialSyncStatus === 'failed') {
      return {
        icon: <TriangleAlert className="size-4" />,
        title: m['settings.payments.callback_paid_sync_failed_title'](),
        description:
          m['settings.payments.callback_paid_sync_failed_description'](),
        className:
          'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
      };
    }

    return {
      icon: <CheckCircle2 className="size-4" />,
      title: m['settings.payments.callback_paid_title'](),
      description: m['settings.payments.callback_paid_description'](),
      className:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    };
  }

  return {
    icon: <Info className="size-4" />,
    title: m['settings.payments.callback_pending_title'](),
    description: m['settings.payments.callback_pending_description'](),
    className: 'border-border bg-muted/40 text-foreground',
  };
}

function PaymentsPage() {
  const routeSearch = Route.useSearch();
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  useEffect(() => {
    if (routeSearch.order_no) {
      setSearch(routeSearch.order_no);
      setTab('all');
    }
  }, [routeSearch.order_no]);

  const query = useQuery({
    queryKey: ['user-payments', page, tab, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (tab !== 'all') params.set('purchaseKind', tab);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<Order>>(`/api/user/orders?${params}`);
    },
    placeholderData: keepPreviousData,
  });
  const orders = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const columns: Column<Order>[] = [
    {
      header: m['settings.payments.order_no'](),
      cell: (o) => <span className="font-mono text-xs">{o.orderNo}</span>,
    },
    {
      header: m['settings.payments.product'](),
      cell: (o) => <span>{o.planName || o.productName || '—'}</span>,
    },
    {
      header: m['settings.payments.amount'](),
      cell: (o) => (
        <span className="font-medium">
          {formatAmount(o.amount, o.currency)}
        </span>
      ),
    },
    {
      header: m['settings.payments.status'](),
      cell: (o) => <Badge variant={statusVariant(o.status)}>{o.status}</Badge>,
    },
    {
      header: m['settings.payments.fulfillment'](),
      cell: (o) => {
        if (!o.credentialAction || o.credentialAction === 'none') {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="space-y-1">
            <Badge variant={fulfillmentVariant(o.credentialSyncStatus)}>
              {fulfillmentLabel(o.credentialSyncStatus)}
            </Badge>
            {o.credentialCode ? (
              <p className="font-mono text-xs">{o.credentialCode}</p>
            ) : null}
            {o.credentialSyncError ? (
              <p className="text-destructive max-w-[18rem] text-xs">
                {o.credentialSyncError}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      header: m['settings.payments.kind'](),
      cell: (o) => purchaseKind(o),
    },
    {
      header: m['settings.payments.provider'](),
      cell: (o) => <span className="capitalize">{o.paymentProvider}</span>,
    },
    {
      header: m['settings.payments.date'](),
      cell: (o) => (
        <span className="text-muted-foreground text-sm">
          {new Date(o.paidAt || o.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: m['settings.payments.invoice'](),
      className: 'w-[60px]',
      cell: (o) =>
        o.invoiceUrl ? (
          <a
            href={o.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
            aria-label={m['settings.payments.invoice']()}
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['settings.payments.title']()}</h1>
        <p className="text-muted-foreground">
          {m['settings.payments.description']()}
        </p>
      </div>

      {routeSearch.payment_callback === '1' ? (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 text-sm',
            paymentCallbackMessage({
              callbackError: routeSearch.payment_callback_error === '1',
              status: routeSearch.payment_status,
              credentialSyncStatus: routeSearch.credential_sync_status,
            }).className
          )}
          data-payment-callback-status
        >
          <div className="mt-0.5 shrink-0">
            {
              paymentCallbackMessage({
                callbackError: routeSearch.payment_callback_error === '1',
                status: routeSearch.payment_status,
                credentialSyncStatus: routeSearch.credential_sync_status,
              }).icon
            }
          </div>
          <div className="space-y-1">
            <p className="font-medium">
              {
                paymentCallbackMessage({
                  callbackError: routeSearch.payment_callback_error === '1',
                  status: routeSearch.payment_status,
                  credentialSyncStatus: routeSearch.credential_sync_status,
                }).title
              }
            </p>
            <p>
              {
                paymentCallbackMessage({
                  callbackError: routeSearch.payment_callback_error === '1',
                  status: routeSearch.payment_status,
                  credentialSyncStatus: routeSearch.credential_sync_status,
                }).description
              }
            </p>
            {routeSearch.order_no ? (
              <p className="font-mono text-xs" data-payment-callback-order>
                {routeSearch.order_no}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-border flex gap-1 overflow-x-auto overflow-y-hidden border-b">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              tab === tb
                ? 'border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {m[`settings.payments.tab_${tb}`]()}
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(o) => o.id}
            emptyText={m['settings.payments.no_payments']()}
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/settings/payments')({
  validateSearch: (search: Record<string, unknown>) => ({
    payment_callback:
      typeof search.payment_callback === 'string'
        ? search.payment_callback
        : undefined,
    payment_callback_error:
      typeof search.payment_callback_error === 'string'
        ? search.payment_callback_error
        : undefined,
    order_no: typeof search.order_no === 'string' ? search.order_no : undefined,
    payment_status:
      typeof search.payment_status === 'string'
        ? search.payment_status
        : undefined,
    payment_provider:
      typeof search.payment_provider === 'string'
        ? search.payment_provider
        : undefined,
    credential_action:
      typeof search.credential_action === 'string'
        ? search.credential_action
        : undefined,
    credential_sync_status:
      typeof search.credential_sync_status === 'string'
        ? search.credential_sync_status
        : undefined,
  }),
  component: PaymentsPage,
});
