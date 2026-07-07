import { useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Copy, KeyRound, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPatch, apiPost, type PageResult } from '@/lib/api-client';
import {
  credentialIssueTypeLabel,
  credentialPlanLabel,
  credentialPresetSummary,
  DEFAULT_PRESET_BY_TYPE,
  getCredentialPreset,
  getCredentialPresets,
  type CredentialIssueType,
  type CredentialPreset,
} from '@/lib/credential-plan-display';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type CredentialRow = {
  id: string;
  code: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  sourceOrderNo?: string | null;
  planCode?: string | null;
  durationPreset?: string | null;
  maxBindings: number;
  currentBindings?: number;
  remainingCredits?: number;
  lastRechargedAt?: string | null;
  expiresAt?: string | null;
  status: string;
  partnerId?: string | null;
  variantId?: string | null;
  notes?: string | null;
  createdAt: string;
};

type UserOption = {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
};

const PAGE_SIZE = 10;
const STATUS_ACTIONS = ['active', 'frozen', 'revoked'] as const;
const STATUS_FILTERS = ['all', 'active', 'frozen', 'revoked'] as const;

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'frozen' || status === 'revoked') return 'destructive';
  return 'secondary';
}

function formatCredentialStatus(status: string) {
  if (status === 'active') return m['admin.credentials.status_active']();
  if (status === 'frozen') return m['admin.credentials.status_frozen']();
  if (status === 'revoked') return m['admin.credentials.status_revoked']();
  if (status === 'expired') return m['admin.credentials.status_expired']();
  return status || '-';
}

function formatStatusAction(status: (typeof STATUS_ACTIONS)[number]) {
  if (status === 'active') return m['admin.credentials.action_mark_active']();
  if (status === 'frozen') return m['admin.credentials.action_mark_frozen']();
  return m['admin.credentials.action_mark_revoked']();
}

function formatPlanCode(planCode?: string | null) {
  return credentialPlanLabel(planCode);
}

function formatDurationPreset(durationPreset?: string | null) {
  if (!durationPreset) return '';
  const preset = durationPreset.toLowerCase();
  if (preset === 'monthly' || preset === '1m') {
    return m['admin.credentials.duration_monthly']();
  }
  if (preset === 'quarterly' || preset === '3m') {
    return m['admin.credentials.duration_quarterly']();
  }
  if (preset === 'yearly' || preset === '1y') {
    return m['admin.credentials.duration_yearly']();
  }
  const daysMatch = preset.match(/^(\d+)d$/);
  if (daysMatch) {
    return m['admin.credentials.duration_days']({
      count: Number(daysMatch[1]),
    });
  }
  const monthsMatch = preset.match(/^(\d+)m$/);
  if (monthsMatch) {
    return m['admin.credentials.duration_months']({
      count: Number(monthsMatch[1]),
    });
  }
  return durationPreset;
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0));
}

function formatRelativeTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  const formatter = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  for (const [unit, unitMs] of units) {
    if (absMs >= unitMs)
      return formatter.format(Math.round(diffMs / unitMs), unit);
  }
  return formatter.format(0, 'minute');
}

function formatExpiresAt(row: CredentialRow) {
  if (row.expiresAt) return formatRelativeTime(row.expiresAt);
  if (row.durationPreset) return m['admin.credentials.pending_activation']();
  return '-';
}

function formatStatusFilter(status: (typeof STATUS_FILTERS)[number]) {
  if (status === 'all') return m['admin.credentials.filter_all']();
  return formatCredentialStatus(status);
}

function copyCredentialCode(code: string) {
  navigator.clipboard
    ?.writeText(code)
    .then(() => toast.success(m['admin.credentials.code_copied']()))
    .catch(() => toast.error(m['admin.credentials.copy_failed']()));
}

function AdminCredentialsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>('all');
  const [open, setOpen] = useState(false);
  const [ownerSuggestionsOpen, setOwnerSuggestionsOpen] = useState(false);
  const [debouncedOwnerEmail, setDebouncedOwnerEmail] = useState('');
  const [rechargeRow, setRechargeRow] = useState<CredentialRow | null>(null);
  const [rechargeForm, setRechargeForm] = useState({
    credits: '0',
    durationDays: '0',
    maxBindings: '',
    notes: '',
  });
  const [form, setForm] = useState({
    code: '',
    ownerEmail: '',
    issueType: 'formal' as CredentialIssueType,
    presetId: DEFAULT_PRESET_BY_TYPE.formal,
    planCode: 'formal',
    durationDays: '7',
    maxBindings: '1',
    totalCredits: '0',
    partnerId: '',
    variantId: '',
    notes: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedOwnerEmail(form.ownerEmail.trim()),
      250
    );
    return () => clearTimeout(timer);
  }, [form.ownerEmail]);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter]);

  const query = useQuery({
    queryKey: ['admin-credentials', page, debouncedSearch, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      return apiGet<PageResult<CredentialRow>>(
        `/api/admin/credentials?${params}`
      );
    },
    placeholderData: keepPreviousData,
  });

  const ownerSearchQuery = useQuery({
    queryKey: ['admin-users-search', debouncedOwnerEmail],
    queryFn: () =>
      apiGet<UserOption[]>(
        `/api/admin/users/search?q=${encodeURIComponent(debouncedOwnerEmail)}`
      ),
    enabled:
      ownerSuggestionsOpen && debouncedOwnerEmail.trim().length > 0 && open,
  });
  const ownerOptions = ownerSearchQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => {
      const ownerEmail = form.ownerEmail.trim();
      const durationDays = Math.floor(Number(form.durationDays || 0));
      const maxBindings = Math.floor(Number(form.maxBindings || 0));
      const totalCredits = Math.floor(Number(form.totalCredits || 0));

      if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
        throw new Error(m['admin.credentials.owner_email_invalid']());
      }
      if (!Number.isFinite(durationDays) || durationDays < 1) {
        throw new Error(m['admin.credentials.duration_invalid']());
      }
      if (!Number.isFinite(maxBindings) || maxBindings < 1) {
        throw new Error(m['admin.credentials.seats_invalid']());
      }
      if (!Number.isFinite(totalCredits) || totalCredits < 0) {
        throw new Error(m['admin.credentials.credits_invalid']());
      }

      const expiresAt = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      );
      expiresAt.setHours(23, 59, 59, 999);

      return apiPost('/api/admin/credentials', {
        ...form,
        ownerEmail,
        durationPreset: `${durationDays}d`,
        maxBindings,
        totalCredits,
        expiresAt: expiresAt.toISOString(),
      });
    },
    onSuccess: () => {
      toast.success(m['admin.credentials.created']());
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: string }) =>
      apiPatch('/api/admin/credentials', vars),
    onSuccess: () => {
      toast.success(m['admin.credentials.updated']());
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rechargeMutation = useMutation({
    mutationFn: () => {
      if (!rechargeRow) {
        throw new Error(m['admin.credentials.recharge_missing']());
      }

      const credits = Math.floor(Number(rechargeForm.credits || 0));
      const durationDays = Math.floor(Number(rechargeForm.durationDays || 0));
      const maxBindingsText = rechargeForm.maxBindings.trim();
      const maxBindings = maxBindingsText
        ? Math.floor(Number(maxBindingsText))
        : undefined;

      if (!Number.isFinite(credits) || credits < 0) {
        throw new Error(m['admin.credentials.credits_invalid']());
      }
      if (!Number.isFinite(durationDays) || durationDays < 0) {
        throw new Error(m['admin.credentials.recharge_duration_invalid']());
      }
      if (
        maxBindings !== undefined &&
        (!Number.isFinite(maxBindings) || maxBindings < 1)
      ) {
        throw new Error(m['admin.credentials.seats_invalid']());
      }
      if (
        credits === 0 &&
        durationDays === 0 &&
        (maxBindings === undefined || maxBindings === rechargeRow.maxBindings)
      ) {
        throw new Error(m['admin.credentials.recharge_noop']());
      }

      return apiPost(`/api/admin/credentials/${rechargeRow.id}`, {
        credits,
        durationDays,
        maxBindings,
        notes: rechargeForm.notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(m['admin.credentials.recharge_success']());
      setRechargeRow(null);
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function applyCredentialPreset(preset: CredentialPreset) {
    setForm((current) => ({
      ...current,
      issueType: preset.issueType,
      presetId: preset.id,
      planCode: preset.planCode,
      durationDays: String(preset.durationDays),
      maxBindings: String(preset.maxBindings),
      totalCredits: String(preset.totalCredits),
    }));
  }

  function openRechargeDialog(row: CredentialRow) {
    setRechargeRow(row);
    setRechargeForm({
      credits: '0',
      durationDays: '0',
      maxBindings: String(row.maxBindings || 1),
      notes: '',
    });
  }

  function handleIssueTypeChange(issueType: CredentialIssueType) {
    const preset = getCredentialPreset(DEFAULT_PRESET_BY_TYPE[issueType]);
    if (preset) applyCredentialPreset(preset);
  }

  function handleCustomNumberChange(
    field: 'durationDays' | 'maxBindings' | 'totalCredits',
    value: string
  ) {
    const customPreset = getCredentialPreset(
      form.issueType === 'trial' ? 'trial-custom' : 'formal-custom'
    );
    setForm({
      ...form,
      presetId: customPreset?.id || form.presetId,
      planCode: customPreset?.planCode || form.planCode,
      [field]: value,
    });
  }

  const columns: Column<CredentialRow>[] = [
    {
      header: m['admin.credentials.code_col'](),
      cell: (row) => (
        <div className="flex min-w-[12rem] items-center gap-2">
          <span className="font-mono text-xs font-medium">{row.code}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => copyCredentialCode(row.code)}
            title={m['admin.credentials.copy_code']()}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      ),
    },
    {
      header: m['admin.credentials.type_col'](),
      cell: (row) => (
        <Badge variant={row.planCode === 'trial' ? 'secondary' : 'default'}>
          {formatPlanCode(row.planCode)}
        </Badge>
      ),
    },
    {
      header: m['admin.credentials.source_order_col'](),
      cell: (row) => (
        <div className="min-w-[9rem]">
          <div className="font-medium">{formatPlanCode(row.planCode)}</div>
          <div className="text-muted-foreground font-mono text-xs">
            {row.sourceOrderNo || '-'}
          </div>
        </div>
      ),
    },
    {
      header: m['admin.credentials.owner_col'](),
      cell: (row) => (
        <div className="min-w-[12rem]">
          <div className="font-medium">
            {row.ownerName || m['admin.credentials.unclaimed']()}
          </div>
          <div className="text-muted-foreground text-xs">
            {row.ownerEmail || row.ownerUserId || '-'}
          </div>
        </div>
      ),
    },
    {
      header: m['admin.credentials.remaining_credits_col'](),
      cell: (row) => (
        <span className="font-semibold text-emerald-500">
          {formatInteger(row.remainingCredits)}
        </span>
      ),
    },
    {
      header: m['admin.credentials.bindings_col'](),
      cell: (row) =>
        `${formatInteger(row.currentBindings)} / ${formatInteger(row.maxBindings)}`,
    },
    {
      header: m['admin.credentials.expires_col'](),
      cell: (row) => (
        <div>
          <div>{formatExpiresAt(row)}</div>
          <div className="text-muted-foreground text-xs">
            {formatDurationPreset(row.durationPreset)}
          </div>
        </div>
      ),
    },
    {
      header: m['admin.credentials.status_col'](),
      cell: (row) => (
        <Badge variant={statusVariant(row.status)}>
          {formatCredentialStatus(row.status)}
        </Badge>
      ),
    },
    {
      header: m['admin.credentials.last_recharged_col'](),
      cell: (row) => formatRelativeTime(row.lastRechargedAt),
    },
    {
      header: m['admin.credentials.actions_col'](),
      className: 'w-[64px]',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openRechargeDialog(row)}>
              {m['admin.credentials.action_recharge']()}
            </DropdownMenuItem>
            {STATUS_ACTIONS.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => statusMutation.mutate({ id: row.id, status })}
              >
                {formatStatusAction(status)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {m['admin.credentials.title']()}
          </h1>
          <p className="text-muted-foreground">
            {m['admin.credentials.description']()}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          {m['admin.credentials.create']()}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <Button
            key={status}
            type="button"
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {formatStatusFilter(status)}
          </Button>
        ))}
      </div>

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
            searchPlaceholder={m['admin.credentials.search_placeholder']()}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={m['admin.credentials.empty']()}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              {m['admin.credentials.dialog_title']()}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="code">
                {m['admin.credentials.code_field']()}
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={m['admin.credentials.code_placeholder']()}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ownerEmail">
                  {m['admin.credentials.owner_email_field']()}
                </Label>
                <div className="relative">
                  <Input
                    id="ownerEmail"
                    value={form.ownerEmail}
                    onFocus={() => setOwnerSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setOwnerSuggestionsOpen(false), 120);
                    }}
                    onChange={(e) => {
                      setOwnerSuggestionsOpen(true);
                      setForm({ ...form, ownerEmail: e.target.value });
                    }}
                    placeholder={m[
                      'admin.credentials.owner_email_placeholder'
                    ]()}
                  />
                  {ownerSuggestionsOpen && form.ownerEmail.trim() ? (
                    <div className="bg-popover text-popover-foreground absolute top-full right-0 left-0 z-[60] mt-1 max-h-64 overflow-auto rounded-lg border p-1 shadow-lg">
                      {ownerSearchQuery.isFetching ? (
                        <div className="text-muted-foreground px-3 py-2 text-sm">
                          {m['admin.credentials.owner_email_searching']()}
                        </div>
                      ) : ownerOptions.length > 0 ? (
                        ownerOptions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="hover:bg-accent flex w-full min-w-0 flex-col rounded-md px-3 py-2 text-left"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setForm((current) => ({
                                ...current,
                                ownerEmail: item.email,
                              }));
                              setOwnerSuggestionsOpen(false);
                            }}
                          >
                            <span className="truncate text-sm font-medium">
                              {item.name || item.email}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {item.email}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="text-muted-foreground px-3 py-2 text-sm">
                          {m['admin.credentials.owner_email_empty']()}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issueType">
                  {m['admin.credentials.issue_type_field']()}
                </Label>
                <Select
                  value={form.issueType}
                  onValueChange={(value) =>
                    handleIssueTypeChange(value as CredentialIssueType)
                  }
                >
                  <SelectTrigger id="issueType" className="w-full">
                    <span className="truncate">
                      {credentialIssueTypeLabel(form.issueType)}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">
                      {m['admin.credentials.issue_type_formal']()}
                    </SelectItem>
                    <SelectItem value="trial">
                      {m['admin.credentials.issue_type_trial']()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="presetId">
                {m['admin.credentials.preset_field']()}
              </Label>
              <Select
                value={form.presetId}
                onValueChange={(value) => {
                  const preset = getCredentialPreset(value);
                  if (preset) applyCredentialPreset(preset);
                }}
              >
                <SelectTrigger id="presetId" className="w-full">
                  <span className="truncate">
                    {getCredentialPreset(form.presetId)?.label() || '-'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {getCredentialPresets(form.issueType).map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <span className="flex min-w-0 flex-col">
                        <span>{preset.label()}</span>
                        <span className="text-muted-foreground text-xs">
                          {credentialPresetSummary(preset)}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {form.issueType === 'trial'
                  ? m['admin.credentials.issue_type_trial_hint']()
                  : m['admin.credentials.issue_type_formal_hint']()}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="durationDays">
                  {m['admin.credentials.duration_days_field']()}
                </Label>
                <Input
                  id="durationDays"
                  type="number"
                  min={1}
                  step={1}
                  value={form.durationDays}
                  onChange={(e) =>
                    handleCustomNumberChange('durationDays', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxBindings">
                  {m['admin.credentials.seats_field']()}
                </Label>
                <Input
                  id="maxBindings"
                  type="number"
                  min={1}
                  step={1}
                  value={form.maxBindings}
                  onChange={(e) =>
                    handleCustomNumberChange('maxBindings', e.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="totalCredits">
                  {m['admin.credentials.credit_pool_field']()}
                </Label>
                <Input
                  id="totalCredits"
                  type="number"
                  min={0}
                  step={1}
                  value={form.totalCredits}
                  onChange={(e) =>
                    handleCustomNumberChange('totalCredits', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partnerId">
                  {m['admin.credentials.partner_id_field']()}
                </Label>
                <Input
                  id="partnerId"
                  value={form.partnerId}
                  onChange={(e) =>
                    setForm({ ...form, partnerId: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">
                {m['admin.credentials.notes_field']()}
              </Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {m['admin.credentials.cancel']()}
            </Button>
            <Button
              type="button"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {m['admin.credentials.submit']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rechargeRow}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRechargeRow(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              {m['admin.credentials.recharge_title']()}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="rechargeCode">
                {m['admin.credentials.code_field']()}
              </Label>
              <Input
                id="rechargeCode"
                value={rechargeRow?.code || ''}
                readOnly
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="rechargeCredits">
                  {m['admin.credentials.recharge_credits_field']()}
                </Label>
                <Input
                  id="rechargeCredits"
                  type="number"
                  min={0}
                  step={1}
                  value={rechargeForm.credits}
                  onChange={(event) =>
                    setRechargeForm({
                      ...rechargeForm,
                      credits: event.target.value,
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {m['admin.credentials.recharge_credits_hint']()}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rechargeDurationDays">
                  {m['admin.credentials.recharge_duration_field']()}
                </Label>
                <Input
                  id="rechargeDurationDays"
                  type="number"
                  min={0}
                  step={1}
                  value={rechargeForm.durationDays}
                  onChange={(event) =>
                    setRechargeForm({
                      ...rechargeForm,
                      durationDays: event.target.value,
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {m['admin.credentials.recharge_duration_hint']()}
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rechargeMaxBindings">
                {m['admin.credentials.recharge_seats_field']()}
              </Label>
              <Input
                id="rechargeMaxBindings"
                type="number"
                min={1}
                step={1}
                value={rechargeForm.maxBindings}
                onChange={(event) =>
                  setRechargeForm({
                    ...rechargeForm,
                    maxBindings: event.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rechargeNotes">
                {m['admin.credentials.recharge_notes_field']()}
              </Label>
              <Textarea
                id="rechargeNotes"
                value={rechargeForm.notes}
                onChange={(event) =>
                  setRechargeForm({
                    ...rechargeForm,
                    notes: event.target.value,
                  })
                }
                placeholder={m[
                  'admin.credentials.recharge_notes_placeholder'
                ]()}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRechargeRow(null)}
            >
              {m['admin.credentials.cancel']()}
            </Button>
            <Button
              type="button"
              disabled={rechargeMutation.isPending}
              onClick={() => rechargeMutation.mutate()}
            >
              {m['admin.credentials.recharge_submit']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute('/admin/credentials')({
  component: AdminCredentialsPage,
});
