import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  BellRing,
  CalendarClock,
  Megaphone,
  Pencil,
  Plus,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { m } from '@/paraglide/messages.js';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type Audience = {
  authStatuses?: string[];
  planCodes?: string[];
  variantIds?: string[];
  locales?: string[];
  userIds?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
  minUsageDays?: number;
  minSuccessfulOperations?: number;
  requireOutputAction?: boolean;
  reviewCycle?: string;
};

type MessageRow = {
  id: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  category: string;
  priority: string;
  status: string;
  actionLabel: string;
  actionUrl: string;
  audience: Audience;
  isPinned: boolean;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
  publishedAt?: string | null;
  contentVersion: number;
  updatedAt: string;
};

type FormState = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  category: string;
  priority: string;
  status: string;
  actionLabel: string;
  actionUrl: string;
  startsAt: string;
  endsAt: string;
  authStatuses: string;
  planCodes: string;
  variantIds: string;
  locales: string;
  userIds: string;
  minAppVersion: string;
  maxAppVersion: string;
  minUsageDays: string;
  minSuccessfulOperations: string;
  requireOutputAction: boolean;
  reviewCycle: string;
  isPinned: boolean;
  sortOrder: number;
};

const EMPTY_FORM: FormState = {
  title: '',
  summary: '',
  bodyMarkdown: '',
  category: 'product',
  priority: 'normal',
  status: 'draft',
  actionLabel: '',
  actionUrl: '',
  startsAt: '',
  endsAt: '',
  authStatuses: '',
  planCodes: '',
  variantIds: '',
  locales: '',
  userIds: '',
  minAppVersion: '',
  maxAppVersion: '',
  minUsageDays: '',
  minSuccessfulOperations: '',
  requireOutputAction: false,
  reviewCycle: '',
  isPinned: false,
  sortOrder: 0,
};

const REVIEW_FORM: FormState = {
  ...EMPTY_FORM,
  title: '愿意分享您的真实使用体验吗？',
  summary: '您的真实评价能帮助更多用户了解 MediaClaw，也会帮助我们继续改进。',
  bodyMarkdown:
    '感谢您持续使用 MediaClaw。\n\n如果方便，欢迎您在当前浏览器的扩展商店分享真实使用体验。每一条真实反馈和鼓励，都会帮助我们把产品做得更好。',
  category: 'review',
  actionLabel: '去应用商店评价',
  authStatuses: 'bound',
  minUsageDays: '3',
  minSuccessfulOperations: '5',
  requireOutputAction: true,
  reviewCycle: '0.3',
};

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50';

function csv(value?: string[]) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function datetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formFromRow(row: MessageRow): FormState {
  return {
    title: row.title,
    summary: row.summary,
    bodyMarkdown: row.bodyMarkdown || '',
    category: row.category,
    priority: row.priority,
    status: row.status,
    actionLabel: row.actionLabel,
    actionUrl: row.actionUrl,
    startsAt: datetimeLocal(row.startsAt),
    endsAt: datetimeLocal(row.endsAt),
    authStatuses: csv(row.audience.authStatuses),
    planCodes: csv(row.audience.planCodes),
    variantIds: csv(row.audience.variantIds),
    locales: csv(row.audience.locales),
    userIds: csv(row.audience.userIds),
    minAppVersion: row.audience.minAppVersion || '',
    maxAppVersion: row.audience.maxAppVersion || '',
    minUsageDays: String(row.audience.minUsageDays || ''),
    minSuccessfulOperations: String(row.audience.minSuccessfulOperations || ''),
    requireOutputAction: row.audience.requireOutputAction === true,
    reviewCycle: row.audience.reviewCycle || '',
    isPinned: row.isPinned,
    sortOrder: row.sortOrder || 0,
  };
}

function payload(form: FormState) {
  return {
    title: form.title,
    summary: form.summary,
    bodyMarkdown: form.bodyMarkdown,
    category: form.category,
    priority: form.priority,
    status: form.status,
    actionLabel: form.actionLabel,
    actionUrl: form.actionUrl,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    isPinned: form.isPinned,
    sortOrder: form.sortOrder,
    audience: {
      authStatuses: splitCsv(form.authStatuses),
      planCodes: splitCsv(form.planCodes),
      variantIds: splitCsv(form.variantIds),
      locales: splitCsv(form.locales),
      userIds: splitCsv(form.userIds),
      minAppVersion: form.minAppVersion,
      maxAppVersion: form.maxAppVersion,
      minUsageDays: Number(form.minUsageDays) || 0,
      minSuccessfulOperations: Number(form.minSuccessfulOperations) || 0,
      requireOutputAction: form.requireOutputAction,
      reviewCycle: form.reviewCycle,
    },
  };
}

function categoryLabel(value: string) {
  if (value === 'important')
    return m['admin.notifications.categories.important']();
  if (value === 'benefit') return m['admin.notifications.categories.benefit']();
  if (value === 'review') return m['admin.notifications.categories.review']();
  return m['admin.notifications.categories.product']();
}

function statusLabel(value: string) {
  if (value === 'published')
    return m['admin.notifications.statuses.published']();
  if (value === 'paused') return m['admin.notifications.statuses.paused']();
  return m['admin.notifications.statuses.draft']();
}

function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MessageRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const query = useQuery({
    queryKey: ['admin-plugin-messages'],
    queryFn: () => apiGet<MessageRow[]>('/api/admin/plugin-messages'),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? apiPatch('/api/admin/plugin-messages', {
            id: editing.id,
            ...payload(form),
          })
        : apiPost('/api/admin/plugin-messages', payload(form)),
    onSuccess: () => {
      toast.success(
        editing
          ? m['admin.notifications.updated']()
          : m['admin.notifications.created']()
      );
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-plugin-messages'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const quickMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPatch('/api/admin/plugin-messages', body),
    onSuccess: () => {
      toast.success(m['admin.notifications.updated']());
      queryClient.invalidateQueries({ queryKey: ['admin-plugin-messages'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof FormState, value: string | boolean | number) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setCategory = (category: string) =>
    setForm((current) =>
      category === 'review'
        ? {
            ...current,
            category,
            priority: 'normal',
            actionLabel: current.actionLabel || '去应用商店评价',
            actionUrl: '',
            isPinned: false,
            reviewCycle: current.reviewCycle || '0.3',
          }
        : { ...current, category }
    );
  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };
  const startCreateReview = () => {
    setEditing(null);
    setForm(REVIEW_FORM);
    setOpen(true);
  };
  const startEdit = (row: MessageRow) => {
    setEditing(row);
    setForm(formFromRow(row));
    setOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <Megaphone className="size-4" />
            <span className="text-xs font-semibold tracking-[0.18em] uppercase">
              Audience Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-bold">
            {m['admin.notifications.title']()}
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {m['admin.notifications.description']()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={startCreateReview}
          >
            <Star className="size-4" />
            {m['admin.notifications.create_review']()}
          </Button>
          <Button className="gap-2" onClick={startCreate}>
            <Plus className="size-4" />
            {m['admin.notifications.create']()}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {(query.data || []).map((row) => (
          <Card
            key={row.id}
            className={
              row.priority === 'important'
                ? 'border-red-200 bg-[linear-gradient(135deg,rgba(254,242,242,.85),rgba(255,255,255,1))] dark:border-red-900/60 dark:bg-none'
                : 'overflow-hidden'
            }
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        row.status === 'published' ? 'default' : 'secondary'
                      }
                    >
                      {statusLabel(row.status)}
                    </Badge>
                    <Badge variant="outline">
                      {categoryLabel(row.category)}
                    </Badge>
                    {row.isPinned && (
                      <Badge variant="outline">
                        {m['admin.notifications.pinned']()}
                      </Badge>
                    )}
                    {row.bodyMarkdown && (
                      <Badge variant="outline">
                        {m['admin.notifications.has_detail']()}
                      </Badge>
                    )}
                    <span className="text-muted-foreground text-xs">
                      v{row.contentVersion}
                    </span>
                  </div>
                  <h2 className="truncate text-lg font-semibold">
                    {row.title}
                  </h2>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {row.summary || '—'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(row)}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3.5" />
                  {row.startsAt
                    ? new Date(row.startsAt).toLocaleString()
                    : m['admin.notifications.starts_immediately']()}
                </span>
                <span>
                  {row.endsAt
                    ? m['admin.notifications.until']({
                        date: new Date(row.endsAt).toLocaleString(),
                      })
                    : m['admin.notifications.no_expiry']()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    quickMutation.mutate({
                      id: row.id,
                      status:
                        row.status === 'published' ? 'paused' : 'published',
                    })
                  }
                >
                  {row.status === 'published'
                    ? m['admin.notifications.pause']()
                    : m['admin.notifications.publish']()}
                </Button>
                {row.status === 'published' && row.category !== 'review' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    title={m['admin.notifications.realert_confirm']()}
                    onClick={() =>
                      quickMutation.mutate({ id: row.id, realert: true })
                    }
                  >
                    <BellRing className="size-3.5" />
                    {m['admin.notifications.realert']()}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!query.isLoading && !query.data?.length && (
        <div className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center">
          {m['admin.notifications.empty']()}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? m['admin.notifications.edit']()
                : m['admin.notifications.create']()}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <Field
              label={m['admin.notifications.fields.title']()}
              className="md:col-span-2"
            >
              <Input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Field>
            <Field
              label={m['admin.notifications.fields.summary']()}
              className="md:col-span-2"
            >
              <Textarea
                value={form.summary}
                maxLength={360}
                onChange={(e) => set('summary', e.target.value)}
              />
            </Field>
            <Field
              label={m['admin.notifications.fields.body_markdown']()}
              className="md:col-span-2"
            >
              <Textarea
                value={form.bodyMarkdown}
                rows={9}
                maxLength={2400}
                className="min-h-48 font-mono text-sm leading-6"
                onChange={(e) => set('bodyMarkdown', e.target.value)}
                placeholder={m[
                  'admin.notifications.body_markdown_placeholder'
                ]()}
              />
              <div className="text-muted-foreground mt-2 flex items-start justify-between gap-4 text-xs">
                <span>{m['admin.notifications.body_markdown_hint']()}</span>
                <span className="shrink-0">
                  {form.bodyMarkdown.length} / 2400
                </span>
              </div>
            </Field>
            <Field label={m['admin.notifications.fields.category']()}>
              <select
                className={selectClass}
                value={form.category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="important">
                  {m['admin.notifications.categories.important']()}
                </option>
                <option value="product">
                  {m['admin.notifications.categories.product']()}
                </option>
                <option value="benefit">
                  {m['admin.notifications.categories.benefit']()}
                </option>
                <option value="review">
                  {m['admin.notifications.categories.review']()}
                </option>
              </select>
            </Field>
            <Field label={m['admin.notifications.fields.priority']()}>
              <select
                className={selectClass}
                value={form.priority}
                disabled={form.category === 'review'}
                onChange={(e) => set('priority', e.target.value)}
              >
                <option value="normal">
                  {m['admin.notifications.priorities.normal']()}
                </option>
                <option value="important">
                  {m['admin.notifications.priorities.important']()}
                </option>
              </select>
            </Field>
            <Field label={m['admin.notifications.fields.status']()}>
              <select
                className={selectClass}
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="draft">
                  {m['admin.notifications.statuses.draft']()}
                </option>
                <option value="published">
                  {m['admin.notifications.statuses.published']()}
                </option>
                <option value="paused">
                  {m['admin.notifications.statuses.paused']()}
                </option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-end gap-3 pb-2">
                <Switch
                  checked={form.isPinned}
                  disabled={form.category === 'review'}
                  onCheckedChange={(checked) => set('isPinned', checked)}
                />
                <Label>{m['admin.notifications.fields.pinned']()}</Label>
              </div>
              <Field label={m['admin.notifications.fields.sort_order']()}>
                <Input
                  type="number"
                  min={-1000}
                  max={1000}
                  value={form.sortOrder}
                  onChange={(e) => set('sortOrder', Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label={m['admin.notifications.fields.action_label']()}>
              <Input
                value={form.actionLabel}
                readOnly={form.category === 'review'}
                onChange={(e) => set('actionLabel', e.target.value)}
                placeholder={m['admin.notifications.action_placeholder']()}
              />
            </Field>
            <Field label={m['admin.notifications.fields.action_url']()}>
              <Input
                value={form.actionUrl}
                disabled={form.category === 'review'}
                onChange={(e) => set('actionUrl', e.target.value)}
                placeholder={
                  form.category === 'review'
                    ? m['admin.notifications.store_action_hint']()
                    : 'https://mediaclaw.app/...'
                }
              />
            </Field>
            <Field label={m['admin.notifications.fields.starts_at']()}>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set('startsAt', e.target.value)}
              />
            </Field>
            <Field label={m['admin.notifications.fields.ends_at']()}>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => set('endsAt', e.target.value)}
              />
            </Field>
            <div className="bg-muted/30 rounded-xl border p-4 md:col-span-2">
              <p className="mb-4 text-sm font-medium">
                {m['admin.notifications.audience_title']()}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={m['admin.notifications.fields.auth_statuses']()}>
                  <Input
                    value={form.authStatuses}
                    onChange={(e) => set('authStatuses', e.target.value)}
                    placeholder="bound, unbound, expired"
                  />
                </Field>
                <Field label={m['admin.notifications.fields.plan_codes']()}>
                  <Input
                    value={form.planCodes}
                    onChange={(e) => set('planCodes', e.target.value)}
                    placeholder="trial, pro"
                  />
                </Field>
                <Field label={m['admin.notifications.fields.variant_ids']()}>
                  <Input
                    value={form.variantIds}
                    onChange={(e) => set('variantIds', e.target.value)}
                    placeholder="official"
                  />
                </Field>
                <Field label={m['admin.notifications.fields.locales']()}>
                  <Input
                    value={form.locales}
                    onChange={(e) => set('locales', e.target.value)}
                    placeholder="zh, en"
                  />
                </Field>
                <Field
                  label={m['admin.notifications.fields.user_ids']()}
                  className="md:col-span-2"
                >
                  <Textarea
                    value={form.userIds}
                    onChange={(e) => set('userIds', e.target.value)}
                  />
                </Field>
                <Field label={m['admin.notifications.fields.version_range']()}>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={form.minAppVersion}
                      onChange={(e) => set('minAppVersion', e.target.value)}
                      placeholder={m[
                        'admin.notifications.min_version_placeholder'
                      ]()}
                    />
                    <Input
                      value={form.maxAppVersion}
                      onChange={(e) => set('maxAppVersion', e.target.value)}
                      placeholder={m[
                        'admin.notifications.max_version_placeholder'
                      ]()}
                    />
                  </div>
                </Field>
                <Field label={m['admin.notifications.fields.min_usage_days']()}>
                  <Input
                    type="number"
                    min={0}
                    value={form.minUsageDays}
                    onChange={(e) => set('minUsageDays', e.target.value)}
                  />
                </Field>
                <Field
                  label={m[
                    'admin.notifications.fields.min_successful_operations'
                  ]()}
                >
                  <Input
                    type="number"
                    min={0}
                    value={form.minSuccessfulOperations}
                    onChange={(e) =>
                      set('minSuccessfulOperations', e.target.value)
                    }
                  />
                </Field>
                <div className="flex items-end gap-3 pb-2">
                  <Switch
                    checked={form.requireOutputAction}
                    onCheckedChange={(checked) =>
                      set('requireOutputAction', checked)
                    }
                  />
                  <Label>
                    {m['admin.notifications.fields.require_output_action']()}
                  </Label>
                </div>
                {form.category === 'review' && (
                  <Field label={m['admin.notifications.fields.review_cycle']()}>
                    <Input
                      value={form.reviewCycle}
                      onChange={(e) => set('reviewCycle', e.target.value)}
                      placeholder="0.3"
                    />
                  </Field>
                )}
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {m['admin.notifications.audience_hint']()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {m['admin.notifications.cancel']()}
            </Button>
            <Button
              disabled={
                !form.title.trim() ||
                (form.category === 'review' && !form.reviewCycle.trim()) ||
                saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {m['admin.notifications.save']()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export const Route = createFileRoute('/admin/notifications')({
  component: AdminNotificationsPage,
});
