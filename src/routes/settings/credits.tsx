import { useEffect, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Coins, Eye } from 'lucide-react';

import { tDynamic } from '@/core/i18n/dynamic';
import { Link } from '@/core/i18n/navigation';
import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CreditRow = {
  id: string;
  transactionNo: string;
  transactionType: string;
  transactionScene?: string | null;
  credits: number;
  remainingCredits: number;
  description?: string | null;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  credentialCode?: string | null;
  metadata?: string | null;
};

type BalanceData = {
  balance: number;
  walletBalance?: number;
  credentialBalance?: number;
};

const TABS = ['all', 'grant', 'consume'] as const;
type Tab = (typeof TABS)[number];

const PAGE_SIZE = 20;

// Localize enum-ish values coming from the ledger. Falls back to the raw
// value when no message exists for it (unknown scenes from new features).
function enumLabel(prefix: 'type' | 'scene', value?: string | null): string {
  if (!value) return '—';
  const key = `settings.credits.${prefix}_${value}`;
  const translated = tDynamic(key);
  return translated === key ? value : translated;
}

function parseMetadata(row: CreditRow): Record<string, unknown> | null {
  if (!row.metadata) return null;
  try {
    const parsed = JSON.parse(row.metadata);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// Balance after this transaction, when the ledger recorded it (credential
// consumes / recharges store remainingAfter in metadata). Grant rows fall
// back to the grant's own remaining credits.
function resolveRemaining(row: CreditRow): number | null {
  const meta = parseMetadata(row);
  const remainingAfter = meta?.remainingAfter;
  if (typeof remainingAfter === 'number' && Number.isFinite(remainingAfter)) {
    return remainingAfter;
  }
  if (row.transactionType === 'grant') return row.remainingCredits;
  return null;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="text-muted-foreground w-24 shrink-0 text-sm">
        {label}
      </span>
      <span className="min-w-0 text-sm break-all">{value}</span>
    </div>
  );
}

function CreditDetailDialog({
  row,
  onClose,
}: {
  row: CreditRow | null;
  onClose: () => void;
}) {
  const meta = row ? parseMetadata(row) : null;
  const remaining = row ? resolveRemaining(row) : null;

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m['settings.credits.detail_title']()}</DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-3">
            <DetailField
              label={m['settings.credits.transaction_no']()}
              value={
                <span className="font-mono text-xs">{row.transactionNo}</span>
              }
            />
            <DetailField
              label={m['settings.credits.type']()}
              value={
                <Badge variant={row.credits < 0 ? 'secondary' : 'default'}>
                  {enumLabel('type', row.transactionType)}
                </Badge>
              }
            />
            <DetailField
              label={m['settings.credits.scene']()}
              value={enumLabel('scene', row.transactionScene)}
            />
            <DetailField
              label={m['settings.credits.description_col']()}
              value={row.description || '—'}
            />
            <DetailField
              label={m['settings.credits.credits']()}
              value={
                <span className="font-medium tabular-nums">
                  {row.credits > 0 ? `+${row.credits}` : row.credits}
                </span>
              }
            />
            <DetailField
              label={m['settings.credits.remaining']()}
              value={remaining ?? '—'}
            />
            <DetailField
              label={m['settings.credits.status']()}
              value={row.status || '—'}
            />
            {row.credentialCode && (
              <DetailField
                label={m['settings.credits.credential_code']()}
                value={
                  <span className="font-mono text-xs">
                    {row.credentialCode}
                  </span>
                }
              />
            )}
            <DetailField
              label={m['settings.credits.expires_at']()}
              value={
                row.expiresAt
                  ? new Date(row.expiresAt).toLocaleDateString()
                  : '—'
              }
            />
            <DetailField
              label={m['settings.credits.date']()}
              value={formatDateTime(row.createdAt)}
            />
            {meta && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-sm">
                  {m['settings.credits.raw_data']()}
                </span>
                <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
                  {JSON.stringify(meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreditsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detailRow, setDetailRow] = useState<CreditRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  const balanceQuery = useQuery({
    queryKey: ['user-credits', 'balance'],
    queryFn: () => apiGet<BalanceData>('/api/credits'),
  });
  const balance = balanceQuery.data?.balance ?? null;
  const walletBalance = balanceQuery.data?.walletBalance ?? 0;
  const credentialBalance = balanceQuery.data?.credentialBalance ?? 0;
  const balanceLoaded = !balanceQuery.isPending;

  const query = useQuery({
    queryKey: ['user-credits', page, tab, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (tab !== 'all') params.set('transactionType', tab);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<CreditRow>>(`/api/user/credits?${params}`);
    },
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const columns: Column<CreditRow>[] = [
    {
      header: m['settings.credits.scene'](),
      cell: (r) => (
        <Badge variant="outline">
          {enumLabel('scene', r.transactionScene)}
        </Badge>
      ),
    },
    {
      header: m['settings.credits.type'](),
      cell: (r) => (
        <Badge variant={r.credits < 0 ? 'secondary' : 'default'}>
          {enumLabel('type', r.transactionType)}
        </Badge>
      ),
    },
    {
      header: m['settings.credits.description_col'](),
      cell: (r) => (
        <span
          className="block max-w-[280px] truncate"
          title={r.description || ''}
        >
          {r.description || '—'}
        </span>
      ),
    },
    {
      header: m['settings.credits.credits'](),
      className: 'text-right',
      cell: (r) => (
        <span
          className={cn(
            'font-medium tabular-nums',
            r.credits < 0 && 'text-muted-foreground'
          )}
        >
          {r.credits > 0 ? `+${r.credits}` : r.credits}
        </span>
      ),
    },
    {
      header: m['settings.credits.remaining'](),
      className: 'text-right',
      cell: (r) => {
        const remaining = resolveRemaining(r);
        return (
          <span className="text-muted-foreground text-sm tabular-nums">
            {remaining ?? '—'}
          </span>
        );
      },
    },
    {
      header: m['settings.credits.date'](),
      cell: (r) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
    {
      header: m['settings.credits.actions'](),
      className: 'text-right',
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setDetailRow(r)}
        >
          <Eye className="size-4" />
          {m['settings.credits.view_detail']()}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{m['settings.credits.title']()}</h1>
        <p className="text-muted-foreground">
          {m['settings.credits.description']()}
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{m['settings.credits.balance']()}</CardTitle>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-2'
              )}
            >
              <Coins className="size-4" />
              {m['settings.credits.purchase']()}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {balanceLoaded ? (balance ?? 0) : '…'}
          </p>
          {balanceLoaded && credentialBalance > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              {m['settings.credits.balance_credential']()}: {credentialBalance}
              {walletBalance > 0 && (
                <>
                  {' · '}
                  {m['settings.credits.balance_wallet']()}: {walletBalance}
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

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
            {tDynamic(`settings.credits.tab_${tb}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(r) => r.id}
            emptyText={m['settings.credits.no_records']()}
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
          />
        </CardContent>
      </Card>

      <CreditDetailDialog row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}

export const Route = createFileRoute('/settings/credits')({
  component: CreditsPage,
});
