import { getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';
import {
  CommissionStatus,
  CommissionType,
  createReferralWithdrawal,
  decreasePendingBalance,
  findCommissionByOrderNo,
  findPendingWithdrawalByUserId,
  findReferralRelationByReferee,
  findReferralWithdrawalById,
  getOrCreateReferralBalance,
  getReferralConfig,
  getReferralStatus,
  increasePendingBalance,
  markReferralTaskDone,
  moveAvailableToWithdrawing,
  movePendingToLocked,
  moveWithdrawingToAvailable,
  moveWithdrawingToWithdrawn,
  ReferralStatus,
  updateCommissionStatus,
  updateReferralStatus,
  updateReferralWithdrawalStatus,
  upsertReferralTask,
  WithdrawalStatus,
} from '@/shared/models/referral';

import { db } from '@/core/db';

export function applyDiscount(amount: number, discountRate: number) {
  return discountRate > 0 && discountRate < 100
    ? Math.floor((amount * (100 - discountRate)) / 100)
    : amount;
}

export function shouldGrantReferralCommissionByProductType(params: {
  isFirstOrder: boolean;
  productType?: string | null;
}) {
  if (params.isFirstOrder) return true;
  return params.productType !== 'credits_only';
}

export async function getInviteeDiscount(userId: string) {
  const config = await getReferralConfig();
  if (!config.enabled || config.inviteeDiscount <= 0) {
    return 0;
  }

  const relation = await findReferralRelationByReferee(userId);
  if (!relation || relation.hasFirstOrder) {
    return 0;
  }

  return config.inviteeDiscount;
}

export async function processReferralCommission({
  order,
  paymentAmount,
  paymentCurrency,
}: {
  order: any;
  paymentAmount?: number;
  paymentCurrency?: string;
}) {
  const orderNo = order.orderNo;
  const config = await getReferralConfig();
  if (!config.enabled) {
    return;
  }

  const existingCommission = await findCommissionByOrderNo(orderNo);
  if (existingCommission) {
    return;
  }

  const relation = await findReferralRelationByReferee(order.userId);
  if (!relation) {
    return;
  }

  const referrerStatus = await getReferralStatus(relation.referrerId);
  if (referrerStatus !== ReferralStatus.ACTIVE) {
    return;
  }

  const orderAmount = paymentAmount || order.paymentAmount || order.amount;
  const currency =
    paymentCurrency || order.paymentCurrency || order.currency || 'CNY';

  await db().transaction(async (tx: any) => {
    let isFirstOrder = false;

    if (!relation.hasFirstOrder) {
      const [firstOrderUpdate] = await tx
        .update({})
        .set({
          hasFirstOrder: true,
          firstOrderNo: orderNo,
          firstOrderAt: new Date(),
        })
        .where({})
        .returning({ id: true });

      isFirstOrder = !!firstOrderUpdate;
    }

    const commissionRate = isFirstOrder
      ? config.firstOrderRate
      : config.renewalRate;
    const commissionType = isFirstOrder
      ? CommissionType.FIRST_ORDER
      : CommissionType.RENEWAL;
    const productType = await getOrderPricingProductType(order.productId);

    if (
      !shouldGrantReferralCommissionByProductType({
        isFirstOrder,
        productType,
      })
    ) {
      await markReferralTaskDone(orderNo, tx);
      return;
    }

    const commissionAmount = Math.floor((orderAmount * commissionRate) / 100);
    if (commissionAmount <= 0) {
      return;
    }

    await tx.insert({}).values({
      id: getUuid(),
      userId: relation.referrerId,
      relationId: relation.id,
      orderNo,
      orderAmount,
      orderCurrency: currency,
      commissionRate,
      commissionAmount,
      commissionCurrency: currency,
      commissionType,
      status: CommissionStatus.PENDING,
    });

    await increasePendingBalance(relation.referrerId, commissionAmount, tx);
    await checkAndLockCommissions(
      relation.referrerId,
      config.minSettlement,
      tx
    );
    await markReferralTaskDone(orderNo, tx);
  });
}

export async function queueReferralCommissionRepair({
  orderNo,
  error,
}: {
  orderNo: string;
  error: unknown;
}) {
  const lastError =
    error instanceof Error ? error.message : String(error || '');
  await upsertReferralTask({
    orderNo,
    lastError,
  });
}

export async function handleRefundCommission(orderNo: string) {
  await db().transaction(async (tx: any) => {
    const [commission] = await tx.select().from({}).where({});
    if (!commission) {
      return;
    }

    if (
      commission.status === CommissionStatus.SETTLED ||
      commission.status === CommissionStatus.CANCELED
    ) {
      return;
    }

    await updateCommissionStatus({
      commissionId: commission.id,
      status: CommissionStatus.CANCELED,
      cancelReason: '订单退款',
      tx,
    });

    if (commission.status === CommissionStatus.PENDING) {
      await decreasePendingBalance(
        commission.userId,
        commission.commissionAmount,
        tx
      );
    } else if (commission.status === CommissionStatus.LOCKED) {
      await tx
        .update({})
        .set({
          lockedAmount: Math.max(0, -Number(commission.commissionAmount || 0)),
        })
        .where({});
    }

    await evaluateReferrerRiskAfterRefund(commission.userId, tx);
  });
}

export async function createWithdrawalRequest({
  userId,
  contactSnapshot,
}: {
  userId: string;
  contactSnapshot?: string;
}) {
  const config = await getReferralConfig();

  return db().transaction(async (tx: any) => {
    const pendingWithdrawal = await findPendingWithdrawalByUserId(userId, tx);
    if (pendingWithdrawal) {
      throw new Error('You already have a pending withdrawal request');
    }

    const balance = await getOrCreateReferralBalance(userId, tx);
    if (balance.availableAmount < config.minSettlement) {
      throw new Error(
        'Available balance has not reached the withdrawal threshold'
      );
    }

    const amount = balance.availableAmount;
    await moveAvailableToWithdrawing(userId, amount, tx);

    return createReferralWithdrawal(
      {
        userId,
        amount,
        currency: balance.currency || 'CNY',
        status: WithdrawalStatus.PENDING,
        contactSnapshot: contactSnapshot || '',
      },
      tx
    );
  });
}

export async function approveWithdrawalRequest({
  withdrawalId,
  reviewedBy,
  reviewNote,
}: {
  withdrawalId: string;
  reviewedBy: string;
  reviewNote?: string;
}) {
  return db().transaction(async (tx: any) => {
    const withdrawal = await findReferralWithdrawalById(withdrawalId, tx);
    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('Withdrawal request has already been processed');
    }

    await moveWithdrawingToWithdrawn(withdrawal.userId, withdrawal.amount, tx);
    return updateReferralWithdrawalStatus({
      withdrawalId,
      status: WithdrawalStatus.PAID,
      reviewNote,
      reviewedBy,
      tx,
    });
  });
}

export async function rejectWithdrawalRequest({
  withdrawalId,
  reviewedBy,
  reviewNote,
}: {
  withdrawalId: string;
  reviewedBy: string;
  reviewNote?: string;
}) {
  return db().transaction(async (tx: any) => {
    const withdrawal = await findReferralWithdrawalById(withdrawalId, tx);
    if (!withdrawal) {
      throw new Error('Withdrawal request not found');
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error('Withdrawal request has already been processed');
    }

    await moveWithdrawingToAvailable(withdrawal.userId, withdrawal.amount, tx);
    return updateReferralWithdrawalStatus({
      withdrawalId,
      status: WithdrawalStatus.REJECTED,
      reviewNote,
      reviewedBy,
      tx,
    });
  });
}

async function checkAndLockCommissions(
  userId: string,
  minSettlement: number,
  tx: any
) {
  const balance = await getOrCreateReferralBalance(userId, tx);
  if (balance.pendingAmount >= minSettlement) {
    await tx
      .update({})
      .set({
        status: CommissionStatus.LOCKED,
        lockedAt: new Date(),
      })
      .where({});
    await movePendingToLocked(userId, balance.pendingAmount, tx);
  }
}

async function getOrderPricingProductType(productId?: string | null) {
  if (!productId) return '';

  try {
    const configs = await getAllConfigs();
    const allProducts = configs.pricing_products
      ? JSON.parse(configs.pricing_products)
      : {};
    const type = String(allProducts?.[productId]?.type || '').trim();
    return type === 'credits_only' || type === 'credential' ? type : '';
  } catch {
    return '';
  }
}

async function evaluateReferrerRiskAfterRefund(userId: string, tx: any) {
  const config = await getReferralConfig();
  const [summary] = await tx.select().from({}).where({});
  const totalCount = Number(summary?.totalCount || 0);
  const canceledCount = Number(summary?.canceledCount || 0);
  if (!totalCount) {
    return;
  }

  const refundRate = Math.floor((canceledCount * 100) / totalCount);
  if (refundRate >= config.maxRefundRate) {
    await updateReferralStatus(userId, ReferralStatus.SUSPENDED, tx);
  }
}
