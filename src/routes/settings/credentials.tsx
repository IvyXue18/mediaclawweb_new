import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Ban, KeyRound, Loader2, Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { ApiError, apiGet, apiPost, type PageResult } from '@/lib/api-client';
import { credentialPlanLabel } from '@/lib/credential-plan-display';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';

type CredentialRow = {
  id: string;
  code: string;
  planCode?: string | null;
  durationPreset?: string | null;
  maxBindings: number;
  expiresAt?: string | null;
  status: string;
  sourceOrderNo?: string | null;
  partnerId?: string | null;
  createdAt: string;
  currentBindings: number;
  remainingCredits: number;
  lastRechargedAt?: string | null;
  last90GrantCredits: number;
  last90ConsumeCredits: number;
  last90MonitorConsumeCredits: number;
  last90MonitorConsumeCount: number;
};

type ClaimStatusData = {
  exists: boolean;
  claimable: boolean;
  isUnclaimedOwner: boolean;
  reason: string;
  status: string | null;
};

const PAGE_SIZE = 10;

function getClaimReasonText(reason: string, status?: string | null) {
  switch (reason) {
    case 'claimable':
      return m['settings.credentials.claim.reasons.claimable']();
    case 'not_found':
      return m['settings.credentials.claim.reasons.not_found']();
    case 'invalid_status':
      return m['settings.credentials.claim.reasons.invalid_status']({
        status: status || '-',
      });
    case 'already_owned':
      return m['settings.credentials.claim.reasons.already_owned']();
    case 'owned_by_other':
      return m['settings.credentials.claim.reasons.owned_by_other']();
    case 'already_claimed':
      return m['settings.credentials.claim.reasons.already_claimed']();
    case 'invalid_code':
      return m['settings.credentials.claim.reasons.invalid_code']();
    default:
      return m['settings.credentials.claim.reasons.unknown']();
  }
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function CredentialsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [queryResult, setQueryResult] = useState<ClaimStatusData | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch]);

  const query = useQuery({
    queryKey: ['user-credentials', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<CredentialRow>>(
        `/api/user/credentials?${params}`
      );
    },
    placeholderData: keepPreviousData,
  });

  const checkMutation = useMutation({
    mutationFn: () =>
      apiPost<ClaimStatusData>('/api/user/credentials/claim-status', {
        credential_code: code.trim(),
      }),
    onSuccess: (status) => {
      setQueryResult(status);
      setMessage('');
      setClaimSuccess(false);
    },
    onError: (error: Error) => {
      setQueryResult(null);
      setMessage(
        error.message || m['settings.credentials.claim.messages.check_failed']()
      );
    },
  });

  const claimMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/user/credentials/claim', { credential_code: code.trim() }),
    onSuccess: () => {
      const successMessage =
        m['settings.credentials.claim.messages.claim_success']();
      setClaimSuccess(true);
      setQueryResult({
        exists: true,
        claimable: false,
        isUnclaimedOwner: false,
        reason: 'already_owned',
        status: 'active',
      });
      setMessage('');
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['user-credentials'] });
    },
    onError: (error: Error) => {
      const apiError = error instanceof ApiError ? error : null;
      const data = apiError?.data as
        | { reason?: string; status?: ClaimStatusData }
        | undefined;
      if (data?.status) setQueryResult(data.status);
      const reason = data?.reason;
      const status = data?.status?.status || queryResult?.status || null;
      const errorMessage =
        apiError?.message ||
        (reason
          ? getClaimReasonText(reason, status)
          : m['settings.credentials.claim.messages.claim_failed']());
      setMessage(errorMessage);
      toast.error(errorMessage);
    },
  });

  const freezeMutation = useMutation({
    mutationFn: (credentialId: string) =>
      apiPost(`/api/user/credentials/${credentialId}`, { action: 'freeze' }),
    onSuccess: () => {
      toast.success(m['settings.credentials.messages.freeze_success']());
      queryClient.invalidateQueries({ queryKey: ['user-credentials'] });
    },
    onError: (error: Error) => {
      toast.error(
        error.message || m['settings.credentials.messages.freeze_failed']()
      );
    },
  });

  function resetDialogState() {
    setCode('');
    setQueryResult(null);
    setClaimSuccess(false);
    setMessage('');
    checkMutation.reset();
    claimMutation.reset();
  }

  function handleCheckStatus() {
    const nextCode = code.trim();
    if (!nextCode) {
      setMessage(m['settings.credentials.claim.reasons.invalid_code']());
      return;
    }
    setClaimSuccess(false);
    setMessage('');
    checkMutation.mutate();
  }

  function handleClaim() {
    const nextCode = code.trim();
    if (!nextCode) {
      setMessage(m['settings.credentials.claim.reasons.invalid_code']());
      return;
    }
    if (!queryResult?.claimable) {
      setMessage(m['settings.credentials.claim.messages.not_claimable']());
      return;
    }
    setMessage('');
    claimMutation.mutate();
  }

  const columns: Column<CredentialRow>[] = [
    {
      header: m['settings.credentials.fields.code'](),
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      header: m['settings.credentials.fields.plan'](),
      cell: (row) => <span>{credentialPlanLabel(row.planCode)}</span>,
    },
    {
      header: m['settings.credentials.fields.bindings'](),
      cell: (row) => `${row.currentBindings || 0} / ${row.maxBindings}`,
    },
    {
      header: m['settings.credentials.fields.status'](),
      cell: (row) => <Badge>{row.status}</Badge>,
    },
    {
      header: m['settings.credentials.fields.expires_at'](),
      cell: (row) => formatDate(row.expiresAt),
    },
    {
      header: m['settings.credentials.fields.remaining_credits'](),
      cell: (row) => (
        <span className="text-emerald-600">{row.remainingCredits || 0}</span>
      ),
    },
    {
      header: m['settings.credentials.fields.source_order_no'](),
      cell: (row) =>
        row.sourceOrderNo ? (
          <span className="font-mono text-xs">{row.sourceOrderNo}</span>
        ) : (
          '-'
        ),
    },
    {
      header: m['settings.credentials.fields.last_recharged_at'](),
      cell: (row) => formatDate(row.lastRechargedAt),
    },
    {
      header: m['settings.credentials.fields.billing_summary'](),
      cell: (row) =>
        m['settings.credentials.stats.billing']({
          grant: row.last90GrantCredits || 0,
          consume: row.last90ConsumeCredits || 0,
        }),
    },
    {
      header: m['settings.credentials.fields.monitoring_summary'](),
      cell: (row) =>
        m['settings.credentials.stats.monitoring']({
          consume: row.last90MonitorConsumeCredits || 0,
          count: row.last90MonitorConsumeCount || 0,
        }),
    },
    {
      header: m['settings.credentials.fields.actions'](),
      className: 'min-w-72',
      cell: (row) => {
        const codeParam = encodeURIComponent(row.code);
        const isFreezing =
          freezeMutation.isPending && freezeMutation.variables === row.id;
        const disabled = row.status === 'frozen' || isFreezing;

        return (
          <div
            data-credential-row-actions
            className="flex flex-wrap items-center gap-2"
          >
            <Link
              href={`/settings/credits?credentialCode=${codeParam}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5'
              )}
            >
              <Receipt className="size-3.5" />
              {m['settings.credentials.buttons.view_billing']()}
            </Link>
            <Button
              data-credential-freeze={row.id}
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={disabled}
              onClick={() => freezeMutation.mutate(row.id)}
            >
              {isFreezing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Ban className="size-3.5" />
              )}
              {isFreezing
                ? m['settings.credentials.buttons.processing']()
                : m['settings.credentials.buttons.freeze']()}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {m['settings.credentials.title']()}
          </h1>
          <p className="text-muted-foreground">
            {m['settings.credentials.description']()}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {m['settings.credentials.claim.buttons.open']()}
        </Button>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            {m['settings.credentials.plugin_access.title']()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm leading-6">
          {m['settings.credentials.plugin_access.description']()}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={query.data?.items ?? []}
            total={query.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(row) => row.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={m['settings.credentials.search_placeholder']()}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={m['settings.credentials.empty']()}
          />
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) resetDialogState();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{m['settings.credentials.claim.title']()}</DialogTitle>
            <DialogDescription>
              {m['settings.credentials.claim.description']()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="claim-code">
              {m['settings.credentials.fields.code']()}
            </Label>
            <Input
              id="claim-code"
              value={code}
              className="font-mono"
              onChange={(e) => {
                setCode(e.target.value);
                setQueryResult(null);
                setClaimSuccess(false);
                setMessage('');
              }}
              placeholder={m['settings.credentials.claim.input_placeholder']()}
            />

            {queryResult ? (
              <div
                className={cn(
                  'rounded-md border px-3 py-2 text-sm',
                  queryResult.claimable
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300'
                    : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300'
                )}
                data-credential-claim-status
              >
                <p className="font-medium">
                  {queryResult.claimable
                    ? m['settings.credentials.claim.status.claimable']()
                    : m['settings.credentials.claim.status.not_claimable']()}
                </p>
                <p>
                  {getClaimReasonText(queryResult.reason, queryResult.status)}
                </p>
              </div>
            ) : null}

            {claimSuccess ? (
              <div
                className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                data-credential-claim-success
              >
                <p className="font-medium">
                  {m['settings.credentials.claim.messages.claim_success']()}
                </p>
                <p>
                  {m['settings.credentials.claim.messages.back_to_plugin']()}
                </p>
              </div>
            ) : null}

            {message ? (
              <div
                className="text-destructive border-destructive/30 bg-destructive/5 rounded-md border px-3 py-2 text-sm"
                role="alert"
                data-credential-claim-error
              >
                {message}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {m['settings.credentials.claim.buttons.close']()}
            </Button>
            <Button
              variant="outline"
              disabled={checkMutation.isPending || claimMutation.isPending}
              onClick={handleCheckStatus}
              data-credential-claim-check
            >
              {checkMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {checkMutation.isPending
                ? m['settings.credentials.claim.buttons.checking']()
                : m['settings.credentials.claim.buttons.check']()}
            </Button>
            <Button
              disabled={
                checkMutation.isPending ||
                claimMutation.isPending ||
                !queryResult?.claimable ||
                claimSuccess
              }
              onClick={handleClaim}
              data-credential-claim-confirm
            >
              {claimMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {claimMutation.isPending
                ? m['settings.credentials.claim.buttons.claiming']()
                : m['settings.credentials.claim.buttons.confirm']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/settings/credentials')({
  component: CredentialsPage,
});
