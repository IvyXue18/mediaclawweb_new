import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';

import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type RewardKind = 'channel-survey' | 'experience-feedback' | 'ledger';

type RewardRow = {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  source?: string | null;
  role?: string | null;
  useCase?: string | null;
  detail?: string | null;
  answersJson?: string | null;
  rating?: number | null;
  comment?: string | null;
  expectedFeature?: string | null;
  taskType?: string | null;
  sourceResponseId?: string | null;
  rewardAction?: string | null;
  credentialCode?: string | null;
  rewardCredentialCode?: string | null;
  durationDays?: number | null;
  rewardDurationDays?: number | null;
  credits?: number | null;
  rewardCredits?: number | null;
  status?: string | null;
  rewardStatus?: string | null;
  errorMessage?: string | null;
  createdAt?: string | number | Date | null;
  updatedAt?: string | number | Date | null;
};

const PAGE_SIZE = 50;

type SurveyDetail = {
  platform?: string;
  sourceAi?: string;
  sourceQuestion?: string;
  searchEngine?: string;
  searchQuestion?: string;
  sourceOther?: string;
  roleOther?: string;
  rawDetail?: string;
};

type SurveySummary = {
  source: string;
  role: string;
  useCases: string[];
  detail: SurveyDetail;
  version?: string;
  entryPoint?: string;
};

function channelSourceOptions() {
  return [
    { value: 'all', label: m['admin.rewards.filters.source.all']() },
    { value: 'ai', label: m['admin.rewards.filters.source.ai']() },
    { value: 'search', label: m['admin.rewards.filters.source.search']() },
    {
      value: 'official_account',
      label: m['admin.rewards.filters.source.official_account'](),
    },
    { value: 'zhihu', label: m['admin.rewards.filters.source.zhihu']() },
    {
      value: 'wechat_channels',
      label: m['admin.rewards.filters.source.wechat_channels'](),
    },
    { value: 'douyin', label: m['admin.rewards.filters.source.douyin']() },
    {
      value: 'xiaohongshu',
      label: m['admin.rewards.filters.source.xiaohongshu'](),
    },
    {
      value: 'friend_referral',
      label: m['admin.rewards.filters.source.friend_referral'](),
    },
    { value: 'other', label: m['admin.rewards.filters.source.other']() },
  ];
}

function ledgerTaskOptions() {
  return [
    { value: 'all', label: m['admin.rewards.filters.task.all']() },
    {
      value: 'channel_survey',
      label: m['admin.rewards.filters.task.channel_survey'](),
    },
    {
      value: 'experience_feedback',
      label: m['admin.rewards.filters.task.experience_feedback'](),
    },
  ];
}

function statusOptions() {
  return [
    { value: 'all', label: m['admin.rewards.filters.status.all']() },
    {
      value: 'completed',
      label: m['admin.rewards.status.completed'](),
    },
    { value: 'pending', label: m['admin.rewards.status.pending']() },
    { value: 'failed', label: m['admin.rewards.status.failed']() },
  ];
}

function ratingOptions() {
  return [
    { value: '0', label: m['admin.rewards.filters.rating.all']() },
    {
      value: '5',
      label: m['admin.rewards.filters.rating.stars']({ count: 5 }),
    },
    {
      value: '4',
      label: m['admin.rewards.filters.rating.stars']({ count: 4 }),
    },
    {
      value: '3',
      label: m['admin.rewards.filters.rating.stars']({ count: 3 }),
    },
    {
      value: '2',
      label: m['admin.rewards.filters.rating.stars']({ count: 2 }),
    },
    {
      value: '1',
      label: m['admin.rewards.filters.rating.stars']({ count: 1 }),
    },
  ];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return asRecord(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => readString(item))
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isLikelyJsonText(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function parseSurveySummary(row: RewardRow): SurveySummary {
  const answers = parseRecord(row.answersJson);
  const answersDetail: Record<string, unknown> =
    parseRecord(answers?.detail) || asRecord(answers?.detail) || {};
  const rowDetail = parseRecord(row.detail);
  const detailSource: Record<string, unknown> = rowDetail || answersDetail;
  const rawDetail =
    row.detail && !rowDetail && !isLikelyJsonText(row.detail)
      ? row.detail.trim()
      : '';
  const answerUseCases = readStringArray(answers?.useCase);

  return {
    source: readString(answers?.source) || row.source || '',
    role: readString(answers?.role) || row.role || '',
    useCases: answerUseCases.length
      ? answerUseCases
      : readStringArray(row.useCase),
    version: readString(answers?.version),
    entryPoint: readString(answers?.entryPoint),
    detail: {
      platform: readString(detailSource.platform),
      sourceAi: readString(detailSource.sourceAi),
      sourceQuestion: readString(detailSource.sourceQuestion),
      searchEngine: readString(detailSource.searchEngine),
      searchQuestion: readString(detailSource.searchQuestion),
      sourceOther: readString(detailSource.sourceOther),
      roleOther: readString(detailSource.roleOther),
      rawDetail,
    },
  };
}

function sourceLabel(value?: string | null) {
  switch (value) {
    case 'ai':
      return m['admin.rewards.filters.source.ai']();
    case 'search':
      return m['admin.rewards.filters.source.search']();
    case 'official_account':
      return m['admin.rewards.filters.source.official_account']();
    case 'zhihu':
      return m['admin.rewards.filters.source.zhihu']();
    case 'wechat_channels':
      return m['admin.rewards.filters.source.wechat_channels']();
    case 'douyin':
      return m['admin.rewards.filters.source.douyin']();
    case 'xiaohongshu':
      return m['admin.rewards.filters.source.xiaohongshu']();
    case 'friend_referral':
      return m['admin.rewards.filters.source.friend_referral']();
    case 'other':
      return m['admin.rewards.filters.source.other']();
    default:
      return value || '-';
  }
}

function roleLabel(value?: string | null) {
  switch (value) {
    case 'personal_blogger':
      return m['admin.rewards.channel_survey.roles.personal_blogger']();
    case 'mcn':
      return m['admin.rewards.channel_survey.roles.mcn']();
    case 'brand_team':
      return m['admin.rewards.channel_survey.roles.brand_team']();
    case 'growth_team':
      return m['admin.rewards.channel_survey.roles.growth_team']();
    case 'opc':
      return m['admin.rewards.channel_survey.roles.opc']();
    case 'other':
      return m['admin.rewards.channel_survey.roles.other']();
    default:
      return value || '-';
  }
}

function platformLabel(value?: string | null) {
  switch (value) {
    case 'xiaohongshu':
      return m['admin.rewards.channel_survey.platforms.xiaohongshu']();
    case 'douyin':
      return m['admin.rewards.channel_survey.platforms.douyin']();
    case 'both':
      return m['admin.rewards.channel_survey.platforms.both']();
    default:
      return value || '-';
  }
}

function useCaseLabel(value?: string | null) {
  switch (value) {
    case 'topic_direction':
      return m['admin.rewards.channel_survey.use_cases.topic_direction']();
    case 'benchmark_accounts':
      return m['admin.rewards.channel_survey.use_cases.benchmark_accounts']();
    case 'viral_samples':
      return m['admin.rewards.channel_survey.use_cases.viral_samples']();
    case 'asset_library':
      return m['admin.rewards.channel_survey.use_cases.asset_library']();
    case 'influencer_research':
      return m['admin.rewards.channel_survey.use_cases.influencer_research']();
    case 'private_leads':
      return m['admin.rewards.channel_survey.use_cases.private_leads']();
    default:
      return value || '-';
  }
}

function compactList(values: string[]) {
  const labels = values.map(useCaseLabel).filter((value) => value !== '-');
  return labels.length ? labels.join('、') : '-';
}

function getSpecificChannel(summary: SurveySummary) {
  if (summary.source === 'ai') return summary.detail.sourceAi;
  if (summary.source === 'search') return summary.detail.searchEngine;
  if (summary.source === 'other') return summary.detail.sourceOther;
  return '';
}

function getSourceQuestion(summary: SurveySummary) {
  if (summary.source === 'ai') return summary.detail.sourceQuestion;
  if (summary.source === 'search') return summary.detail.searchQuestion;
  return '';
}

function formatDate(value: RewardRow['createdAt']) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatReward(row: RewardRow) {
  const durationDays = row.rewardDurationDays ?? row.durationDays ?? 0;
  const credits = row.rewardCredits ?? row.credits ?? 0;
  const parts = [];
  if (durationDays) {
    parts.push(m['admin.rewards.reward.days']({ count: durationDays }));
  }
  if (credits) {
    parts.push(m['admin.rewards.reward.credits']({ count: credits }));
  }
  return parts.length ? parts.join(' / ') : '-';
}

function getStatus(row: RewardRow) {
  return row.rewardStatus || row.status || '-';
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed' || status === 'success') return 'default';
  if (status === 'failed' || status === 'rejected') return 'destructive';
  if (status === 'pending') return 'secondary';
  return 'outline';
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    completed: m['admin.rewards.status.completed'](),
    success: m['admin.rewards.status.success'](),
    pending: m['admin.rewards.status.pending'](),
    failed: m['admin.rewards.status.failed'](),
    rejected: m['admin.rewards.status.rejected'](),
  };
  return (
    <Badge variant={statusVariant(status)}>{labels[status] || status}</Badge>
  );
}

function UserCell({ row }: { row: RewardRow }) {
  const displayName = row.userName || row.userEmail || '-';
  const email =
    row.userEmail && row.userEmail !== displayName ? row.userEmail : '';

  return (
    <div className="min-w-[11rem]">
      <div className="font-medium">{displayName}</div>
      {email ? (
        <div className="text-muted-foreground mt-1 text-xs">{email}</div>
      ) : null}
    </div>
  );
}

function TextCell({ children }: { children?: string | null }) {
  return (
    <span className="block max-w-[22rem] truncate" title={children || ''}>
      {children || '-'}
    </span>
  );
}

function MultiValueCell({ value }: { value: string }) {
  return (
    <span className="block max-w-[24rem] whitespace-normal" title={value}>
      {value || '-'}
    </span>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm break-words">{value || '-'}</dd>
    </div>
  );
}

function ChannelSurveyDetailDialog({
  row,
  onClose,
}: {
  row: RewardRow | null;
  onClose: () => void;
}) {
  const summary = row ? parseSurveySummary(row) : null;
  const specificChannel = summary ? getSpecificChannel(summary) : '';
  const sourceQuestion = summary ? getSourceQuestion(summary) : '';

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {m['admin.rewards.channel_survey.detail_title']()}
          </DialogTitle>
          <DialogDescription>
            {m['admin.rewards.channel_survey.detail_description']()}
          </DialogDescription>
        </DialogHeader>

        {row && summary ? (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                {m['admin.rewards.channel_survey.sections.focus']()}
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label={m['admin.rewards.columns.source']()}
                  value={sourceLabel(summary.source)}
                />
                <DetailField
                  label={m['admin.rewards.columns.role']()}
                  value={roleLabel(summary.role)}
                />
                <DetailField
                  label={m['admin.rewards.columns.use_case']()}
                  value={compactList(summary.useCases)}
                />
                <DetailField
                  label={m['admin.rewards.columns.platform']()}
                  value={platformLabel(summary.detail.platform)}
                />
                <DetailField
                  label={m['admin.rewards.columns.specific_channel']()}
                  value={specificChannel}
                />
                <DetailField
                  label={m['admin.rewards.columns.search_question']()}
                  value={sourceQuestion}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                {m['admin.rewards.channel_survey.sections.supplement']()}
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.ai_name']()}
                  value={summary.detail.sourceAi}
                />
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.ai_question']()}
                  value={summary.detail.sourceQuestion}
                />
                <DetailField
                  label={m[
                    'admin.rewards.channel_survey.fields.search_engine'
                  ]()}
                  value={summary.detail.searchEngine}
                />
                <DetailField
                  label={m[
                    'admin.rewards.channel_survey.fields.search_question'
                  ]()}
                  value={summary.detail.searchQuestion}
                />
                <DetailField
                  label={m[
                    'admin.rewards.channel_survey.fields.source_other'
                  ]()}
                  value={summary.detail.sourceOther}
                />
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.role_other']()}
                  value={summary.detail.roleOther}
                />
                <DetailField
                  label={m['admin.rewards.columns.detail']()}
                  value={summary.detail.rawDetail}
                />
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.entry_point']()}
                  value={summary.entryPoint}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                {m['admin.rewards.channel_survey.sections.reward']()}
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label={m['admin.rewards.columns.reward_credential']()}
                  value={row.rewardCredentialCode}
                />
                <DetailField
                  label={m['admin.rewards.columns.reward']()}
                  value={formatReward(row)}
                />
                <DetailField
                  label={m['admin.rewards.columns.status']()}
                  value={getStatus(row)}
                />
                <DetailField
                  label={m['admin.rewards.columns.created_at']()}
                  value={formatDate(row.createdAt)}
                />
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.updated_at']()}
                  value={formatDate(row.updatedAt)}
                />
                <DetailField
                  label={m['admin.rewards.channel_survey.fields.version']()}
                  value={summary.version}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">
                {m['admin.rewards.channel_survey.sections.system']()}
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label={m['admin.rewards.columns.user']()}
                  value={row.userName || row.userEmail}
                />
                <DetailField
                  label={m['admin.users.email_col']()}
                  value={row.userEmail}
                />
              </dl>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'border-input bg-background h-9 rounded-md border px-2 text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-2'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getColumns(
  kind: RewardKind,
  onOpenChannelSurveyDetail?: (row: RewardRow) => void
): Column<RewardRow>[] {
  if (kind === 'experience-feedback') {
    return [
      {
        header: m['admin.rewards.columns.user'](),
        cell: (row) => <UserCell row={row} />,
      },
      {
        header: m['admin.rewards.columns.rating'](),
        cell: (row) => `${row.rating || '-'} / 5`,
      },
      {
        header: m['admin.rewards.columns.feedback'](),
        cell: (row) => <TextCell>{row.comment}</TextCell>,
      },
      {
        header: m['admin.rewards.columns.expected_feature'](),
        cell: (row) => <TextCell>{row.expectedFeature}</TextCell>,
      },
      {
        header: m['admin.rewards.columns.reward_credential'](),
        cell: (row) => (
          <span className="font-mono text-xs">
            {row.rewardCredentialCode || '-'}
          </span>
        ),
      },
      { header: m['admin.rewards.columns.reward'](), cell: formatReward },
      {
        header: m['admin.rewards.columns.status'](),
        cell: (row) => <StatusBadge status={getStatus(row)} />,
      },
      {
        header: m['admin.rewards.columns.created_at'](),
        cell: (row) => formatDate(row.createdAt),
      },
    ];
  }

  if (kind === 'ledger') {
    return [
      {
        header: m['admin.rewards.columns.user'](),
        cell: (row) => <UserCell row={row} />,
      },
      {
        header: m['admin.rewards.columns.task'](),
        cell: (row) => row.taskType || '-',
      },
      {
        header: m['admin.rewards.columns.action'](),
        cell: (row) => row.rewardAction || '-',
      },
      {
        header: m['admin.rewards.columns.credential'](),
        cell: (row) => (
          <span className="font-mono text-xs">
            {row.credentialCode || row.rewardCredentialCode || '-'}
          </span>
        ),
      },
      { header: m['admin.rewards.columns.reward'](), cell: formatReward },
      {
        header: m['admin.rewards.columns.status'](),
        cell: (row) => <StatusBadge status={getStatus(row)} />,
      },
      {
        header: m['admin.rewards.columns.error'](),
        cell: (row) => <TextCell>{row.errorMessage}</TextCell>,
      },
      {
        header: m['admin.rewards.columns.created_at'](),
        cell: (row) => formatDate(row.createdAt),
      },
    ];
  }

  return [
    {
      header: m['admin.rewards.columns.user'](),
      cell: (row) => <UserCell row={row} />,
    },
    {
      header: m['admin.rewards.columns.source'](),
      cell: (row) => sourceLabel(parseSurveySummary(row).source),
    },
    {
      header: m['admin.rewards.columns.role'](),
      cell: (row) => roleLabel(parseSurveySummary(row).role),
    },
    {
      header: m['admin.rewards.columns.use_case'](),
      cell: (row) => (
        <MultiValueCell value={compactList(parseSurveySummary(row).useCases)} />
      ),
    },
    {
      header: m['admin.rewards.columns.specific_channel'](),
      cell: (row) => {
        const summary = parseSurveySummary(row);
        return <TextCell>{getSpecificChannel(summary)}</TextCell>;
      },
    },
    {
      header: m['admin.rewards.columns.search_question'](),
      cell: (row) => {
        const summary = parseSurveySummary(row);
        return <TextCell>{getSourceQuestion(summary)}</TextCell>;
      },
    },
    {
      header: m['admin.rewards.columns.created_at'](),
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: m['admin.rewards.columns.details'](),
      className: 'w-[5rem] text-right',
      cell: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChannelSurveyDetail?.(row)}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          {m['admin.rewards.columns.details']()}
        </Button>
      ),
    },
  ];
}

export function AdminRewardRecordsPage({
  kind,
  title,
  description,
}: {
  kind: RewardKind;
  title: string;
  description: string;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [source, setSource] = useState('all');
  const [rating, setRating] = useState('0');
  const [taskType, setTaskType] = useState('all');
  const [status, setStatus] = useState('all');
  const [detailRow, setDetailRow] = useState<RewardRow | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [kind, debouncedSearch, source, rating, taskType, status]);

  const query = useQuery({
    queryKey: [
      'admin-rewards',
      kind,
      page,
      debouncedSearch,
      source,
      rating,
      taskType,
      status,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        kind,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (kind === 'channel-survey' && source !== 'all') {
        params.set('source', source);
      }
      if (kind === 'experience-feedback' && rating !== '0') {
        params.set('rating', rating);
      }
      if (kind === 'ledger') {
        if (taskType !== 'all') params.set('taskType', taskType);
        if (status !== 'all') params.set('status', status);
      }
      return apiGet<PageResult<RewardRow>>(`/api/admin/rewards?${params}`);
    },
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(
    () => getColumns(kind, (row) => setDetailRow(row)),
    [kind]
  );
  const rows = query.data?.items ?? [];

  const toolbar =
    kind === 'channel-survey' ? (
      <FilterSelect
        label={m['admin.rewards.filters.source.label']()}
        value={source}
        options={channelSourceOptions()}
        onChange={setSource}
      />
    ) : kind === 'experience-feedback' ? (
      <FilterSelect
        label={m['admin.rewards.filters.rating.label']()}
        value={rating}
        options={ratingOptions()}
        onChange={setRating}
      />
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label={m['admin.rewards.filters.task.label']()}
          value={taskType}
          options={ledgerTaskOptions()}
          onChange={setTaskType}
        />
        <FilterSelect
          label={m['admin.rewards.filters.status.label']()}
          value={status}
          options={statusOptions()}
          onChange={setStatus}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            columns={columns}
            data={rows}
            total={query.data?.total ?? 0}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={m['admin.rewards.search_placeholder']()}
            toolbar={toolbar}
            rowKey={(row) => row.id}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={m['admin.rewards.empty']()}
          />
        </CardContent>
      </Card>

      {kind === 'channel-survey' ? (
        <ChannelSurveyDetailDialog
          row={detailRow}
          onClose={() => setDetailRow(null)}
        />
      ) : null}
    </div>
  );
}
