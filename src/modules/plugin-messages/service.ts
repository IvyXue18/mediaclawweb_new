import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { pluginMessage, pluginMessageReceipt } from '@/config/db/schema';
import { getUuid } from '@/lib/hash';

export type PluginMessageAudience = {
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

export type PluginMessageAudienceContext = {
  authStatus: string;
  planCode: string;
  variantId: string;
  locale: string;
  userId: string;
  appVersion: string;
  usageDays: number;
  successfulOperationCount: number;
  outputActionCount: number;
};

export type PluginMessageInput = {
  title: string;
  summary?: string;
  bodyMarkdown?: string;
  category?: string;
  priority?: string;
  status?: string;
  actionLabel?: string;
  actionUrl?: string;
  audience?: PluginMessageAudience;
  isPinned?: boolean;
  sortOrder?: number;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
};

type PluginMessageEvent = 'impression' | 'read' | 'dismiss' | 'action';

type PluginMessageReceiptState = {
  contentVersion: number;
  firstImpressionAt: Date | null;
  readAt: Date | null;
  dismissedAt: Date | null;
  actionClickedAt: Date | null;
};

const VALID_CATEGORIES = new Set(['important', 'product', 'benefit', 'review']);
const VALID_PRIORITIES = new Set(['normal', 'important']);
const VALID_STATUSES = new Set(['draft', 'published', 'paused']);
const VALID_AUTH_STATUSES = new Set([
  'bound',
  'unbound',
  'unclaimed',
  'expired',
  'frozen',
]);

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function cleanPluginMessageMarkdown(value: unknown, maxLength = 2400) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[\t ]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function normalizeStringArray(value: unknown, maxItems = 100, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((item) => cleanText(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    ),
  ];
}

function normalizeNonNegativeInteger(value: unknown, max = 100_000) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.min(max, Math.floor(number));
}

function normalizeAudience(value: unknown): PluginMessageAudience {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    authStatuses: normalizeStringArray(source.authStatuses).filter((item) =>
      VALID_AUTH_STATUSES.has(item)
    ),
    planCodes: normalizeStringArray(source.planCodes),
    variantIds: normalizeStringArray(source.variantIds),
    locales: normalizeStringArray(source.locales, 20, 20).map((item) =>
      item.toLowerCase()
    ),
    userIds: normalizeStringArray(source.userIds, 500, 191),
    minAppVersion: cleanText(source.minAppVersion, 40),
    maxAppVersion: cleanText(source.maxAppVersion, 40),
    minUsageDays: normalizeNonNegativeInteger(source.minUsageDays, 3650),
    minSuccessfulOperations: normalizeNonNegativeInteger(
      source.minSuccessfulOperations
    ),
    requireOutputAction: source.requireOutputAction === true,
    reviewCycle: cleanText(source.reviewCycle, 40),
  };
}

export function parsePluginMessageAudience(value: unknown) {
  if (typeof value === 'string') {
    try {
      return normalizeAudience(JSON.parse(value));
    } catch {
      return normalizeAudience({});
    }
  }
  return normalizeAudience(value);
}

function versionParts(value: string) {
  return cleanText(value, 40)
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) && part >= 0 ? part : 0));
}

export function comparePluginVersions(left: string, right: string) {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index += 1) {
    if ((leftParts[index] || 0) > (rightParts[index] || 0)) return 1;
    if ((leftParts[index] || 0) < (rightParts[index] || 0)) return -1;
  }
  return 0;
}

export function matchesPluginMessageAudience(
  audienceInput: unknown,
  contextInput: Partial<PluginMessageAudienceContext>
) {
  const audience = parsePluginMessageAudience(audienceInput);
  const context: PluginMessageAudienceContext = {
    authStatus: cleanText(contextInput.authStatus, 30) || 'unbound',
    planCode: cleanText(contextInput.planCode, 80),
    variantId: cleanText(contextInput.variantId, 80) || 'official',
    locale: cleanText(contextInput.locale, 20).toLowerCase(),
    userId: cleanText(contextInput.userId, 191),
    appVersion: cleanText(contextInput.appVersion, 40),
    usageDays: normalizeNonNegativeInteger(contextInput.usageDays, 3650),
    successfulOperationCount: normalizeNonNegativeInteger(
      contextInput.successfulOperationCount
    ),
    outputActionCount: normalizeNonNegativeInteger(
      contextInput.outputActionCount
    ),
  };
  const includesOrAll = (values: string[] | undefined, current: string) =>
    !values?.length || values.includes(current);

  if (!includesOrAll(audience.authStatuses, context.authStatus)) return false;
  if (!includesOrAll(audience.planCodes, context.planCode)) return false;
  if (!includesOrAll(audience.variantIds, context.variantId)) return false;
  if (!includesOrAll(audience.locales, context.locale)) return false;
  if (!includesOrAll(audience.userIds, context.userId)) return false;
  if (
    audience.minAppVersion &&
    comparePluginVersions(context.appVersion, audience.minAppVersion) < 0
  ) {
    return false;
  }
  if (
    audience.maxAppVersion &&
    comparePluginVersions(context.appVersion, audience.maxAppVersion) > 0
  ) {
    return false;
  }
  if (audience.minUsageDays && context.usageDays < audience.minUsageDays) {
    return false;
  }
  if (
    audience.minSuccessfulOperations &&
    context.successfulOperationCount < audience.minSuccessfulOperations
  ) {
    return false;
  }
  if (audience.requireOutputAction && context.outputActionCount < 1) {
    return false;
  }
  return true;
}

export type ReviewInviteHistory = {
  messageId: string;
  reviewCycle: string;
  firstImpressionAt?: Date | null;
  readAt?: Date | null;
  dismissedAt?: Date | null;
  actionClickedAt?: Date | null;
};

function latestReviewActivity(entry: ReviewInviteHistory) {
  const timestamps = [
    entry.firstImpressionAt,
    entry.readAt,
    entry.dismissedAt,
    entry.actionClickedAt,
  ]
    .map((value) => value?.getTime?.() || 0)
    .filter(Boolean);
  return timestamps.length ? Math.max(...timestamps) : 0;
}

export function shouldSuppressReviewInvite(input: {
  candidateId: string;
  candidateCycle: string;
  history: ReviewInviteHistory[];
  now?: Date;
  cooldownDays?: number;
}) {
  const now = input.now || new Date();
  const cooldownMs = Math.max(1, input.cooldownDays || 90) * 86_400_000;
  return input.history.some((entry) => {
    if (entry.messageId === input.candidateId) {
      return Boolean(entry.dismissedAt || entry.actionClickedAt);
    }
    const activityAt = latestReviewActivity(entry);
    if (!activityAt) return false;
    if (entry.reviewCycle === input.candidateCycle) return true;
    return activityAt >= now.getTime() - cooldownMs;
  });
}

export function buildPluginMessageReceiptPatch(input: {
  event: PluginMessageEvent;
  contentVersion: number;
  existing?: PluginMessageReceiptState | null;
  now?: Date;
}) {
  const now = input.now || new Date();
  const isNewContent =
    !input.existing || input.existing.contentVersion < input.contentVersion;
  return {
    contentVersion: input.contentVersion,
    ...(isNewContent
      ? {
          firstImpressionAt: null,
          readAt: null,
          dismissedAt: null,
          actionClickedAt: null,
        }
      : {}),
    ...(input.event === 'impression' &&
    (isNewContent || !input.existing?.firstImpressionAt)
      ? { firstImpressionAt: now }
      : {}),
    ...(input.event === 'read' ? { readAt: now } : {}),
    ...(input.event === 'dismiss' ? { readAt: now, dismissedAt: now } : {}),
    ...(input.event === 'action' ? { readAt: now, actionClickedAt: now } : {}),
    updatedAt: now,
  };
}

function toOptionalDate(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeActionUrl(value: unknown) {
  const raw = cleanText(value, 1000);
  if (!raw) return '';
  try {
    const appUrl = new URL(envConfigs.app_url);
    const target = new URL(raw, appUrl);
    if (target.origin !== appUrl.origin) {
      throw new Error('Message action must use the official website origin');
    }
    return target.toString();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Invalid message action URL');
  }
}

function normalizedInput(input: PluginMessageInput) {
  const title = cleanText(input.title, 80);
  if (!title) throw new Error('Message title is required');
  const summary = cleanText(input.summary, 360);
  const bodyMarkdown = cleanPluginMessageMarkdown(input.bodyMarkdown);
  const category = VALID_CATEGORIES.has(String(input.category))
    ? String(input.category)
    : 'product';
  const priority =
    category === 'review'
      ? 'normal'
      : VALID_PRIORITIES.has(String(input.priority))
        ? String(input.priority)
        : 'normal';
  const status = VALID_STATUSES.has(String(input.status))
    ? String(input.status)
    : 'draft';
  const actionUrl =
    category === 'review' ? '' : normalizeActionUrl(input.actionUrl);
  const actionLabel =
    category === 'review'
      ? cleanText(input.actionLabel, 30) || '去应用商店评价'
      : actionUrl
        ? cleanText(input.actionLabel, 30)
        : '';
  const audience = normalizeAudience(input.audience);
  if (category === 'review' && !audience.reviewCycle) {
    throw new Error('Review cycle is required');
  }
  return {
    title,
    summary,
    bodyMarkdown,
    category,
    priority,
    status,
    actionLabel,
    actionUrl,
    audienceJson: JSON.stringify(audience),
    isPinned: category === 'review' ? false : Boolean(input.isPinned),
    sortOrder: Math.max(-1000, Math.min(1000, Number(input.sortOrder) || 0)),
    startsAt: toOptionalDate(input.startsAt),
    endsAt: toOptionalDate(input.endsAt),
  };
}

function adminShape(row: typeof pluginMessage.$inferSelect) {
  return {
    ...row,
    audience: parsePluginMessageAudience(row.audienceJson),
  };
}

export async function listAdminPluginMessages() {
  const rows = await db()
    .select()
    .from(pluginMessage)
    .orderBy(desc(pluginMessage.updatedAt));
  return rows.map(adminShape);
}

export async function createPluginMessage(
  input: PluginMessageInput,
  createdBy: string
) {
  const normalized = normalizedInput(input);
  const now = new Date();
  const id = getUuid();
  await db()
    .insert(pluginMessage)
    .values({
      id,
      ...normalized,
      publishedAt: normalized.status === 'published' ? now : null,
      createdBy: cleanText(createdBy, 191),
      createdAt: now,
      updatedAt: now,
    });
  const [created] = await db()
    .select()
    .from(pluginMessage)
    .where(eq(pluginMessage.id, id))
    .limit(1);
  if (!created) throw new Error('Message creation could not be confirmed');
  return adminShape(created);
}

export async function updatePluginMessage(
  id: string,
  input: Partial<PluginMessageInput> & { realert?: boolean }
) {
  const [existing] = await db()
    .select()
    .from(pluginMessage)
    .where(eq(pluginMessage.id, cleanText(id, 191)))
    .limit(1);
  if (!existing) return null;
  if (input.realert && existing.category === 'review') {
    throw new Error(
      'Review invites cannot be re-alerted within the same cycle'
    );
  }

  const normalized = normalizedInput({
    title: input.title ?? existing.title,
    summary: input.summary ?? existing.summary,
    bodyMarkdown: input.bodyMarkdown ?? existing.bodyMarkdown,
    category: input.category ?? existing.category,
    priority: input.priority ?? existing.priority,
    status: input.status ?? existing.status,
    actionLabel: input.actionLabel ?? existing.actionLabel,
    actionUrl: input.actionUrl ?? existing.actionUrl,
    audience:
      input.audience ?? parsePluginMessageAudience(existing.audienceJson),
    isPinned: input.isPinned ?? existing.isPinned,
    sortOrder: input.sortOrder ?? existing.sortOrder,
    startsAt: input.startsAt === undefined ? existing.startsAt : input.startsAt,
    endsAt: input.endsAt === undefined ? existing.endsAt : input.endsAt,
  });
  const now = new Date();
  await db()
    .update(pluginMessage)
    .set({
      ...normalized,
      contentVersion: input.realert
        ? existing.contentVersion + 1
        : existing.contentVersion,
      publishedAt:
        normalized.status === 'published'
          ? existing.publishedAt || now
          : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(pluginMessage.id, existing.id));
  const [updated] = await db()
    .select()
    .from(pluginMessage)
    .where(eq(pluginMessage.id, existing.id))
    .limit(1);
  return updated ? adminShape(updated) : null;
}

export async function getPluginMessageFeed(input: {
  subjectKey: string;
  context: PluginMessageAudienceContext;
  now?: Date;
}) {
  const now = input.now || new Date();
  const rows = await db()
    .select()
    .from(pluginMessage)
    .where(eq(pluginMessage.status, 'published'))
    .orderBy(
      desc(pluginMessage.isPinned),
      desc(pluginMessage.sortOrder),
      desc(pluginMessage.publishedAt)
    );
  const matched = rows.filter(
    (row) =>
      (!row.startsAt || row.startsAt <= now) &&
      (!row.endsAt || row.endsAt > now) &&
      matchesPluginMessageAudience(row.audienceJson, input.context)
  );
  const ids = matched.map((row) => row.id);
  const receipts = ids.length
    ? await db()
        .select()
        .from(pluginMessageReceipt)
        .where(
          and(
            eq(pluginMessageReceipt.subjectKey, input.subjectKey),
            inArray(pluginMessageReceipt.messageId, ids)
          )
        )
    : [];
  const receiptByMessage = new Map(
    receipts.map((receipt) => [receipt.messageId, receipt])
  );
  const reviewHistoryRows = matched.some((row) => row.category === 'review')
    ? await db()
        .select({
          messageId: pluginMessage.id,
          audienceJson: pluginMessage.audienceJson,
          firstImpressionAt: pluginMessageReceipt.firstImpressionAt,
          readAt: pluginMessageReceipt.readAt,
          dismissedAt: pluginMessageReceipt.dismissedAt,
          actionClickedAt: pluginMessageReceipt.actionClickedAt,
        })
        .from(pluginMessageReceipt)
        .innerJoin(
          pluginMessage,
          eq(pluginMessageReceipt.messageId, pluginMessage.id)
        )
        .where(
          and(
            eq(pluginMessageReceipt.subjectKey, input.subjectKey),
            eq(pluginMessage.category, 'review')
          )
        )
    : [];
  const reviewHistory: ReviewInviteHistory[] = reviewHistoryRows.map((row) => ({
    messageId: row.messageId,
    reviewCycle: parsePluginMessageAudience(row.audienceJson).reviewCycle || '',
    firstImpressionAt: row.firstImpressionAt,
    readAt: row.readAt,
    dismissedAt: row.dismissedAt,
    actionClickedAt: row.actionClickedAt,
  }));
  let reviewCandidateIncluded = false;
  const items = matched
    .filter((row) => {
      const receipt = receiptByMessage.get(row.id);
      if (
        receipt?.dismissedAt &&
        receipt.contentVersion >= row.contentVersion
      ) {
        return false;
      }
      if (row.category !== 'review') return true;
      if (
        receipt?.actionClickedAt &&
        receipt.contentVersion >= row.contentVersion
      ) {
        return false;
      }
      if (reviewCandidateIncluded) return false;
      const cycle =
        parsePluginMessageAudience(row.audienceJson).reviewCycle || '';
      if (
        shouldSuppressReviewInvite({
          candidateId: row.id,
          candidateCycle: cycle,
          history: reviewHistory,
          now,
        })
      ) {
        return false;
      }
      reviewCandidateIncluded = true;
      return true;
    })
    .map((row) => {
      const receipt = receiptByMessage.get(row.id);
      const isRead = Boolean(
        receipt?.readAt && receipt.contentVersion >= row.contentVersion
      );
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        bodyMarkdown: row.bodyMarkdown,
        category: row.category,
        priority: row.priority,
        actionLabel: row.actionLabel,
        actionUrl: row.actionUrl,
        isPinned: row.isPinned,
        isRead,
        publishedAt: row.publishedAt || row.createdAt,
      };
    });
  return {
    items,
    unreadCount: items.filter((item) => !item.isRead).length,
  };
}

export async function recordPluginMessageEvent(input: {
  subjectKey: string;
  messageIds: string[];
  event: PluginMessageEvent;
}) {
  const messageIds = normalizeStringArray(input.messageIds, 100, 191);
  if (!messageIds.length) return { updated: 0 };
  const messages = await db()
    .select({
      id: pluginMessage.id,
      contentVersion: pluginMessage.contentVersion,
    })
    .from(pluginMessage)
    .where(inArray(pluginMessage.id, messageIds));
  const now = new Date();
  let updated = 0;
  for (const message of messages) {
    const [existing] = await db()
      .select()
      .from(pluginMessageReceipt)
      .where(
        and(
          eq(pluginMessageReceipt.messageId, message.id),
          eq(pluginMessageReceipt.subjectKey, input.subjectKey)
        )
      )
      .limit(1);
    const patch = buildPluginMessageReceiptPatch({
      event: input.event,
      contentVersion: message.contentVersion,
      existing,
      now,
    });
    if (existing) {
      await db()
        .update(pluginMessageReceipt)
        .set(patch)
        .where(eq(pluginMessageReceipt.id, existing.id));
    } else {
      await db()
        .insert(pluginMessageReceipt)
        .values({
          id: getUuid(),
          messageId: message.id,
          subjectKey: input.subjectKey,
          ...patch,
          createdAt: now,
        });
    }
    updated += 1;
  }
  return { updated };
}
