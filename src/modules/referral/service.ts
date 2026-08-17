import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  like,
  lt,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import {
  order as orderTable,
  referralAccount,
  referralCommission,
  referralRelation,
  referralRiskLog,
  referralWithdrawal,
  user,
} from '@/config/db/schema';
import { getAllConfigs } from '@/modules/config/service';
import { getNonceStr, getUuid } from '@/lib/hash';

const DEFAULT_REFERRAL_COMMISSION_RATE = 20;
const DEFAULT_REFERRAL_INVITEE_DISCOUNT = 10;
const INVITEE_DISCOUNT_RESERVATION_SUFFIX = 'referral_invitee_discount';

export function getInviteeDiscountReservationKey(userId: string) {
  return `${userId}:${INVITEE_DISCOUNT_RESERVATION_SUFFIX}`;
}

function normalizeCurrency(currency?: string | null) {
  return (currency || 'usd').toLowerCase();
}

export function normalizeReferralCode(value?: string | null) {
  const raw = String(value || '');
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}
  return decoded
    .trim()
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 64);
}

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function applyDiscount(amount: number, discountRate: number) {
  return discountRate > 0 && discountRate < 100
    ? Math.floor((amount * (100 - discountRate)) / 100)
    : amount;
}

function productIsCreditsOnly(
  productId: string | null | undefined,
  configs: Record<string, string>
) {
  const id = String(productId || '');
  if (/^credits[-_]/i.test(id)) return true;

  try {
    const products = JSON.parse(configs.pricing_products || '{}');
    const product = products[id];
    const kind = String(
      product?.fulfillment || product?.type || ''
    ).toLowerCase();
    return kind === 'credits_only' || kind === 'credits';
  } catch {
    return false;
  }
}

function inviteCodeFromUser(userId: string) {
  return `MC${userId
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase()}${getNonceStr(3).toUpperCase()}`;
}

const REFERRAL_BACKFILL_LOOKBACK_HOURS = 48;

export enum ReferralStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export async function updateReferralStatus(
  userId: string,
  status: ReferralStatus
) {
  await getOrCreateReferralAccount(userId);
  await db()
    .update(referralAccount)
    .set({ status, updatedAt: new Date() })
    .where(eq(referralAccount.userId, userId));
}

export async function getOrCreateReferralAccount(userId: string) {
  const [existing] = await db()
    .select()
    .from(referralAccount)
    .where(eq(referralAccount.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db()
    .insert(referralAccount)
    .values({
      id: getUuid(),
      userId,
      inviteCode: inviteCodeFromUser(userId),
      status: 'active',
    })
    .returning();
  return created;
}

export async function getReferralOverview(userId: string) {
  const account = await getOrCreateReferralAccount(userId);
  const relations = await listReferralRelations({
    userId,
    page: 1,
    pageSize: 20,
  });
  const commissions = await db()
    .select()
    .from(referralCommission)
    .where(eq(referralCommission.referrerUserId, userId))
    .orderBy(desc(referralCommission.createdAt))
    .limit(20);
  const withdrawals = await db()
    .select()
    .from(referralWithdrawal)
    .where(eq(referralWithdrawal.userId, userId))
    .orderBy(desc(referralWithdrawal.createdAt))
    .limit(20);
  const config = await getReferralConfig();
  const withdrawingAmount = withdrawals
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + item.amount, 0);
  const lockedAmount = Math.max(
    0,
    account.pendingCommission - withdrawingAmount
  );
  const referralLink = `${envConfigs.app_url.replace(/\/$/, '')}/?ref=${encodeURIComponent(account.inviteCode)}`;

  return {
    account,
    relations: relations.items,
    relationTotal: relations.total,
    commissions,
    withdrawals,
    config,
    referralLink,
    availableAmount: account.availableCommission,
    pendingAmount: withdrawingAmount,
    lockedAmount,
    withdrawingAmount,
    minWithdrawalAmount: config.minSettlement,
    hasPendingWithdrawal: withdrawingAmount > 0,
    canRequestWithdrawal:
      account.status === ReferralStatus.ACTIVE &&
      account.availableCommission >= config.minSettlement &&
      withdrawingAmount === 0,
    stats: {
      totalReferrals: relations.total,
      totalCommission: account.totalCommission,
    },
  };
}

export async function createReferralRelation(params: {
  referralCode?: string | null;
  refereeId: string;
  refereeEmail?: string | null;
  refereeIp?: string | null;
}) {
  const referralCode = normalizeReferralCode(params.referralCode);
  if (!referralCode || !params.refereeId) return null;

  const [referrerAccount] = await db()
    .select()
    .from(referralAccount)
    .where(eq(referralAccount.inviteCode, referralCode))
    .limit(1);
  if (!referrerAccount) return null;
  if (referrerAccount.userId === params.refereeId) return null;

  const [existing] = await db()
    .select()
    .from(referralRelation)
    .where(eq(referralRelation.refereeId, params.refereeId))
    .limit(1);
  if (existing) {
    await repairMissingReferralCommissionForRelationQuietly(existing);
    return existing;
  }

  try {
    const [created] = await db().transaction(async (tx: any) => {
      const [row] = await tx
        .insert(referralRelation)
        .values({
          id: getUuid(),
          referrerId: referrerAccount.userId,
          refereeId: params.refereeId,
          referralCode,
          status: 'active',
        })
        .returning();

      await tx
        .update(referralAccount)
        .set({
          totalInvitees: sql`${referralAccount.totalInvitees} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(referralAccount.userId, referrerAccount.userId));

      return [row];
    });

    await repairMissingReferralCommissionForRelationQuietly(created);
    return created;
  } catch (error) {
    const [existingAfterRace] = await db()
      .select()
      .from(referralRelation)
      .where(eq(referralRelation.refereeId, params.refereeId))
      .limit(1);
    if (existingAfterRace) {
      await repairMissingReferralCommissionForRelationQuietly(
        existingAfterRace
      );
      return existingAfterRace;
    }
    throw error;
  }
}

export async function findReferralRelationByReferee(refereeId: string) {
  const [relation] = await db()
    .select()
    .from(referralRelation)
    .where(eq(referralRelation.refereeId, refereeId))
    .limit(1);
  return relation || null;
}

export async function getInviteeDiscount(userId: string) {
  const configs = await getAllConfigs();
  if (configs.referral_enabled === 'false') return 0;

  const discountRate = parsePositiveInt(
    configs.referral_invitee_discount,
    DEFAULT_REFERRAL_INVITEE_DISCOUNT
  );
  if (discountRate <= 0 || discountRate >= 100) return 0;

  const relation = await findReferralRelationByReferee(userId);
  if (
    !relation ||
    relation.status !== ReferralStatus.ACTIVE ||
    relation.hasFirstOrder
  ) {
    return 0;
  }

  return discountRate;
}

export async function listReferralRelations(params: {
  userId: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, Math.floor(params.page || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Math.floor(params.pageSize || 20))
  );
  const where = eq(referralRelation.referrerId, params.userId);
  const offset = (page - 1) * pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(referralRelation)
    .where(where);

  const items = await db()
    .select({
      id: referralRelation.id,
      referrerId: referralRelation.referrerId,
      refereeId: referralRelation.refereeId,
      referralCode: referralRelation.referralCode,
      hasFirstOrder: referralRelation.hasFirstOrder,
      firstOrderNo: referralRelation.firstOrderNo,
      firstOrderAt: referralRelation.firstOrderAt,
      status: referralRelation.status,
      createdAt: referralRelation.createdAt,
      updatedAt: referralRelation.updatedAt,
      refereeName: user.name,
      refereeEmail: user.email,
    })
    .from(referralRelation)
    .leftJoin(user, eq(user.id, referralRelation.refereeId))
    .where(where)
    .orderBy(desc(referralRelation.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { items, total: Number(totalResult?.count || 0) };
}

export async function updateReferralRelationFirstOrder(params: {
  relationId?: string | null;
  refereeId?: string | null;
  orderNo: string;
}) {
  const where = params.relationId
    ? eq(referralRelation.id, params.relationId)
    : params.refereeId
      ? eq(referralRelation.refereeId, params.refereeId)
      : null;
  if (!where) {
    throw new Error('Referral relation id or referee id is required');
  }

  const [updated] = await db()
    .update(referralRelation)
    .set({
      hasFirstOrder: true,
      firstOrderNo: params.orderNo,
      firstOrderAt: new Date(),
      updatedAt: new Date(),
    })
    .where(where)
    .returning();
  return updated || null;
}

export async function processReferralCommissionForPaidOrder(params: {
  order: {
    orderNo: string;
    userId: string;
    productId?: string | null;
    amount?: number | null;
    currency?: string | null;
  };
  paymentAmount?: number | null;
  paymentCurrency?: string | null;
}) {
  if (!params.order?.orderNo || !params.order?.userId) return null;

  const relation = await findReferralRelationByReferee(params.order.userId);
  if (!relation) return null;

  const [existingCommission] = await db()
    .select()
    .from(referralCommission)
    .where(eq(referralCommission.orderNo, params.order.orderNo))
    .limit(1);
  if (existingCommission) {
    if (!relation.hasFirstOrder) {
      await updateReferralRelationFirstOrder({
        relationId: relation.id,
        orderNo: params.order.orderNo,
      });
    }
    return existingCommission;
  }

  const [referrerAccount] = await db()
    .select()
    .from(referralAccount)
    .where(eq(referralAccount.userId, relation.referrerId))
    .limit(1);
  if (!referrerAccount || referrerAccount.status !== ReferralStatus.ACTIVE) {
    return null;
  }

  const configs = await getAllConfigs();
  const isFirstOrder = !relation.hasFirstOrder;
  if (!isFirstOrder && productIsCreditsOnly(params.order.productId, configs)) {
    return null;
  }

  const rate = isFirstOrder
    ? parsePositiveInt(
        configs.referral_first_order_rate,
        DEFAULT_REFERRAL_COMMISSION_RATE
      )
    : parsePositiveInt(
        configs.referral_renewal_rate,
        DEFAULT_REFERRAL_COMMISSION_RATE
      );
  if (rate <= 0) return null;

  const orderAmount = Number(params.paymentAmount || params.order.amount || 0);
  const amount = Math.floor((orderAmount * rate) / 100);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const currency = normalizeCurrency(
    params.paymentCurrency || params.order.currency || referrerAccount.currency
  );
  const commissionReason = isFirstOrder ? 'first_order' : 'renewal';

  const [created] = await db().transaction(async (tx: any) => {
    const [row] = await tx
      .insert(referralCommission)
      .values({
        id: getUuid(),
        userId: relation.referrerId,
        relationId: relation.id,
        referrerUserId: relation.referrerId,
        inviteeUserId: relation.refereeId,
        orderNo: params.order.orderNo,
        orderAmount,
        orderCurrency: currency,
        commissionRate: rate,
        commissionAmount: amount,
        commissionCurrency: currency,
        commissionType: commissionReason,
        amount,
        currency,
        rate,
        status: 'pending',
        reason: commissionReason,
      })
      .returning();

    await tx
      .update(referralAccount)
      .set({
        totalCommission: sql`${referralAccount.totalCommission} + ${amount}`,
        pendingCommission: sql`${referralAccount.pendingCommission} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(referralAccount.userId, relation.referrerId));

    if (isFirstOrder) {
      await tx
        .update(referralRelation)
        .set({
          hasFirstOrder: true,
          firstOrderNo: params.order.orderNo,
          firstOrderAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referralRelation.id, relation.id));
    }

    return [row];
  });

  return created;
}

function dateFromUnknown(value: unknown, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(String(value || ''));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function repairMissingReferralCommissionForRelation(
  relation: typeof referralRelation.$inferSelect,
  options: {
    lookbackHours?: number;
    orderLimit?: number;
  } = {}
) {
  if (!relation || relation.status !== ReferralStatus.ACTIVE) {
    return { commission: null, candidateOrders: 0 };
  }
  if (relation.hasFirstOrder) {
    return { commission: null, candidateOrders: 0 };
  }

  const lookbackHours = Math.min(
    24 * 30,
    Math.max(
      1,
      Math.floor(options.lookbackHours || REFERRAL_BACKFILL_LOOKBACK_HOURS)
    )
  );
  const orderLimit = Math.min(
    10,
    Math.max(1, Math.floor(options.orderLimit || 5))
  );
  const relationCreatedAt = dateFromUnknown(relation.createdAt);
  const windowStart = new Date(
    relationCreatedAt.getTime() - lookbackHours * 60 * 60 * 1000
  );

  const paidOrders = await db()
    .select({
      orderNo: orderTable.orderNo,
      userId: orderTable.userId,
      productId: orderTable.productId,
      amount: orderTable.amount,
      currency: orderTable.currency,
      paymentAmount: orderTable.paymentAmount,
      paymentCurrency: orderTable.paymentCurrency,
      createdAt: orderTable.createdAt,
      paidAt: orderTable.paidAt,
    })
    .from(orderTable)
    .where(
      and(
        eq(orderTable.userId, relation.refereeId),
        eq(orderTable.status, 'paid'),
        isNull(orderTable.deletedAt),
        or(
          gte(orderTable.createdAt, windowStart),
          gte(orderTable.paidAt, windowStart)
        )!
      )
    )
    .orderBy(asc(orderTable.paidAt), asc(orderTable.createdAt))
    .limit(orderLimit);

  for (const paidOrder of paidOrders) {
    const commission = await processReferralCommissionForPaidOrder({
      order: {
        orderNo: paidOrder.orderNo,
        userId: paidOrder.userId,
        productId: paidOrder.productId,
        amount: paidOrder.amount,
        currency: paidOrder.currency,
      },
      paymentAmount: paidOrder.paymentAmount,
      paymentCurrency: paidOrder.paymentCurrency,
    });
    if (commission) {
      return { commission, candidateOrders: paidOrders.length };
    }
  }

  return { commission: null, candidateOrders: paidOrders.length };
}

async function repairMissingReferralCommissionForRelationQuietly(
  relation: typeof referralRelation.$inferSelect
) {
  try {
    return await repairMissingReferralCommissionForRelation(relation);
  } catch {
    return { commission: null, candidateOrders: 0 };
  }
}

export async function repairMissingReferralCommissions(
  options: {
    limit?: number;
    lookbackHours?: number;
  } = {}
) {
  const limit = Math.min(200, Math.max(1, Math.floor(options.limit || 100)));
  const relations = await db()
    .select()
    .from(referralRelation)
    .where(
      and(
        eq(referralRelation.status, ReferralStatus.ACTIVE),
        eq(referralRelation.hasFirstOrder, false)
      )
    )
    .orderBy(desc(referralRelation.createdAt))
    .limit(limit);

  let repairedCommissions = 0;
  let candidateOrders = 0;

  for (const relation of relations) {
    const result = await repairMissingReferralCommissionForRelation(relation, {
      lookbackHours: options.lookbackHours,
    });
    candidateOrders += result.candidateOrders;
    if (result.commission) {
      repairedCommissions += 1;
    }
  }

  return {
    scannedRelations: relations.length,
    candidateOrders,
    repairedCommissions,
  };
}

export async function cancelReferralCommissionForOrder(
  orderNo: string,
  reason = 'order_refunded'
) {
  const [commission] = await db()
    .select()
    .from(referralCommission)
    .where(eq(referralCommission.orderNo, orderNo))
    .limit(1);
  if (!commission) return null;
  if (commission.status === 'canceled' || commission.status === 'settled') {
    return commission;
  }

  const [updated] = await db().transaction(async (tx: any) => {
    const [row] = await tx
      .update(referralCommission)
      .set({
        status: 'canceled',
        reason: commission.reason
          ? `${commission.reason}; canceled:${reason}`
          : `canceled:${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(referralCommission.id, commission.id))
      .returning();

    if (
      commission.status === 'pending' ||
      commission.status === 'locked' ||
      commission.status === 'frozen'
    ) {
      await tx
        .update(referralAccount)
        .set({
          pendingCommission: sql`case when ${referralAccount.pendingCommission} >= ${commission.amount} then ${referralAccount.pendingCommission} - ${commission.amount} else 0 end`,
          totalCommission: sql`case when ${referralAccount.totalCommission} >= ${commission.amount} then ${referralAccount.totalCommission} - ${commission.amount} else 0 end`,
          updatedAt: new Date(),
        })
        .where(eq(referralAccount.userId, commission.referrerUserId));
    }

    return [row];
  });

  return updated || commission;
}

export async function listReferralCommissions(params: {
  page: number;
  pageSize: number;
  status?: string | null;
  search?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.status && params.status !== 'all') {
    conditions.push(eq(referralCommission.status, params.status));
  }
  if (params.search) {
    conditions.push(
      or(
        like(referralCommission.orderNo, `%${params.search}%`),
        like(user.email, `%${params.search}%`)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(referralCommission)
    .leftJoin(user, eq(user.id, referralCommission.referrerUserId))
    .where(where);

  const items = await db()
    .select({
      id: referralCommission.id,
      referrerUserId: referralCommission.referrerUserId,
      referrerEmail: user.email,
      inviteeUserId: referralCommission.inviteeUserId,
      orderNo: referralCommission.orderNo,
      amount: referralCommission.amount,
      currency: referralCommission.currency,
      rate: referralCommission.rate,
      status: referralCommission.status,
      reason: referralCommission.reason,
      createdAt: referralCommission.createdAt,
      updatedAt: referralCommission.updatedAt,
    })
    .from(referralCommission)
    .leftJoin(user, eq(user.id, referralCommission.referrerUserId))
    .where(where)
    .orderBy(desc(referralCommission.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items, total: totalResult.count };
}

export async function listReferralWithdrawals(params: {
  page: number;
  pageSize: number;
  status?: string | null;
  search?: string | null;
}) {
  const conditions: SQL[] = [];
  if (params.status && params.status !== 'all') {
    conditions.push(eq(referralWithdrawal.status, params.status));
  }
  if (params.search) {
    conditions.push(
      or(
        like(user.email, `%${params.search}%`),
        like(referralWithdrawal.accountInfo, `%${params.search}%`)
      )!
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.pageSize;

  const [totalResult] = await db()
    .select({ count: count() })
    .from(referralWithdrawal)
    .leftJoin(user, eq(user.id, referralWithdrawal.userId))
    .where(where);

  const items = await db()
    .select({
      id: referralWithdrawal.id,
      userId: referralWithdrawal.userId,
      userEmail: user.email,
      amount: referralWithdrawal.amount,
      currency: referralWithdrawal.currency,
      status: referralWithdrawal.status,
      accountInfo: referralWithdrawal.accountInfo,
      reviewerUserId: referralWithdrawal.reviewerUserId,
      reviewedAt: referralWithdrawal.reviewedAt,
      reason: referralWithdrawal.reason,
      createdAt: referralWithdrawal.createdAt,
      updatedAt: referralWithdrawal.updatedAt,
    })
    .from(referralWithdrawal)
    .leftJoin(user, eq(user.id, referralWithdrawal.userId))
    .where(where)
    .orderBy(desc(referralWithdrawal.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items, total: totalResult.count };
}

export async function createWithdrawalRequest(params: {
  userId: string;
  amount?: number;
  currency?: string | null;
  accountInfo?: string | null;
  contactSnapshot?: string | null;
}) {
  const account = await getOrCreateReferralAccount(params.userId);
  const config = await getReferralConfig();
  const [pendingWithdrawal] = await db()
    .select()
    .from(referralWithdrawal)
    .where(
      and(
        eq(referralWithdrawal.userId, params.userId),
        eq(referralWithdrawal.status, 'pending')
      )
    )
    .limit(1);
  if (pendingWithdrawal) {
    throw new Error('You already have a pending withdrawal request');
  }

  const requestedAmount = Number(params.amount || 0);
  const amount =
    Number.isFinite(requestedAmount) && requestedAmount > 0
      ? Math.floor(requestedAmount)
      : account.availableCommission;
  if (amount < config.minSettlement) {
    throw new Error(
      'Available balance has not reached the withdrawal threshold'
    );
  }
  if (account.availableCommission < amount) {
    throw new Error('Insufficient available commission');
  }

  const currency = normalizeCurrency(params.currency || account.currency);
  const accountInfo = params.contactSnapshot || params.accountInfo || null;
  const [created] = await db().transaction(async (tx: any) => {
    const [row] = await tx
      .insert(referralWithdrawal)
      .values({
        id: getUuid(),
        userId: params.userId,
        amount,
        currency,
        status: 'pending',
        accountInfo,
      })
      .returning();

    await tx
      .update(referralAccount)
      .set({
        availableCommission: sql`${referralAccount.availableCommission} - ${amount}`,
        pendingCommission: sql`${referralAccount.pendingCommission} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(referralAccount.userId, params.userId));

    return [row];
  });

  return created;
}

export async function getReferralConfig() {
  const configs = await getAllConfigs();
  return {
    firstOrderRate: parsePositiveInt(
      configs.referral_first_order_rate,
      DEFAULT_REFERRAL_COMMISSION_RATE
    ),
    renewalRate: parsePositiveInt(
      configs.referral_renewal_rate,
      DEFAULT_REFERRAL_COMMISSION_RATE
    ),
    inviteeDiscount: parsePositiveInt(
      configs.referral_invitee_discount,
      DEFAULT_REFERRAL_INVITEE_DISCOUNT
    ),
    minSettlement: parsePositiveInt(configs.referral_min_settlement, 10000),
    lockDays: parsePositiveInt(configs.referral_lock_days, 7),
  };
}

export async function reviewWithdrawal(params: {
  id: string;
  reviewerUserId: string;
  status: 'paid' | 'rejected';
  reason?: string | null;
}) {
  const [existing] = await db()
    .select()
    .from(referralWithdrawal)
    .where(eq(referralWithdrawal.id, params.id))
    .limit(1);
  if (!existing) throw new Error('Withdrawal not found');
  if (existing.status !== 'pending')
    throw new Error('Withdrawal already reviewed');

  await db().transaction(async (tx: any) => {
    await tx
      .update(referralWithdrawal)
      .set({
        status: params.status,
        reviewerUserId: params.reviewerUserId,
        reviewedAt: new Date(),
        reason: params.reason || null,
      })
      .where(eq(referralWithdrawal.id, params.id));

    if (params.status === 'paid') {
      await tx
        .update(referralAccount)
        .set({
          pendingCommission: sql`${referralAccount.pendingCommission} - ${existing.amount}`,
          withdrawnCommission: sql`${referralAccount.withdrawnCommission} + ${existing.amount}`,
        })
        .where(eq(referralAccount.userId, existing.userId));
    } else {
      await tx
        .update(referralAccount)
        .set({
          pendingCommission: sql`${referralAccount.pendingCommission} - ${existing.amount}`,
          availableCommission: sql`${referralAccount.availableCommission} + ${existing.amount}`,
        })
        .where(eq(referralAccount.userId, existing.userId));
    }
  });
}

export async function createRiskLog(params: {
  userId: string;
  riskType: string;
  riskLevel?: string;
  details?: string | null;
  action?: string | null;
}) {
  await db()
    .insert(referralRiskLog)
    .values({
      id: getUuid(),
      userId: params.userId,
      riskType: params.riskType,
      riskLevel: params.riskLevel || 'low',
      details: params.details || null,
      action: params.action || null,
    });
}

export async function listReferralRiskLogs(params: {
  page: number;
  pageSize: number;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const [totalResult] = await db()
    .select({ count: count() })
    .from(referralRiskLog);
  const items = await db()
    .select()
    .from(referralRiskLog)
    .orderBy(desc(referralRiskLog.createdAt))
    .limit(params.pageSize)
    .offset(offset);

  return { items, total: totalResult.count };
}

export async function resolveRiskLog(params: {
  riskLogId: string;
  resolvedBy: string;
}) {
  await db()
    .update(referralRiskLog)
    .set({
      resolvedAt: new Date(),
      resolvedBy: params.resolvedBy,
    })
    .where(eq(referralRiskLog.id, params.riskLogId));
}

async function getReferralLockDays() {
  const config = await getReferralConfig();
  return config.lockDays;
}

export async function processLockedCommissionsSettlement() {
  const lockDays = await getReferralLockDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lockDays);

  const commissions = await db()
    .select()
    .from(referralCommission)
    .where(
      and(
        or(
          eq(referralCommission.status, 'locked'),
          eq(referralCommission.status, 'pending')
        )!,
        lt(referralCommission.createdAt, cutoffDate)
      )
    );

  for (const commission of commissions) {
    const account = await getOrCreateReferralAccount(commission.referrerUserId);
    if (account.status !== ReferralStatus.ACTIVE) {
      await db()
        .update(referralCommission)
        .set({ status: 'frozen', updatedAt: new Date() })
        .where(eq(referralCommission.id, commission.id));
      continue;
    }

    await db().transaction(async (tx: any) => {
      await tx
        .update(referralCommission)
        .set({ status: 'settled', updatedAt: new Date() })
        .where(eq(referralCommission.id, commission.id));
      await tx
        .update(referralAccount)
        .set({
          pendingCommission: sql`case when ${referralAccount.pendingCommission} >= ${commission.amount} then ${referralAccount.pendingCommission} - ${commission.amount} else 0 end`,
          availableCommission: sql`${referralAccount.availableCommission} + ${commission.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(referralAccount.userId, commission.referrerUserId));
    });
  }

  return { processed: commissions.length };
}

export async function processPendingReferralTasks() {
  const missingCommissions = await repairMissingReferralCommissions();
  const settlement = await processLockedCommissionsSettlement();

  return {
    processed:
      missingCommissions.repairedCommissions +
      Number(settlement.processed || 0),
    missingCommissions,
    settlement,
  };
}
