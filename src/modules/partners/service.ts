import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  or,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/core/db';
import {
  credential,
  credentialCredit,
  order,
  partner,
  user,
} from '@/config/db/schema';
import { getNonceStr, getUuid } from '@/lib/hash';

function makePartnerCode(name: string) {
  const prefix =
    name
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 8)
      .toUpperCase() || 'PARTNER';
  return `${prefix}-${getNonceStr(5).toUpperCase()}`;
}

async function findOwner(ownerEmail?: string | null) {
  if (!ownerEmail) return null;
  const [row] = await db()
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.email, ownerEmail))
    .limit(1);
  return row ?? null;
}

export type PartnerActivationStatus =
  | 'unused'
  | 'activated'
  | 'expired'
  | 'disabled';

export type PartnerCredentialRecord = {
  id: string;
  code: string;
  ownerUserId: string | null;
  sourceOrderNo: string | null;
  planCode: string | null;
  durationPreset: string | null;
  maxBindings: number;
  expiresAt: Date | null;
  status: string;
  partnerId: string | null;
  variantId: string | null;
  assignmentNote: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  orderStatus: string | null;
  orderProductId: string | null;
  orderSeatCount: number | null;
  currentBindings: number;
  activatedAt: Date | null;
  activationStatus: PartnerActivationStatus;
};

export function partnerBusinessId(row: typeof partner.$inferSelect) {
  return row.partnerCode;
}

export function isPartnerCurrentlyActive(
  row: Pick<typeof partner.$inferSelect, 'status' | 'contractStatus'>
) {
  return (
    row.status === 'active' &&
    !['disabled', 'expired', 'terminated', 'cancelled', 'canceled'].includes(
      String(row.contractStatus || '').toLowerCase()
    )
  );
}

export function partnerDashboardShape(row: typeof partner.$inferSelect) {
  const businessId = partnerBusinessId(row);
  return {
    id: row.id,
    partnerId: businessId,
    partnerCode: row.partnerCode,
    name: row.name,
    type: row.type,
    status: row.status,
    ownerUserId: row.ownerUserId,
    ownerEmail: row.ownerEmail,
    defaultVariantId: row.variantId || 'official',
    variantId: row.variantId || 'official',
    contractStatus: row.contractStatus,
    seatLimit: row.seatLimit,
    usedSeats: row.usedSeats,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findPartnerByUserId(userId: string) {
  const [row] = await db()
    .select()
    .from(partner)
    .where(eq(partner.ownerUserId, userId))
    .orderBy(desc(partner.createdAt))
    .limit(1);
  return row ?? null;
}

export async function findPartnerByBusinessId(input: string) {
  const value = String(input || '').trim();
  if (!value) return null;

  const [row] = await db()
    .select()
    .from(partner)
    .where(or(eq(partner.id, value), eq(partner.partnerCode, value))!)
    .limit(1);

  return row ?? null;
}

export async function listPartners(params: {
  page: number;
  pageSize: number;
  search?: string | null;
  status?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.status && params.status !== 'all') {
    conditions.push(eq(partner.status, params.status));
  }
  if (params.search) {
    conditions.push(
      or(
        like(partner.name, `%${params.search}%`),
        like(partner.partnerCode, `%${params.search}%`),
        like(partner.ownerEmail, `%${params.search}%`)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(partner)
    .where(where);

  const items = await db()
    .select()
    .from(partner)
    .where(where)
    .orderBy(desc(partner.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items, total: totalResult.count };
}

export async function createPartner(params: {
  name: string;
  type?: string | null;
  ownerEmail?: string | null;
  variantId?: string | null;
  contractStatus?: string | null;
  seatLimit?: number | null;
  notes?: string | null;
}) {
  const owner = await findOwner(params.ownerEmail);
  const [created] = await db()
    .insert(partner)
    .values({
      id: getUuid(),
      partnerCode: makePartnerCode(params.name),
      name: params.name,
      type: params.type || 'supplier',
      ownerUserId: owner?.id ?? null,
      ownerEmail: params.ownerEmail || owner?.email || null,
      variantId: params.variantId || null,
      contractStatus: params.contractStatus || 'draft',
      seatLimit: Math.max(0, params.seatLimit || 0),
      usedSeats: 0,
      status: 'active',
      notes: params.notes || null,
    })
    .returning();
  return created;
}

export async function updatePartner(params: {
  id: string;
  status?: string;
  contractStatus?: string;
  seatLimit?: number;
  notes?: string | null;
}) {
  const [updated] = await db()
    .update(partner)
    .set({
      status: params.status,
      contractStatus: params.contractStatus,
      seatLimit: params.seatLimit,
      notes: params.notes,
    })
    .where(eq(partner.id, params.id))
    .returning();
  return updated ?? null;
}

export async function listPartnerCredentials(partnerId: string) {
  return getPartnerCredentials({
    partnerId,
    page: 1,
    limit: 10000,
  });
}

export async function getPartnerOrders({
  partnerId,
  page = 1,
  limit = 20,
}: {
  partnerId: string;
  page?: number;
  limit?: number;
}) {
  return db()
    .select()
    .from(order)
    .where(eq(order.partnerId, partnerId))
    .orderBy(desc(order.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function getPartnerCredentials({
  partnerId,
  status,
  page = 1,
  limit = 50,
}: {
  partnerId: string;
  status?: string | null;
  page?: number;
  limit?: number;
}): Promise<PartnerCredentialRecord[]> {
  const normalizedStatus = String(status || 'all').trim();
  const shouldFilterAfterEnrichment =
    normalizedStatus && normalizedStatus !== 'all';
  const rawLimit = shouldFilterAfterEnrichment ? 10000 : limit;
  const rawOffset = shouldFilterAfterEnrichment ? 0 : (page - 1) * limit;

  const rows = await db()
    .select({
      id: credential.id,
      code: credential.code,
      ownerUserId: credential.ownerUserId,
      sourceOrderNo: credential.sourceOrderNo,
      planCode: credential.planCode,
      durationPreset: credential.durationPreset,
      maxBindings: credential.maxBindings,
      expiresAt: credential.expiresAt,
      status: credential.status,
      partnerId: credential.partnerId,
      variantId: credential.variantId,
      assignmentNote: credential.notes,
      notes: credential.notes,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
      deletedAt: credential.deletedAt,
      orderStatus: order.status,
      orderProductId: order.productId,
      orderSeatCount: order.seatCount,
    })
    .from(credential)
    .leftJoin(order, eq(credential.sourceOrderNo, order.orderNo))
    .where(
      and(eq(credential.partnerId, partnerId), isNull(credential.deletedAt))
    )
    .orderBy(desc(credential.createdAt))
    .limit(rawLimit)
    .offset(rawOffset);

  const enriched = await enrichPartnerCredentialActivation(rows);
  const filtered = shouldFilterAfterEnrichment
    ? enriched.filter((item) => item.activationStatus === normalizedStatus)
    : enriched;

  return shouldFilterAfterEnrichment
    ? filtered.slice((page - 1) * limit, (page - 1) * limit + limit)
    : filtered;
}

export async function getPartnerCredentialsCount({
  partnerId,
  status,
}: {
  partnerId: string;
  status?: string | null;
}) {
  return (
    await getPartnerCredentials({
      partnerId,
      status,
      page: 1,
      limit: 10000,
    })
  ).length;
}

export async function getPartnerCredentialStats(partnerId: string) {
  const stats = {
    total: 0,
    unused: 0,
    activated: 0,
    expired: 0,
    disabled: 0,
  };

  const records = await getPartnerCredentials({
    partnerId,
    page: 1,
    limit: 10000,
  });

  for (const record of records) {
    stats.total += 1;
    stats[record.activationStatus] += 1;
  }

  return stats;
}

export async function updatePartnerCredentialAssignmentNote({
  partnerId,
  credentialId,
  assignmentNote,
}: {
  partnerId: string;
  credentialId: string;
  assignmentNote: string;
}) {
  const [updated] = await db()
    .update(credential)
    .set({
      notes: assignmentNote.trim() || null,
    })
    .where(
      and(
        eq(credential.id, credentialId),
        eq(credential.partnerId, partnerId),
        isNull(credential.deletedAt)
      )
    )
    .returning();

  return updated ?? null;
}

async function enrichPartnerCredentialActivation<
  T extends {
    id: string;
    code: string;
    ownerUserId: string | null;
    expiresAt: Date | null;
    status: string;
  },
>(
  rows: T[]
): Promise<
  (T & {
    currentBindings: number;
    activatedAt: Date | null;
    activationStatus: PartnerActivationStatus;
  })[]
> {
  if (!rows.length) return [];

  const ids = rows.map((item) => item.id);
  const codes = rows.map((item) => item.code);
  const creditRows = await db()
    .select({
      credentialId: credentialCredit.credentialId,
      credentialCode: credentialCredit.credentialCode,
      userId: credentialCredit.userId,
      activatedAt: credentialCredit.activatedAt,
    })
    .from(credentialCredit)
    .where(
      or(
        inArray(credentialCredit.credentialId, ids),
        inArray(credentialCredit.credentialCode, codes)
      )!
    );

  const bindingMap = new Map<
    string,
    { currentBindings: number; activatedAt: Date | null }
  >();

  for (const item of creditRows) {
    const keys = [item.credentialId, item.credentialCode].filter(Boolean);
    for (const key of keys) {
      const current = bindingMap.get(key!) || {
        currentBindings: 0,
        activatedAt: null,
      };
      current.currentBindings += item.userId ? 1 : 0;
      if (
        item.activatedAt &&
        (!current.activatedAt || item.activatedAt < current.activatedAt)
      ) {
        current.activatedAt = item.activatedAt;
      }
      bindingMap.set(key!, current);
    }
  }

  const now = new Date();
  return rows.map((item) => {
    const binding = bindingMap.get(item.id) || bindingMap.get(item.code);
    const currentBindings =
      binding?.currentBindings || (item.ownerUserId ? 1 : 0);
    let activationStatus: PartnerActivationStatus = 'unused';

    if (['frozen', 'disabled', 'revoked'].includes(item.status)) {
      activationStatus = 'disabled';
    } else if (
      item.status === 'expired' ||
      (item.expiresAt && item.expiresAt < now)
    ) {
      activationStatus = 'expired';
    } else if (currentBindings > 0) {
      activationStatus = 'activated';
    }

    return {
      ...item,
      currentBindings,
      activatedAt: binding?.activatedAt || null,
      activationStatus,
    };
  });
}
