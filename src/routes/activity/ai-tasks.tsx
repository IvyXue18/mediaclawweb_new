import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  FileText,
  ImageIcon,
  Music,
  RefreshCw,
  Video,
} from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { apiGet, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { m } from '@/paraglide/messages.js';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type AITaskRow = {
  id: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  status: string;
  taskId?: string | null;
  taskInfo?: string | null;
  taskResult?: string | null;
  costCredits?: number | null;
  createdAt: string | Date;
};

type AITaskInfo = {
  errorMessage?: string;
  songs?: Array<{ id?: string; audioUrl?: string; title?: string }>;
  images?: Array<{ imageUrl?: string; id?: string }>;
  videos?: Array<{ videoUrl?: string; thumbnailUrl?: string; id?: string }>;
};

const PAGE_SIZE = 20;
const MEDIA_TABS = ['all', 'music', 'image', 'video', 'audio', 'text'] as const;
const STATUS_TABS = [
  'all',
  'pending',
  'processing',
  'success',
  'failed',
] as const;

function parseJson<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function statusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'success') return 'default';
  if (status === 'failed' || status === 'canceled') return 'destructive';
  if (status === 'pending' || status === 'processing') return 'secondary';
  return 'outline';
}

function mediaIcon(mediaType: string) {
  if (mediaType === 'image') return <ImageIcon className="size-3.5" />;
  if (mediaType === 'video') return <Video className="size-3.5" />;
  if (mediaType === 'music' || mediaType === 'audio')
    return <Music className="size-3.5" />;
  return <FileText className="size-3.5" />;
}

function mediaLabel(mediaType: string) {
  const key = `activity.ai_tasks.media.${mediaType}` as keyof typeof m;
  return m[key] ? m[key]() : mediaType;
}

function statusLabel(status: string) {
  const key = `activity.ai_tasks.status.${status}` as keyof typeof m;
  return m[key] ? m[key]() : status;
}

function TaskResult({ row }: { row: AITaskRow }) {
  const info = parseJson<AITaskInfo>(row.taskInfo);
  const result = parseJson<unknown>(row.taskResult);

  if (info?.errorMessage) {
    return (
      <div
        className="text-destructive flex max-w-xs items-start gap-2 text-sm"
        data-ai-task-result-error
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span className="line-clamp-3">{info.errorMessage}</span>
      </div>
    );
  }

  const songs = (info?.songs || []).filter((song) => song.audioUrl);
  if (songs.length > 0) {
    return (
      <div className="grid max-w-xs gap-2" data-ai-task-result-audio>
        {songs.slice(0, 2).map((song, index) => (
          <audio
            key={song.id || `${row.id}-song-${index}`}
            src={song.audioUrl}
            controls
            className="h-8 w-64 max-w-full"
            aria-label={song.title || m['activity.ai_tasks.result_audio']()}
          />
        ))}
      </div>
    );
  }

  const images = (info?.images || []).filter((image) => image.imageUrl);
  if (images.length > 0) {
    return (
      <div className="flex max-w-xs gap-2" data-ai-task-result-image>
        {images.slice(0, 3).map((image, index) => (
          <img
            key={image.id || `${row.id}-image-${index}`}
            src={image.imageUrl}
            alt={m['activity.ai_tasks.result_image']()}
            className="bg-muted aspect-square size-14 rounded-md object-cover"
            loading="lazy"
          />
        ))}
      </div>
    );
  }

  const videos = (info?.videos || []).filter((video) => video.videoUrl);
  if (videos.length > 0) {
    return (
      <div className="grid max-w-xs gap-1" data-ai-task-result-video>
        {videos.slice(0, 2).map((video, index) => (
          <a
            key={video.id || `${row.id}-video-${index}`}
            href={video.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-sm hover:underline"
          >
            {m['activity.ai_tasks.open_video']({ index: index + 1 })}
          </a>
        ))}
      </div>
    );
  }

  if (result) {
    return (
      <code
        className="bg-muted block max-w-xs rounded px-2 py-1 text-xs break-words"
        data-ai-task-result-json
      >
        {JSON.stringify(result).slice(0, 120)}
      </code>
    );
  }

  return <span className="text-muted-foreground">-</span>;
}

function SegmentTabs<T extends readonly string[]>({
  items,
  value,
  labelFor,
  onChange,
  dataAttr,
}: {
  items: T;
  value: T[number];
  labelFor: (item: T[number]) => string;
  onChange: (value: T[number]) => void;
  dataAttr: string;
}) {
  return (
    <div
      className="border-border flex gap-1 overflow-x-auto overflow-y-hidden border-b"
      data-ai-task-tabs={dataAttr}
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          onClick={() => onChange(item)}
          className={cn(
            '-mb-px border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
            value === item
              ? 'border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground border-transparent'
          )}
        >
          {labelFor(item)}
        </button>
      ))}
    </div>
  );
}

function AITasksPage() {
  const [mediaType, setMediaType] =
    useState<(typeof MEDIA_TABS)[number]>('all');
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [mediaType, status, debouncedSearch]);

  const query = useQuery({
    queryKey: ['activity-ai-tasks', page, mediaType, status, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (mediaType !== 'all') params.set('type', mediaType);
      if (status !== 'all') params.set('status', status);
      if (debouncedSearch) params.set('search', debouncedSearch);
      return apiGet<PageResult<AITaskRow>>(`/api/ai/tasks?${params}`);
    },
    placeholderData: keepPreviousData,
    retry: false,
  });

  const columns = useMemo<Column<AITaskRow>[]>(
    () => [
      {
        header: m['activity.ai_tasks.fields.prompt'](),
        cell: (row) => (
          <span className="line-clamp-2 max-w-xs text-sm">{row.prompt}</span>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.media_type'](),
        cell: (row) => (
          <Badge variant="outline" className="gap-1">
            {mediaIcon(row.mediaType)}
            {mediaLabel(row.mediaType)}
          </Badge>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.provider'](),
        cell: (row) => (
          <span className="font-mono text-xs">{row.provider || '-'}</span>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.model'](),
        cell: (row) => (
          <span className="line-clamp-1 max-w-36 text-xs">{row.model}</span>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.status'](),
        cell: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {statusLabel(row.status)}
          </Badge>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.cost_credits'](),
        cell: (row) => row.costCredits ?? 0,
      },
      {
        header: m['activity.ai_tasks.fields.result'](),
        cell: (row) => <TaskResult row={row} />,
      },
      {
        header: m['activity.ai_tasks.fields.created_at'](),
        cell: (row) => (
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            {new Date(row.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        header: m['activity.ai_tasks.fields.action'](),
        className: 'w-[96px]',
        cell: (row) =>
          row.status === 'pending' || row.status === 'processing' ? (
            <Link
              href={`/activity/ai-tasks/${row.id}/refresh`}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'gap-1',
              })}
              data-ai-task-refresh
            >
              <RefreshCw className="size-3.5" />
              {m['activity.ai_tasks.refresh']()}
            </Link>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
    ],
    []
  );

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const error = query.error instanceof Error ? query.error.message : '';

  return (
    <div className="space-y-6 p-6" data-ai-task-page>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {m['activity.ai_tasks.title']()}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {m['activity.ai_tasks.description']()}
          </p>
        </div>
        <Link
          href="/ai-image-generator"
          className={buttonVariants({ variant: 'outline' })}
        >
          {m['activity.ai_tasks.open_generator']()}
        </Link>
      </div>

      <div className="space-y-3">
        <SegmentTabs
          items={MEDIA_TABS}
          value={mediaType}
          labelFor={(item) =>
            item === 'all'
              ? m['activity.ai_tasks.tabs.all']()
              : mediaLabel(item)
          }
          onChange={setMediaType}
          dataAttr="media"
        />
        <SegmentTabs
          items={STATUS_TABS}
          value={status}
          labelFor={(item) =>
            item === 'all'
              ? m['activity.ai_tasks.tabs.all']()
              : statusLabel(item)
          }
          onChange={setStatus}
          dataAttr="status"
        />
      </div>

      {error ? (
        <div
          className="border-destructive/30 bg-destructive/5 text-destructive flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
          role="alert"
          data-ai-task-error
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={rows}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            rowKey={(row) => row.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={m['activity.ai_tasks.search_placeholder']()}
            onRefresh={() => query.refetch()}
            loading={query.isFetching}
            emptyText={
              error
                ? m['activity.ai_tasks.auth_empty']()
                : m['activity.ai_tasks.empty']()
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/activity/ai-tasks')({
  component: AITasksPage,
});
