import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Bot,
  BrainCircuit,
  Coins,
  Copy,
  History,
  Home,
  Key,
  KeyRound,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { apiDelete, apiGet, apiPost, type PageResult } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

function PageFrame({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary rounded-md p-2">{icon}</div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function getChatStreamDelta(line: string) {
  if (!line.startsWith('data:')) {
    return '';
  }

  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') {
    return '';
  }

  try {
    const data = JSON.parse(payload);
    const content =
      data?.choices?.[0]?.delta?.content ||
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      '';
    return typeof content === 'string' ? content : '';
  } catch {
    return '';
  }
}

function getChatStreamError(line: string) {
  if (!line.startsWith('data:')) {
    return '';
  }

  try {
    const data = JSON.parse(line.slice(5).trim());
    return typeof data?.message === 'string' ? data.message : '';
  } catch {
    return '';
  }
}

type ChatProviderAttempt = {
  provider?: string;
  model?: string;
  ok?: boolean;
  error?: string;
};

type ChatProviderMetadata = {
  provider?: string;
  model?: string;
  requestedProvider?: string;
  requestedModel?: string;
  attempts?: ChatProviderAttempt[];
};

function parseChatProviderMetadata(value: unknown): ChatProviderMetadata {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    const metadata = value as ChatProviderMetadata;
    return {
      ...metadata,
      attempts: Array.isArray(metadata.attempts) ? metadata.attempts : [],
    };
  }

  if (typeof value !== 'string') {
    return {};
  }

  try {
    const metadata = JSON.parse(value) as ChatProviderMetadata;
    return {
      ...metadata,
      attempts: Array.isArray(metadata.attempts) ? metadata.attempts : [],
    };
  } catch {
    return {};
  }
}

function getChatStreamMeta(line: string): ChatProviderMetadata | null {
  if (!line.startsWith('data:')) {
    return null;
  }

  try {
    const data = JSON.parse(line.slice(5).trim());
    if (data?.type !== 'chat_provider_meta') {
      return null;
    }
    return parseChatProviderMetadata(data);
  } catch {
    return null;
  }
}

function formatProviderAttempt(attempt: ChatProviderAttempt) {
  return [attempt.provider, attempt.model].filter(Boolean).join(' / ');
}

function getProviderAttemptSummary(metadata: ChatProviderMetadata) {
  const attempts = metadata.attempts || [];
  if (attempts.length <= 1) {
    return '';
  }

  const failed = attempts.filter((attempt) => !attempt.ok);
  const served = attempts.find((attempt) => attempt.ok);
  if (!failed.length || !served) {
    return '';
  }

  const failedLabels = failed.map(formatProviderAttempt).filter(Boolean);
  const servedLabel = formatProviderAttempt(served);
  if (!failedLabels.length || !servedLabel) {
    return '';
  }

  return `已兜底：${failedLabels.join(' -> ')} 失败，${servedLabel} 响应`;
}

function ProviderAttemptMeta({
  metadata,
  provider,
  model,
}: {
  metadata: ChatProviderMetadata;
  provider?: string;
  model?: string;
}) {
  const providerLabel = [metadata.provider || provider, metadata.model || model]
    .filter(Boolean)
    .join(' / ');
  const attemptSummary = getProviderAttemptSummary(metadata);

  if (!providerLabel && !attemptSummary) {
    return null;
  }

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {providerLabel ? <span>{providerLabel}</span> : null}
      {attemptSummary ? (
        <span
          className="bg-muted rounded-md px-1.5 py-0.5"
          data-chat-provider-attempts
        >
          {attemptSummary}
        </span>
      ) : null}
    </div>
  );
}

const CHAT_MODELS = [
  { title: 'Kimi K2 Thinking', name: 'moonshotai/kimi-k2-thinking' },
  { title: 'Deepseek R1', name: 'deepseek/deepseek-r1' },
  { title: 'GPT-5', name: 'openai/gpt-5' },
  { title: 'Claude 4.5 Sonnet', name: 'anthropic/claude-4.5-sonnet' },
] as const;

async function copyChatText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制');
  } catch {
    toast.error('复制失败');
  }
}

type ChatListItem = {
  id: string;
  title?: string;
  model?: string;
  createdAt?: string;
};

function ChatShell({
  activeId,
  children,
}: {
  activeId?: string;
  children: ReactNode;
}) {
  const chatsQuery = useQuery({
    queryKey: ['chat-shell-history'],
    queryFn: () =>
      apiPost<{
        list: ChatListItem[];
        hasMore: boolean;
      }>('/api/chat/list', { page: 1, limit: 10 }),
    retry: false,
  });
  const chats = chatsQuery.data?.list || [];

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      <aside className="border-border bg-muted/30 hidden w-72 shrink-0 border-r md:flex md:flex-col">
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <img src="/logo.png" alt="MediaClaw" className="size-8 rounded-md" />
          <span className="font-semibold">MediaClaw</span>
        </div>
        <div className="space-y-2 p-3">
          <Link
            href="/chat"
            className={buttonVariants({
              variant: 'outline',
              className: 'w-full justify-start gap-2',
            })}
          >
            <Plus className="size-4" />
            新建对话
          </Link>
          <Link
            href="/chat/history"
            className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm"
          >
            <History className="size-4" />
            历史对话
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-muted-foreground px-2 py-2 text-xs">历史对话</p>
          <div className="space-y-1">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  activeId === chat.id
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="line-clamp-1">
                  {chat.title || '未命名对话'}
                </span>
              </Link>
            ))}
            {!chatsQuery.isLoading && chats.length === 0 ? (
              <p className="text-muted-foreground px-3 py-2 text-sm">
                暂无对话记录
              </p>
            ) : null}
          </div>
        </div>
        <div className="border-border space-y-1 border-t p-3">
          <Link
            href="/"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm"
          >
            <Home className="size-4" />
            首页
          </Link>
          <Link
            href="/settings/profile"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm"
          >
            <UserRound className="size-4" />
            个人资料
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

function ChatComposer({
  message,
  model,
  reasoning,
  isSending,
  error,
  placeholder,
  submitLabel,
  onMessageChange,
  onModelChange,
  onReasoningChange,
  onSubmit,
}: {
  message: string;
  model: string;
  reasoning: boolean;
  isSending: boolean;
  error?: string | null;
  placeholder: string;
  submitLabel: string;
  onMessageChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onReasoningChange: (value: boolean) => void;
  onSubmit: () => void;
}) {
  const selectedModel =
    CHAT_MODELS.find((item) => item.name === model) || CHAT_MODELS[0];

  return (
    <form
      className="border-border bg-background/95 overflow-hidden rounded-2xl border shadow-lg shadow-neutral-950/5 backdrop-blur-sm"
      data-chat-composer
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Textarea
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 resize-none border-0 bg-transparent p-4 text-base shadow-none focus-visible:ring-0"
      />
      <div className="border-border flex flex-wrap items-center gap-2 border-t p-2">
        <div className="group relative">
          <button
            type="button"
            aria-label="Reasoning"
            aria-pressed={reasoning}
            title="Reasoning"
            className={cn(
              'hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg transition-colors',
              reasoning
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            data-chat-reasoning-toggle
            onClick={() => onReasoningChange(!reasoning)}
          >
            <BrainCircuit className="size-4" />
          </button>
          <span
            role="tooltip"
            className="bg-foreground text-background pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-md px-2 py-1 text-xs opacity-0 shadow-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            Reasoning
          </span>
        </div>
        <Select
          value={model}
          onValueChange={(value) => onModelChange(value || selectedModel.name)}
        >
          <SelectTrigger className="max-w-[15rem]" data-chat-model-trigger>
            <SelectValue>{selectedModel.title}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CHAT_MODELS.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isSending}
          aria-label={submitLabel}
          data-chat-submit
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
      {error ? (
        <p
          className="text-destructive border-border border-t px-4 py-2 text-sm"
          role="alert"
          data-chat-composer-error
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function LegacyLinkPage({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <PageFrame
      icon={<RefreshCw className="size-5" />}
      title={title}
      description={description}
    >
      <Card>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            This legacy route is now served by the TanStack app shell. Continue
            to the migrated workspace view.
          </p>
          <Button render={<Link href={href}>{label}</Link>} />
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function AdminCredentialGeneratePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [maxBindings, setMaxBindings] = useState('2');
  const [credits, setCredits] = useState('100');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const days = Number(durationDays || 0);
      const expiresAt =
        days > 0
          ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
          : null;
      return apiPost('/api/admin/credentials', {
        ownerEmail: email,
        planCode: 'custom',
        durationPreset: days > 0 ? `${days}d` : 'custom',
        maxBindings: Number(maxBindings || 1),
        totalCredits: Number(credits || 0),
        expiresAt,
        notes,
      });
    },
    onSuccess: () => {
      toast.success('Activation code generated');
      navigate({ to: '/admin/credentials' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<KeyRound className="size-5" />}
      title="Generate Activation Code"
      description="Create a formal or custom activation code for an existing MediaClaw user."
    >
      <Card>
        <CardContent>
          <form
            className="grid max-w-2xl gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <Field label="User email" value={email} onChange={setEmail} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Duration days"
                value={durationDays}
                onChange={setDurationDays}
                type="number"
              />
              <Field
                label="Max bindings"
                value={maxBindings}
                onChange={setMaxBindings}
                type="number"
              />
              <Field
                label="Credits"
                value={credits}
                onChange={setCredits}
                type="number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button className="w-fit gap-2" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function AdminCredentialRechargePage({ id }: { id: string }) {
  const navigate = useNavigate();
  const [durationDays, setDurationDays] = useState('30');
  const [maxBindings, setMaxBindings] = useState('');
  const [credits, setCredits] = useState('100');
  const [notes, setNotes] = useState('');

  const credentialQuery = useQuery({
    queryKey: ['admin-credential', id],
    queryFn: () => apiGet<any>(`/api/admin/credentials/${id}`),
  });

  useEffect(() => {
    const credential = credentialQuery.data;
    if (!credential) return;
    setMaxBindings(String(credential.maxBindings || 1));
    setNotes(credential.notes || '');
  }, [credentialQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost(`/api/admin/credentials/${id}`, {
        credits: Number(credits || 0),
        durationDays: Number(durationDays || 0),
        maxBindings: Number(maxBindings || 1),
        notes,
      }),
    onSuccess: () => {
      toast.success('Activation code recharged');
      navigate({ to: '/admin/credentials' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<KeyRound className="size-5" />}
      title="Recharge Activation Code"
      description="Extend validity, update binding capacity, and add usage credits to an activation code."
    >
      <Card>
        <CardContent className="space-y-5">
          {credentialQuery.data ? (
            <div className="bg-muted/50 rounded-md p-4 text-sm">
              <p className="font-mono">{credentialQuery.data.code}</p>
              <p className="text-muted-foreground mt-1">
                Status: {credentialQuery.data.status} · Owner:{' '}
                {credentialQuery.data.ownerUserId || 'unclaimed'}
              </p>
            </div>
          ) : null}
          <form
            className="grid max-w-2xl gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Add credits"
                value={credits}
                onChange={setCredits}
                type="number"
              />
              <Field
                label="Add days"
                value={durationDays}
                onChange={setDurationDays}
                type="number"
              />
              <Field
                label="Max bindings"
                value={maxBindings}
                onChange={setMaxBindings}
                type="number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recharge-notes">Notes</Label>
              <Textarea
                id="recharge-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
            <Button className="w-fit gap-2" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Coins className="size-4" />
              )}
              Recharge
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function ApiKeyCreatePage() {
  const [title, setTitle] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiPost<{ key: string }>('/api/apikeys', { title }),
    onSuccess: (data) => {
      setCreatedKey(data.key);
      toast.success('API key created');
      queryClient.invalidateQueries({ queryKey: ['apikeys'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<Key className="size-5" />}
      title="Create API Key"
      description="Create a MediaClaw API key for plugin or integration access."
    >
      <Card>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <Field label="Key name" value={title} onChange={setTitle} />
            {createdKey ? (
              <div className="bg-muted rounded-md p-3">
                <Label>Created key</Label>
                <p className="mt-2 font-mono text-sm break-all">{createdKey}</p>
              </div>
            ) : null}
            <Button className="w-fit gap-2" disabled={mutation.isPending}>
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function ApiKeyDeletePage({ id }: { id: string }) {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => apiDelete(`/api/apikeys?id=${id}`),
    onSuccess: () => {
      toast.success('API key deleted');
      navigate({ to: '/settings/apikeys' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<Trash2 className="size-5" />}
      title="Delete API Key"
      description="Confirm removal of this API key. Existing integrations using it will stop working."
    >
      <Card>
        <CardContent className="space-y-4">
          <p className="font-mono text-sm">{id}</p>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <Trash2 className="size-4" />
            Delete key
          </Button>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function AdminGrantCreditsPage({ userId }: { userId: string }) {
  const [credits, setCredits] = useState('100');
  const [description, setDescription] = useState('Admin grant');

  const mutation = useMutation({
    mutationFn: () =>
      apiPost('/api/admin/users/credits', {
        userId,
        action: 'grant',
        credits: Number(credits || 0),
        description,
      }),
    onSuccess: () => toast.success('Credits granted'),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<Coins className="size-5" />}
      title="Grant Credits"
      description="Add account credits to a MediaClaw user."
    >
      <Card>
        <CardContent>
          <form
            className="grid max-w-xl gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <p className="font-mono text-sm">{userId}</p>
            <Field
              label="Credits"
              value={credits}
              onChange={setCredits}
              type="number"
            />
            <Field
              label="Description"
              value={description}
              onChange={setDescription}
            />
            <Button className="w-fit gap-2" disabled={mutation.isPending}>
              <Coins className="size-4" />
              Grant
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}

export function ChatStartPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [model, setModel] = useState(CHAT_MODELS[0].name);
  const [reasoning, setReasoning] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<any>('/api/chat/new', {
        message: { text: message.trim() },
        body: { model, reasoning },
      }),
    onSuccess: (chat) => navigate({ to: '/chat/$id', params: { id: chat.id } }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <ChatShell>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="border-border bg-background flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <img src="/logo.png" alt="MediaClaw" className="size-7 rounded-md" />
          <span className="text-sm font-medium">MediaClaw</span>
        </header>
        <main className="mx-auto -mt-10 flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 pb-8">
          <h2 className="mb-5 text-center text-3xl font-bold">
            今天有什么可以帮到你？
          </h2>
          <ChatComposer
            message={message}
            model={model}
            reasoning={reasoning}
            error={mutation.error?.message || null}
            isSending={mutation.isPending}
            placeholder="你可以问我任何问题"
            submitLabel="Start chat"
            onMessageChange={(value) => {
              setMessage(value);
              if (mutation.error) {
                mutation.reset();
              }
            }}
            onModelChange={setModel}
            onReasoningChange={setReasoning}
            onSubmit={() => mutation.mutate()}
          />
        </main>
      </div>
    </ChatShell>
  );
}

export function ChatHistoryPage() {
  const [page, setPage] = useState(1);
  const historyQuery = useQuery({
    queryKey: ['chat-history', page],
    queryFn: () =>
      apiPost<{
        list: Array<{
          id: string;
          title: string;
          model: string;
          createdAt: string;
        }>;
        total: number;
        hasMore: boolean;
      }>('/api/chat/list', { page, limit: 20 }),
  });

  return (
    <ChatShell>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="border-border bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
          <History className="size-4" />
          <h1 className="text-sm font-normal">历史对话</h1>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-6">
            {(historyQuery.data?.list || []).map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="border-border hover:bg-muted block rounded-md border p-4 transition-colors"
              >
                <p className="font-medium">{chat.title || '未命名对话'}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {chat.model} · {new Date(chat.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
            {!historyQuery.isLoading && !historyQuery.data?.list?.length ? (
              <div className="border-border text-muted-foreground rounded-md border py-10 text-center text-sm">
                暂无对话记录。
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                disabled={!historyQuery.data?.hasMore}
                onClick={() => setPage((value) => value + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ChatShell>
  );
}

export function ChatDetailPage({ id }: { id: string }) {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState(CHAT_MODELS[0].name);
  const [reasoning, setReasoning] = useState(false);
  const [pendingUserText, setPendingUserText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [streamingMeta, setStreamingMeta] =
    useState<ChatProviderMetadata | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState('');
  const queryClient = useQueryClient();

  const chatQuery = useQuery({
    queryKey: ['chat-info', id],
    queryFn: () => apiPost<any>('/api/chat/info', { chatId: id }),
  });
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', id],
    queryFn: () =>
      apiPost<{
        list: Array<{
          id: string;
          role: string;
          parts: string;
          provider?: string;
          model?: string;
          metadata?: string | null;
          createdAt: string;
        }>;
      }>('/api/chat/messages', { chatId: id, page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (chatQuery.data?.model) setModel(chatQuery.data.model);
  }, [chatQuery.data]);

  async function sendMessage(inputText = message) {
    const text = inputText.trim();
    if (!text || isSending) {
      return;
    }

    setIsSending(true);
    setPendingUserText(text);
    setStreamingText('');
    setStreamingMeta(null);
    setSendError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: id,
          model,
          reasoning,
          message: { parts: [{ type: 'text', text }] },
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || 'Failed to send message');
      }

      setMessage('');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const meta = getChatStreamMeta(line);
          if (meta) {
            setStreamingMeta(meta);
            continue;
          }

          const error = getChatStreamError(line);
          if (error) {
            throw new Error(error);
          }

          const delta = getChatStreamDelta(line);
          if (delta) {
            setStreamingText((value) => value + delta);
          }
        }
      }

      if (buffer) {
        const meta = getChatStreamMeta(buffer);
        if (meta) {
          setStreamingMeta(meta);
        }

        const error = getChatStreamError(buffer);
        if (error) {
          throw new Error(error);
        }

        const delta = getChatStreamDelta(buffer);
        if (delta) {
          setStreamingText((value) => value + delta);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
      setLastFailedText('');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send message';
      setSendError(errorMessage);
      setLastFailedText(text);
      toast.error(errorMessage);
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', id] });
    } finally {
      setPendingUserText('');
      setStreamingText('');
      setStreamingMeta(null);
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (
      hasAutoSubmitted ||
      isSending ||
      !chatQuery.data ||
      !messagesQuery.data ||
      messagesQuery.data.list?.length
    ) {
      return;
    }

    let initialText = '';
    try {
      initialText = JSON.parse(chatQuery.data.content || '{}')?.text || '';
    } catch {
      initialText = '';
    }

    if (initialText.trim()) {
      setHasAutoSubmitted(true);
      void sendMessage(initialText);
    }
  }, [chatQuery.data, messagesQuery.data, hasAutoSubmitted, isSending]);

  const messages = useMemo(
    () =>
      (messagesQuery.data?.list || []).map((item) => {
        let text = '';
        try {
          text = JSON.parse(item.parts)
            .map((part: { text?: string }) => part.text || '')
            .join('\n');
        } catch {
          text = item.parts;
        }
        return {
          ...item,
          text,
          parsedMetadata: parseChatProviderMetadata(item.metadata),
        };
      }),
    [messagesQuery.data]
  );

  return (
    <ChatShell activeId={id}>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="border-border bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
          <MessageSquare className="size-4" />
          <h1 className="line-clamp-1 text-sm font-normal">
            {chatQuery.data?.title || 'Chat'}
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
            {messages.map((item) => (
              <div
                key={item.id}
                data-chat-message
                className={`flex ${
                  item.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      item.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70'
                    }`}
                  >
                    {item.text}
                  </div>
                  {item.role === 'assistant' && item.text ? (
                    <div className="flex flex-wrap items-center gap-1">
                      <ProviderAttemptMeta
                        metadata={item.parsedMetadata}
                        provider={item.provider}
                        model={item.model}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Copy assistant message"
                        data-chat-copy-message
                        onClick={() => void copyChatText(item.text)}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {pendingUserText ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap">
                  {pendingUserText}
                </div>
              </div>
            ) : null}
            {streamingText ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  <div className="bg-muted/70 rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap">
                    {streamingText}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {streamingMeta ? (
                      <ProviderAttemptMeta metadata={streamingMeta} />
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Copy streaming assistant message"
                      data-chat-copy-message
                      onClick={() => void copyChatText(streamingText)}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            {sendError ? (
              <div className="flex justify-start" data-chat-assistant-error>
                <div className="border-destructive/20 bg-destructive/10 text-destructive max-w-[85%] rounded-2xl border px-4 py-3 text-sm">
                  <p className="whitespace-pre-wrap">{sendError}</p>
                  {lastFailedText ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive mt-3"
                      onClick={() => void sendMessage(lastFailedText)}
                    >
                      重试
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {isSending && !streamingText ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                正在思考...
              </div>
            ) : null}
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <ChatComposer
            message={message}
            model={model}
            reasoning={reasoning}
            error={sendError}
            isSending={isSending}
            placeholder="你可以继续追问"
            submitLabel="Send message"
            onMessageChange={(value) => {
              setMessage(value);
              if (sendError) {
                setSendError(null);
              }
            }}
            onModelChange={setModel}
            onReasoningChange={setReasoning}
            onSubmit={() => void sendMessage()}
          />
        </div>
      </div>
    </ChatShell>
  );
}

export function ActivityLandingPage() {
  const items = [
    ['/activity/ai-tasks', 'AI tasks'],
    ['/activity/chats', 'Chats'],
    ['/activity/feedbacks', 'Feedbacks'],
    ['/activity/monitoring', 'Monitoring'],
  ] as const;

  return (
    <PageFrame
      icon={<History className="size-5" />}
      title="Activity"
      description="Access migrated MediaClaw activity workspaces."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="border-border hover:bg-muted rounded-md border p-4 transition-colors"
          >
            <p className="font-medium">{label}</p>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}

export function GeneratorPage({
  mediaType,
}: {
  mediaType: 'image' | 'video' | 'music';
}) {
  const [provider, setProvider] = useState('replicate');
  const [model, setModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const scene =
    mediaType === 'image'
      ? 'text-to-image'
      : mediaType === 'video'
        ? 'text-to-video'
        : 'text-to-music';

  const mutation = useMutation({
    mutationFn: () =>
      apiPost('/api/ai/generate', {
        provider,
        mediaType,
        model,
        prompt,
        scene,
      }),
    onSuccess: () => toast.success('AI task created'),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageFrame
      icon={<Bot className="size-5" />}
      title={`AI ${mediaType[0].toUpperCase()}${mediaType.slice(1)} Generator`}
      description="Create a migrated MediaClaw AI generation task."
    >
      <Card>
        <CardContent>
          <form
            className="grid max-w-3xl gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Provider" value={provider} onChange={setProvider} />
              <Field label="Model" value={model} onChange={setModel} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>
            <Button className="w-fit gap-2" disabled={mutation.isPending}>
              <Bot className="size-4" />
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
