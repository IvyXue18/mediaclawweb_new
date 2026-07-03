import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
};

const PAGE_SIZE = 10;

const CHANNEL_SOURCE_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'ai', label: 'AI recommendation' },
  { value: 'search', label: 'Search engine' },
  { value: 'official_account', label: 'Official account' },
  { value: 'zhihu', label: 'Zhihu' },
  { value: 'wechat_channels', label: 'WeChat Channels' },
  { value: 'douyin', label: 'Douyin' },
  { value: 'xiaohongshu', label: 'Xiaohongshu' },
  { value: 'friend_referral', label: 'Friend referral' },
  { value: 'other', label: 'Other' },
];

const LEDGER_TASK_OPTIONS = [
  { value: 'all', label: 'All tasks' },
  { value: 'channel_survey', label: 'Channel survey' },
  { value: 'experience_feedback', label: 'Experience feedback' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const RATING_OPTIONS = [
  { value: '0', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

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
  if (durationDays) parts.push(`+${durationDays}d`);
  if (credits) parts.push(`+${credits} credits`);
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
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}

function UserCell({ row }: { row: RewardRow }) {
  return (
    <div className="min-w-[11rem]">
      <div className="font-medium">{row.userEmail || row.userName || '-'}</div>
      <div className="text-muted-foreground mt-1 font-mono text-xs">
        {row.userId || '-'}
      </div>
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

function getColumns(kind: RewardKind): Column<RewardRow>[] {
  if (kind === 'experience-feedback') {
    return [
      { header: 'User', cell: (row) => <UserCell row={row} /> },
      { header: 'Rating', cell: (row) => `${row.rating || '-'} / 5` },
      { header: 'Comment', cell: (row) => <TextCell>{row.comment}</TextCell> },
      {
        header: 'Expected feature',
        cell: (row) => <TextCell>{row.expectedFeature}</TextCell>,
      },
      {
        header: 'Credential',
        cell: (row) => (
          <span className="font-mono text-xs">
            {row.rewardCredentialCode || '-'}
          </span>
        ),
      },
      { header: 'Reward', cell: formatReward },
      {
        header: 'Status',
        cell: (row) => <StatusBadge status={getStatus(row)} />,
      },
      { header: 'Created', cell: (row) => formatDate(row.createdAt) },
    ];
  }

  if (kind === 'ledger') {
    return [
      { header: 'User', cell: (row) => <UserCell row={row} /> },
      { header: 'Task', cell: (row) => row.taskType || '-' },
      { header: 'Action', cell: (row) => row.rewardAction || '-' },
      {
        header: 'Credential',
        cell: (row) => (
          <span className="font-mono text-xs">
            {row.credentialCode || row.rewardCredentialCode || '-'}
          </span>
        ),
      },
      { header: 'Reward', cell: formatReward },
      {
        header: 'Status',
        cell: (row) => <StatusBadge status={getStatus(row)} />,
      },
      {
        header: 'Error',
        cell: (row) => <TextCell>{row.errorMessage}</TextCell>,
      },
      { header: 'Created', cell: (row) => formatDate(row.createdAt) },
    ];
  }

  return [
    { header: 'User', cell: (row) => <UserCell row={row} /> },
    { header: 'Source', cell: (row) => row.source || '-' },
    { header: 'Role', cell: (row) => row.role || '-' },
    { header: 'Use case', cell: (row) => <TextCell>{row.useCase}</TextCell> },
    { header: 'Detail', cell: (row) => <TextCell>{row.detail}</TextCell> },
    {
      header: 'Credential',
      cell: (row) => (
        <span className="font-mono text-xs">
          {row.rewardCredentialCode || '-'}
        </span>
      ),
    },
    { header: 'Reward', cell: formatReward },
    {
      header: 'Status',
      cell: (row) => <StatusBadge status={getStatus(row)} />,
    },
    { header: 'Created', cell: (row) => formatDate(row.createdAt) },
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

  const columns = useMemo(() => getColumns(kind), [kind]);
  const rows = query.data?.items ?? [];

  const toolbar =
    kind === 'channel-survey' ? (
      <FilterSelect
        label="Source"
        value={source}
        options={CHANNEL_SOURCE_OPTIONS}
        onChange={setSource}
      />
    ) : kind === 'experience-feedback' ? (
      <FilterSelect
        label="Rating"
        value={rating}
        options={RATING_OPTIONS}
        onChange={setRating}
      />
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Task"
          value={taskType}
          options={LEDGER_TASK_OPTIONS}
          onChange={setTaskType}
        />
        <FilterSelect
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
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
            searchPlaceholder="Search user, credential, detail..."
            toolbar={toolbar}
            rowKey={(row) => row.id}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText="No reward records"
          />
        </CardContent>
      </Card>
    </div>
  );
}
