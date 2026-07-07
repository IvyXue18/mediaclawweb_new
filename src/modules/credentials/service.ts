import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  like,
  max,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/core/db';
import { credential, credentialCredit, credit, user } from '@/config/db/schema';
import { getNonceStr, getSnowId, getUuid } from '@/lib/hash';

export type CredentialStatus = 'active' | 'frozen' | 'expired' | 'revoked';

const DEFAULT_UNCLAIMED_OWNER_EMAIL =
  'system+unclaimed-credential@mediaclaw.local';

export type CredentialClaimReason =
  | 'claimable'
  | 'not_found'
  | 'invalid_status'
  | 'already_owned'
  | 'owned_by_other'
  | 'already_claimed'
  | 'invalid_code';

export type CredentialClaimStatus = {
  exists: boolean;
  claimable: boolean;
  isUnclaimedOwner: boolean;
  reason: CredentialClaimReason;
  status: string | null;
  ownerUserId: string | null;
};

export type CredentialClaimResult =
  | {
      ok: true;
      data: {
        id: string;
        code: string;
        ownerUserId: string;
      };
    }
  | {
      ok: false;
      reason: CredentialClaimReason;
      status: CredentialClaimStatus;
    };

function normalizeText(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getUnclaimedOwnerEmail() {
  return (
    normalizeText(process.env.CREDENTIAL_UNCLAIMED_OWNER_EMAIL) ||
    DEFAULT_UNCLAIMED_OWNER_EMAIL
  );
}

export function generateActivationCode(prefix = 'MC') {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'MC';
  return `${cleanPrefix}-${getNonceStr(4)}-${getNonceStr(4)}-${getNonceStr(4)}`.toUpperCase();
}

async function findUserByEmail(email?: string | null) {
  if (!email) return null;
  const [row] = await db()
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return row ?? null;
}

async function enrichCredentialRows<
  T extends {
    id: string;
    code: string;
    ownerUserId?: string | null;
  },
>(rows: T[]) {
  if (rows.length === 0) return [];

  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 90);

  const credentialCodes = rows.map((item) => item.code);

  const [creditSummaryRows, rechargeRows, recentRows] = await Promise.all([
    db()
      .select({
        credentialCode: credentialCredit.credentialCode,
        totalCredits: sql<number>`coalesce(sum(${credentialCredit.totalCredits}), 0)`,
        usedCredits: sql<number>`coalesce(sum(${credentialCredit.usedCredits}), 0)`,
        currentBindings: sql<number>`coalesce(sum(case when ${credentialCredit.userId} is not null then 1 else 0 end), 0)`,
      })
      .from(credentialCredit)
      .where(inArray(credentialCredit.credentialCode, credentialCodes))
      .groupBy(credentialCredit.credentialCode),
    db()
      .select({
        credentialCode: credit.credentialCode,
        lastRechargedAt: max(credit.createdAt),
      })
      .from(credit)
      .where(
        and(
          inArray(credit.credentialCode, credentialCodes),
          inArray(credit.transactionType, ['grant', 'credential_recharge'])
        )
      )
      .groupBy(credit.credentialCode),
    db()
      .select({
        credentialCode: credit.credentialCode,
        last90GrantCredits: sql<number>`coalesce(sum(case when ${credit.transactionType} in ('grant', 'credential_recharge') then ${credit.credits} else 0 end), 0)`,
        last90ConsumeCredits: sql<number>`coalesce(sum(case when ${credit.transactionType} in ('consume', 'expense') then abs(${credit.credits}) else 0 end), 0)`,
        last90MonitorConsumeCredits: sql<number>`coalesce(sum(case when ${credit.transactionType} in ('consume', 'expense') and ${credit.transactionScene} = 'account_monitor' then abs(${credit.credits}) else 0 end), 0)`,
        last90MonitorConsumeCount: sql<number>`coalesce(sum(case when ${credit.transactionType} in ('consume', 'expense') and ${credit.transactionScene} = 'account_monitor' then 1 else 0 end), 0)`,
      })
      .from(credit)
      .where(
        and(
          inArray(credit.credentialCode, credentialCodes),
          gte(credit.createdAt, recentCutoff)
        )
      )
      .groupBy(credit.credentialCode),
  ]);

  const creditSummaryMap = new Map(
    creditSummaryRows.map((item) => [
      item.credentialCode,
      {
        currentBindings: Number(item.currentBindings || 0),
        remainingCredits: Math.max(
          Number(item.totalCredits || 0) - Number(item.usedCredits || 0),
          0
        ),
      },
    ])
  );
  const rechargeMap = new Map(
    rechargeRows.map((item) => [
      item.credentialCode || '',
      item.lastRechargedAt || null,
    ])
  );
  const recentMap = new Map(
    recentRows.map((item) => [item.credentialCode || '', item])
  );

  return rows.map((item) => {
    const creditSummary = creditSummaryMap.get(item.code);
    const recent = recentMap.get(item.code);

    return {
      ...item,
      currentBindings:
        creditSummary?.currentBindings || (item.ownerUserId ? 1 : 0),
      remainingCredits: creditSummary?.remainingCredits || 0,
      lastRechargedAt: rechargeMap.get(item.code) || null,
      last90GrantCredits: Number(recent?.last90GrantCredits || 0),
      last90ConsumeCredits: Number(recent?.last90ConsumeCredits || 0),
      last90MonitorConsumeCredits: Number(
        recent?.last90MonitorConsumeCredits || 0
      ),
      last90MonitorConsumeCount: Number(recent?.last90MonitorConsumeCount || 0),
    };
  });
}

export async function listCredentials(params: {
  page: number;
  pageSize: number;
  search?: string | null;
  status?: string | null;
  ownerUserId?: string | null;
}) {
  const { page, pageSize, search, status, ownerUserId } = params;
  const offset = (page - 1) * pageSize;
  const conditions: SQL[] = [isNull(credential.deletedAt) as unknown as SQL];

  if (status && status !== 'all')
    conditions.push(eq(credential.status, status));
  if (ownerUserId) conditions.push(eq(credential.ownerUserId, ownerUserId));
  if (search) {
    conditions.push(
      or(
        like(credential.code, `%${search}%`),
        like(credential.sourceOrderNo, `%${search}%`),
        like(credential.partnerId, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);
  const [totalResult] = await db()
    .select({ count: count() })
    .from(credential)
    .where(where);

  const rows = await db()
    .select({
      id: credential.id,
      code: credential.code,
      ownerUserId: credential.ownerUserId,
      ownerEmail: user.email,
      ownerName: user.name,
      sourceOrderNo: credential.sourceOrderNo,
      planCode: credential.planCode,
      durationPreset: credential.durationPreset,
      maxBindings: credential.maxBindings,
      expiresAt: credential.expiresAt,
      status: credential.status,
      partnerId: credential.partnerId,
      variantId: credential.variantId,
      notes: credential.notes,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    })
    .from(credential)
    .leftJoin(user, eq(user.id, credential.ownerUserId))
    .where(where)
    .orderBy(desc(credential.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items: await enrichCredentialRows(rows), total: totalResult.count };
}

export async function createCredential(params: {
  code?: string;
  ownerEmail?: string | null;
  sourceOrderNo?: string | null;
  planCode?: string | null;
  durationPreset?: string | null;
  maxBindings?: number | null;
  expiresAt?: Date | null;
  status?: CredentialStatus;
  partnerId?: string | null;
  variantId?: string | null;
  notes?: string | null;
  totalCredits?: number | null;
}) {
  const owner = await findUserByEmail(params.ownerEmail);
  const code = (params.code || generateActivationCode()).trim().toUpperCase();
  const now = new Date();

  const [created] = await db()
    .insert(credential)
    .values({
      id: getUuid(),
      code,
      ownerUserId: owner?.id ?? null,
      sourceOrderNo: params.sourceOrderNo || null,
      planCode: params.planCode || 'formal',
      durationPreset: params.durationPreset || 'monthly',
      maxBindings: Math.max(1, params.maxBindings || 1),
      expiresAt: params.expiresAt || null,
      status: params.status || 'active',
      partnerId: params.partnerId || null,
      variantId: params.variantId || null,
      notes: params.notes || null,
    })
    .returning();

  if (params.totalCredits && params.totalCredits > 0) {
    await db()
      .insert(credentialCredit)
      .values({
        id: getUuid(),
        credentialId: created.id,
        credentialCode: code,
        userId: owner?.id ?? null,
        orderNo: params.sourceOrderNo || null,
        totalCredits: params.totalCredits,
        usedCredits: 0,
        expiresAt: params.expiresAt || null,
        status: 'active',
        activatedAt: owner ? now : null,
      });
  }

  return created;
}

export async function updateCredentialStatus(params: {
  id: string;
  status: CredentialStatus;
  notes?: string | null;
}) {
  const [updated] = await db()
    .update(credential)
    .set({
      status: params.status,
      notes: params.notes === undefined ? undefined : params.notes,
    })
    .where(eq(credential.id, params.id))
    .returning();
  return updated ?? null;
}

function appendLifecycleNote(existingNotes: string | null, note: string) {
  const normalized = String(existingNotes || '').trim();
  return normalized ? `${normalized}\n${note}` : note;
}

export async function freezeCredentialByIdForOwner(params: {
  credentialId: string;
  ownerUserId: string;
}) {
  const existing = await getCredentialById({
    id: params.credentialId,
    ownerUserId: params.ownerUserId,
  });

  if (!existing) {
    throw new Error('credential not found');
  }

  const [updated] = await db()
    .update(credential)
    .set({
      status: 'frozen',
      notes: appendLifecycleNote(
        existing.notes,
        `[${new Date().toISOString()}] stopped by owner`
      ),
    })
    .where(
      and(
        eq(credential.id, params.credentialId),
        eq(credential.ownerUserId, params.ownerUserId),
        isNull(credential.deletedAt)
      )
    )
    .returning();

  return updated ?? null;
}

export async function updateCredential(params: {
  id: string;
  maxBindings?: number | null;
  expiresAt?: Date | null;
  notes?: string | null;
  status?: CredentialStatus;
}) {
  const [updated] = await db()
    .update(credential)
    .set({
      maxBindings:
        params.maxBindings === undefined
          ? undefined
          : Math.max(1, params.maxBindings || 1),
      expiresAt: params.expiresAt === undefined ? undefined : params.expiresAt,
      notes: params.notes === undefined ? undefined : params.notes,
      status: params.status,
    })
    .where(eq(credential.id, params.id))
    .returning();
  return updated ?? null;
}

export async function rechargeCredential(params: {
  id: string;
  credits?: number | null;
  durationDays?: number | null;
  expiresAt?: Date | null;
  maxBindings?: number | null;
  planCode?: string | null;
  durationPreset?: string | null;
  status?: CredentialStatus;
  notes?: string | null;
}) {
  const existing = await getCredentialById({ id: params.id });
  if (!existing) throw new Error('Activation code not found');

  const now = new Date();
  let nextExpiresAt = params.expiresAt ?? undefined;
  const durationDays = Number(params.durationDays || 0);

  if (durationDays > 0) {
    const base =
      existing.expiresAt && existing.expiresAt.getTime() > now.getTime()
        ? new Date(existing.expiresAt)
        : now;
    base.setDate(base.getDate() + durationDays);
    base.setHours(23, 59, 59, 999);
    nextExpiresAt = base;
  }

  const updated = await db().transaction(async (tx: any) => {
    const [credentialRow] = await tx
      .update(credential)
      .set({
        maxBindings:
          params.maxBindings === undefined || params.maxBindings === null
            ? existing.maxBindings
            : Math.max(1, params.maxBindings),
        expiresAt:
          nextExpiresAt === undefined ? existing.expiresAt : nextExpiresAt,
        planCode:
          params.planCode === undefined ? existing.planCode : params.planCode,
        durationPreset:
          params.durationPreset === undefined
            ? existing.durationPreset
            : params.durationPreset,
        status: params.status || existing.status,
        notes: params.notes === undefined ? existing.notes : params.notes,
      })
      .where(eq(credential.id, params.id))
      .returning();

    const credits = Number(params.credits || 0);
    if (credits > 0) {
      const owner = existing.ownerUserId
        ? (
            await tx
              .select({ email: user.email })
              .from(user)
              .where(eq(user.id, existing.ownerUserId))
              .limit(1)
          )[0]
        : null;

      const [summary] = await tx
        .select()
        .from(credentialCredit)
        .where(eq(credentialCredit.credentialCode, existing.code))
        .limit(1);

      if (summary) {
        await tx
          .update(credentialCredit)
          .set({
            credentialId: summary.credentialId || existing.id,
            userId: summary.userId || existing.ownerUserId || null,
            totalCredits: sql`${credentialCredit.totalCredits} + ${credits}`,
            expiresAt:
              nextExpiresAt === undefined ? summary.expiresAt : nextExpiresAt,
            status: 'active',
            activatedAt:
              summary.activatedAt || (existing.ownerUserId ? now : null),
          })
          .where(eq(credentialCredit.id, summary.id));
      } else {
        await tx.insert(credentialCredit).values({
          id: getUuid(),
          credentialId: existing.id,
          credentialCode: existing.code,
          userId: existing.ownerUserId || null,
          orderNo: existing.sourceOrderNo || null,
          totalCredits: credits,
          usedCredits: 0,
          expiresAt:
            nextExpiresAt === undefined ? existing.expiresAt : nextExpiresAt,
          status: 'active',
          activatedAt: existing.ownerUserId ? now : null,
        });
      }

      if (existing.ownerUserId) {
        await tx.insert(credit).values({
          id: getUuid(),
          userId: existing.ownerUserId,
          userEmail: owner?.email || '',
          orderNo: existing.sourceOrderNo || '',
          subscriptionNo: '',
          transactionNo: getSnowId(),
          transactionType: 'credential_recharge',
          transactionScene: 'manual_credential_recharge',
          credits,
          remainingCredits: 0,
          description: params.notes || 'Manual credential recharge',
          expiresAt:
            nextExpiresAt === undefined ? existing.expiresAt : nextExpiresAt,
          status: 'active',
          credentialCode: existing.code,
          metadata: JSON.stringify({
            credentialId: existing.id,
            source: 'credential_recharge',
          }),
        });
      }
    }

    return credentialRow;
  });

  return updated;
}

export async function getCredentialById(params: {
  id: string;
  ownerUserId?: string | null;
}) {
  const conditions: SQL[] = [
    eq(credential.id, params.id) as unknown as SQL,
    isNull(credential.deletedAt) as unknown as SQL,
  ];
  if (params.ownerUserId) {
    conditions.push(eq(credential.ownerUserId, params.ownerUserId));
  }

  const [row] = await db()
    .select()
    .from(credential)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}

export async function getCredentialByCode(code: string) {
  const [row] = await db()
    .select()
    .from(credential)
    .where(
      and(
        eq(credential.code, code.trim().toUpperCase()),
        isNull(credential.deletedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

async function getCredentialClaimRow(code: string) {
  const [row] = await db()
    .select({
      id: credential.id,
      code: credential.code,
      status: credential.status,
      ownerUserId: credential.ownerUserId,
      ownerEmail: user.email,
    })
    .from(credential)
    .leftJoin(user, eq(credential.ownerUserId, user.id))
    .where(
      and(
        eq(credential.code, code.trim().toUpperCase()),
        isNull(credential.deletedAt)
      )
    )
    .limit(1);

  return row ?? null;
}

export async function getCredentialClaimStatus(params: {
  code: string;
  currentUserId: string;
}): Promise<CredentialClaimStatus> {
  const normalizedCode = String(params.code || '')
    .trim()
    .toUpperCase();
  if (!normalizedCode) {
    return {
      exists: false,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'invalid_code',
      status: null,
      ownerUserId: null,
    };
  }

  const row = await getCredentialClaimRow(normalizedCode);
  if (!row) {
    return {
      exists: false,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'not_found',
      status: null,
      ownerUserId: null,
    };
  }

  const isStatusActive = row.status === 'active';
  const isUnclaimedOwner =
    !row.ownerUserId ||
    normalizeText(row.ownerEmail) === getUnclaimedOwnerEmail();

  if (!isStatusActive) {
    return {
      exists: true,
      claimable: false,
      isUnclaimedOwner,
      reason: 'invalid_status',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  if (isUnclaimedOwner) {
    return {
      exists: true,
      claimable: true,
      isUnclaimedOwner: true,
      reason: 'claimable',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  if (row.ownerUserId === params.currentUserId) {
    return {
      exists: true,
      claimable: false,
      isUnclaimedOwner: false,
      reason: 'already_owned',
      status: row.status,
      ownerUserId: row.ownerUserId || null,
    };
  }

  return {
    exists: true,
    claimable: false,
    isUnclaimedOwner: false,
    reason: 'owned_by_other',
    status: row.status,
    ownerUserId: row.ownerUserId || null,
  };
}

export async function claimCredentialForUser(params: {
  code: string;
  currentUserId: string;
}): Promise<CredentialClaimResult> {
  const status = await getCredentialClaimStatus(params);

  if (!status.claimable) {
    return {
      ok: false,
      reason: status.reason,
      status,
    };
  }

  const normalizedCode = String(params.code || '')
    .trim()
    .toUpperCase();
  const expectedOwnerCondition = status.ownerUserId
    ? eq(credential.ownerUserId, status.ownerUserId)
    : isNull(credential.ownerUserId);
  const now = new Date();

  const updatedRows = await db().transaction(async (tx: any) => {
    const rows = await tx
      .update(credential)
      .set({
        ownerUserId: params.currentUserId,
        updatedAt: now,
      })
      .where(
        and(
          eq(credential.code, normalizedCode),
          eq(credential.status, 'active'),
          isNull(credential.deletedAt),
          expectedOwnerCondition
        )
      )
      .returning({
        id: credential.id,
        code: credential.code,
        ownerUserId: credential.ownerUserId,
      });

    if (rows.length > 0) {
      await tx
        .update(credentialCredit)
        .set({ userId: params.currentUserId, activatedAt: now })
        .where(eq(credentialCredit.credentialCode, normalizedCode));
    }

    return rows;
  });

  if (updatedRows.length > 0) {
    return {
      ok: true,
      data: updatedRows[0],
    };
  }

  const latestStatus = await getCredentialClaimStatus({
    code: normalizedCode,
    currentUserId: params.currentUserId,
  });

  return {
    ok: false,
    reason: latestStatus.claimable ? 'already_claimed' : latestStatus.reason,
    status: latestStatus,
  };
}

export function getClaimReasonMessage(reason: CredentialClaimReason) {
  switch (reason) {
    case 'invalid_code':
      return 'credential code is required';
    case 'not_found':
      return 'activation code not found';
    case 'invalid_status':
      return 'activation code status is not claimable';
    case 'already_owned':
      return 'activation code already belongs to current account';
    case 'owned_by_other':
      return 'this activation code is already bound to another account';
    case 'already_claimed':
      return 'this activation code has been claimed by another account';
    default:
      return 'credential claim failed';
  }
}

export async function claimCredential(params: {
  userId: string;
  code: string;
}) {
  const code = params.code.trim().toUpperCase();
  const [existing] = await db()
    .select()
    .from(credential)
    .where(and(eq(credential.code, code), isNull(credential.deletedAt)))
    .limit(1);

  if (!existing) throw new Error('Activation code not found');
  if (existing.status !== 'active') {
    throw new Error(`Activation code is ${existing.status}`);
  }
  if (existing.ownerUserId && existing.ownerUserId !== params.userId) {
    throw new Error('Activation code belongs to another account');
  }

  const now = new Date();
  await db().transaction(async (tx: any) => {
    await tx
      .update(credential)
      .set({ ownerUserId: params.userId })
      .where(eq(credential.id, existing.id));

    await tx
      .update(credentialCredit)
      .set({ userId: params.userId, activatedAt: now })
      .where(eq(credentialCredit.credentialCode, code));
  });

  return { ...existing, ownerUserId: params.userId };
}
