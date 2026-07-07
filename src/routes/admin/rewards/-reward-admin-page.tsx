import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
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
      cell: (row) => row.source || '-',
    },
    {
      header: m['admin.rewards.columns.role'](),
      cell: (row) => row.role || '-',
    },
    {
      header: m['admin.rewards.columns.use_case'](),
      cell: (row) => <TextCell>{row.useCase}</TextCell>,
    },
    {
      header: m['admin.rewards.columns.detail'](),
      cell: (row) => <TextCell>{row.detail}</TextCell>,
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
    </div>
  );
}
