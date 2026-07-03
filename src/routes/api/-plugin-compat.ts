import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  credential,
  credentialCredit,
  user,
  welfareUsageSummary,
} from '@/config/db/schema';

export type PluginCredentialAccess =
  | {
      ok: true;
      data: Awaited<ReturnType<typeof buildPluginCredentialPayload>>;
    }
  | {
      ok: false;
      reason: string;
      message: string;
      data?: unknown;
    };

export function pluginOk(data: unknown = null, message = 'success') {
  return Response.json({
    ok: true,
    status: 'ok',
    reason: 'none',
    message,
    data,
  });
}

export function pluginErr(
  reason: string,
  message: string,
  data: unknown = null,
  init?: ResponseInit
) {
  return Response.json(
    {
      ok: false,
      status: 'error',
      reason,
      message,
      data,
    },
    init
  );
}

export function pluginNotMigrated(feature: string) {
  return pluginErr(
    'not_migrated',
    `${feature} has not been migrated to the new website backend yet`
  );
}

export async function readJsonBody(request: Request) {
  return request.json().catch(() => ({}));
}

export function codeFromRequest(
  request: Request,
  body?: Record<string, unknown>
) {
  const url = new URL(request.url);
  const raw =
    body?.code ||
    body?.credentialCode ||
    body?.credential_code ||
    body?.activationCode ||
    url.searchParams.get('code') ||
    url.searchParams.get('credentialCode') ||
    url.searchParams.get('credential_code');

  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function toIso(value: Date | string | number | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isExpired(value: Date | string | number | null | undefined) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

function resolveVariant(input: {
  variantId?: string | null;
  partnerId?: string | null;
}) {
  const variantId = String(input.variantId || 'official').trim() || 'official';
  const isOfficial = variantId === 'official';
  return {
    variantId,
    partnerId: String(input.partnerId || '').trim(),
    brandName: '',
    hideOfficialEntry: !isOfficial,
    capabilities: {
      allowMediaclawSync: isOfficial,
      allowFeishuSync: true,
      allowCustomSync: !isOfficial,
      allowBridge: isOfficial,
    },
  };
}

async function buildPluginCredentialPayload(input: {
  row: typeof credential.$inferSelect;
  clientUuid?: string;
  clientLabel?: string;
  appVersion?: string;
}) {
  const [owner] = input.row.ownerUserId
    ? await db()
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, input.row.ownerUserId))
        .limit(1)
    : [];

  const creditRows = await db()
    .select()
    .from(credentialCredit)
    .where(eq(credentialCredit.credentialCode, input.row.code));

  const totalCredits = creditRows.reduce(
    (sum, item) => sum + Number(item.totalCredits || 0),
    0
  );
  const usedCredits = creditRows.reduce(
    (sum, item) => sum + Number(item.usedCredits || 0),
    0
  );
  const remainingCredits = Math.max(totalCredits - usedCredits, 0);
  const firstCredit = creditRows[0] || null;
  const nowIso = new Date().toISOString();
  const variant = resolveVariant(input.row);
  const clientUuid = input.clientUuid || 'web-compat-client';
  const clientLabel = input.clientLabel || 'MediaClaw Web Compat';
  const currentBindings = input.row.ownerUserId ? 1 : 0;

  return {
    credential: {
      id: input.row.id,
      code: input.row.code,
      type: input.row.planCode || 'credential',
      planCode: input.row.planCode,
      partnerId: input.row.partnerId,
      variantId: input.row.variantId || 'official',
      variant,
      status: input.row.status,
      expiresAt: toIso(input.row.expiresAt),
      maxBindings: input.row.maxBindings,
      currentBindings,
    },
    variant,
    user: owner
      ? {
          ...owner,
          defaultBillingCredentialId: input.row.id,
        }
      : null,
    credentialCredit: firstCredit
      ? {
          id: firstCredit.id,
          credentialId: firstCredit.credentialId || input.row.id,
          credentialCode: firstCredit.credentialCode,
          totalCredits,
          usedCredits,
          remainingCredits,
          expiresAt: toIso(firstCredit.expiresAt),
          status: firstCredit.status,
        }
      : null,
    binding: {
      id: `compat:${input.row.id}:${clientUuid}`,
      clientUuid,
      clientLabel,
      status: 'active',
      firstBoundAt: nowIso,
      lastVerifiedAt: nowIso,
    },
    replacedBinding: null,
    appVersion: input.appVersion || '',
  };
}

export async function resolvePluginCredentialAccess(input: {
  code: string;
  clientUuid?: string;
  clientLabel?: string;
  appVersion?: string;
}): Promise<PluginCredentialAccess> {
  const code = input.code.trim().toUpperCase();
  if (!code) {
    return {
      ok: false,
      reason: 'invalid_request',
      message: 'credential code is required',
    };
  }

  const [row] = await db()
    .select()
    .from(credential)
    .where(and(eq(credential.code, code), isNull(credential.deletedAt)))
    .limit(1);

  if (!row) {
    return {
      ok: false,
      reason: 'not_found',
      message: 'credential not found',
    };
  }

  if (row.status !== 'active') {
    return {
      ok: false,
      reason: row.status === 'expired' ? 'expired' : 'frozen',
      message: `credential is ${row.status}`,
    };
  }

  if (isExpired(row.expiresAt)) {
    return {
      ok: false,
      reason: 'expired',
      message: 'credential is expired',
    };
  }

  return {
    ok: true,
    data: await buildPluginCredentialPayload({
      row,
      clientUuid: input.clientUuid,
      clientLabel: input.clientLabel,
      appVersion: input.appVersion,
    }),
  };
}

export async function readWelfareUsage(credentialCode: string) {
  const [row] = await db()
    .select()
    .from(welfareUsageSummary)
    .where(eq(welfareUsageSummary.credentialCode, credentialCode))
    .limit(1);

  return {
    usage: row
      ? {
          coreCaptureSuccessCount: row.coreCaptureSuccessCount,
          exportOrCopySuccessCount: row.exportOrCopySuccessCount,
          syncSuccessCount: row.syncSuccessCount,
          highValueClickCount: row.highValueClickCount,
          failureSignalCount: row.failureSignalCount,
          failureStreak: row.failureStreak,
          totalEventCount: row.totalEventCount,
          latestEventType: row.latestEventType,
          lastEventAt: toIso(row.lastEventAt),
        }
      : {
          coreCaptureSuccessCount: 0,
          exportOrCopySuccessCount: 0,
          syncSuccessCount: 0,
          highValueClickCount: 0,
          failureSignalCount: 0,
          failureStreak: 0,
          totalEventCount: 0,
          latestEventType: '',
          lastEventAt: null,
        },
    feedbackTask: null,
  };
}
