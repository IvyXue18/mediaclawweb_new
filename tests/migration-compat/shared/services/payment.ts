import {
  PaymentStatus,
  PaymentType,
  type PaymentSession,
} from '@/extensions/payment/types';
import { getSnowId, getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';
import {
  createCredential,
  findCredentialByCode,
  findCredentialByCodeAndOwner,
  findCredentialBySourceOrderNo,
  syncCredentialCreditSummary,
} from '@/shared/models/credential';
import {
  calculateCreditExpirationTime,
  CreditStatus,
  CreditTransactionScene,
  CreditTransactionType,
  updateCreditCredentialCodeByOrderNo,
} from '@/shared/models/credit';
import {
  beginOrderCredentialSync,
  OrderCredentialAction,
  OrderCredentialSyncStatus,
  OrderStatus,
  updateOrderByOrderNo,
  updateOrderInTransaction,
  updateSubscriptionInTransaction,
} from '@/shared/models/order';
import {
  SubscriptionStatus,
  updateSubscriptionBySubscriptionNo,
} from '@/shared/models/subscription';
import { eq } from 'drizzle-orm';

import { db } from '@/core/db';
import { envConfigs } from '@/config';
import { credential, credentialCredit, credit } from '@/config/db/schema';

import { migrationPending } from '../../pending';
import {
  processReferralCommission,
  queueReferralCommissionRepair,
} from './referral';

export function getPaymentService() {
  return migrationPending('payment.getPaymentService');
}

export async function repairOrderPayment(order: any) {
  const orderNo = order.orderNo;
  if (!orderNo) {
    throw new Error('invalid order');
  }

  if (!order.paymentProvider || !order.paymentSessionId) {
    throw new Error(`order ${orderNo} missing payment session info`);
  }

  const paymentService = await getPaymentService();
  const paymentProvider = paymentService.getProvider(order.paymentProvider);
  if (!paymentProvider) {
    throw new Error(`payment provider not found: ${order.paymentProvider}`);
  }

  const session = await paymentProvider.getPaymentSession({
    sessionId: order.paymentSessionId,
  });

  if (session.paymentStatus !== PaymentStatus.SUCCESS) {
    return {
      orderNo,
      paymentStatus: session.paymentStatus || null,
      repaired: false,
      session,
    };
  }

  await handleCheckoutSuccess({ order, session });

  return {
    orderNo,
    paymentStatus: session.paymentStatus,
    repaired: true,
    session,
  };
}

export async function handleCheckoutSuccess({
  order,
  session,
}: {
  order: any;
  session: PaymentSession;
}) {
  const orderNo = order.orderNo;
  if (!orderNo) {
    throw new Error('invalid order');
  }

  const isAlreadyPaid = order.status === OrderStatus.PAID;
  if (
    order.status !== OrderStatus.CREATED &&
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.PAID
  ) {
    return;
  }

  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    const subscriptionInfo = session.subscriptionInfo;
    let newSubscription: any | undefined;

    const updateOrder: any = {
      status: OrderStatus.PAID,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: session.paymentInfo?.paymentAmount,
      paymentCurrency: session.paymentInfo?.paymentCurrency,
      discountAmount:
        session.paymentInfo?.discountAmount ?? order.discountAmount,
      discountCurrency:
        session.paymentInfo?.discountCurrency ??
        order.discountCurrency ??
        order.currency,
      discountCode: session.paymentInfo?.discountCode ?? order.discountCode,
      paymentEmail: session.paymentInfo?.paymentEmail,
      paidAt: session.paymentInfo?.paidAt,
      invoiceId: session.paymentInfo?.invoiceId,
      invoiceUrl: session.paymentInfo?.invoiceUrl,
      subscriptionNo: '',
      transactionId: session.paymentInfo?.transactionId,
      paymentUserName: session.paymentInfo?.paymentUserName,
      paymentUserId: session.paymentInfo?.paymentUserId,
    };

    if (subscriptionInfo) {
      newSubscription = {
        id: getUuid(),
        subscriptionNo: getSnowId(),
        userId: order.userId,
        userEmail: order.paymentEmail || order.userEmail,
        status: subscriptionInfo.status || SubscriptionStatus.ACTIVE,
        paymentProvider: order.paymentProvider,
        subscriptionId: subscriptionInfo.subscriptionId,
        subscriptionResult: JSON.stringify(session.subscriptionResult),
        productId: order.productId,
        description: subscriptionInfo.description || 'Subscription Created',
        amount: subscriptionInfo.amount,
        currency: subscriptionInfo.currency,
        interval: subscriptionInfo.interval,
        intervalCount: subscriptionInfo.intervalCount,
        trialPeriodDays: subscriptionInfo.trialPeriodDays,
        currentPeriodStart: subscriptionInfo.currentPeriodStart,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
        billingUrl: subscriptionInfo.billingUrl,
        planName: order.planName || order.productName,
        productName: order.productName,
        creditsAmount: order.creditsAmount,
        creditsValidDays: order.creditsValidDays,
        paymentProductId: order.paymentProductId,
        paymentUserId: session.paymentInfo?.paymentUserId,
      };

      updateOrder.subscriptionNo = newSubscription.subscriptionNo;
      updateOrder.subscriptionId = session.subscriptionId;
      updateOrder.subscriptionResult = JSON.stringify(
        session.subscriptionResult
      );
    }

    let newCredit: any | undefined;
    if (order.creditsAmount && order.creditsAmount > 0) {
      const credits = order.creditsAmount;
      newCredit = {
        id: getUuid(),
        userId: order.userId,
        userEmail: order.userEmail,
        orderNo: order.orderNo,
        subscriptionNo: newSubscription?.subscriptionNo,
        transactionNo: getSnowId(),
        transactionType: CreditTransactionType.GRANT,
        transactionScene:
          order.paymentType === PaymentType.SUBSCRIPTION
            ? CreditTransactionScene.SUBSCRIPTION
            : CreditTransactionScene.PAYMENT,
        credits,
        remainingCredits: credits,
        description: 'Grant credit',
        expiresAt: calculateCreditExpirationTime({
          creditsValidDays: order.creditsValidDays || 0,
          currentPeriodEnd: subscriptionInfo?.currentPeriodEnd,
        }),
        status: CreditStatus.ACTIVE,
        credentialCode: order.credentialCode || undefined,
      };
    }

    if (!isAlreadyPaid) {
      await updateOrderInTransaction({
        orderNo,
        updateOrder,
        newSubscription,
        newCredit,
      });
    }

    let credentialSyncError: unknown = null;
    try {
      await processOrderCredentialSync(order);
    } catch (error) {
      credentialSyncError = error;
    }

    try {
      await processReferralCommission({
        order,
        paymentAmount: session.paymentInfo?.paymentAmount,
        paymentCurrency: session.paymentInfo?.paymentCurrency,
      });
    } catch (error) {
      await queueReferralCommissionRepair({
        orderNo,
        error,
      });
    }

    if (credentialSyncError) {
      throw credentialSyncError;
    }
  } else if (
    session.paymentStatus === PaymentStatus.FAILED ||
    session.paymentStatus === PaymentStatus.CANCELED
  ) {
    await updateOrderByOrderNo(orderNo, {
      status: OrderStatus.FAILED,
      paymentResult: JSON.stringify(session.paymentResult),
    });
  } else if (session.paymentStatus === PaymentStatus.PROCESSING) {
    await updateOrderByOrderNo(orderNo, {
      paymentResult: JSON.stringify(session.paymentResult),
    });
  } else {
    throw new Error('unknown payment status');
  }
}

export async function handleSubscriptionRenewal({
  subscription,
  session,
}: {
  subscription: any;
  session: PaymentSession;
}) {
  const subscriptionNo = subscription.subscriptionNo;
  if (!subscriptionNo || !subscription.amount || !subscription.currency) {
    throw new Error('invalid subscription');
  }

  if (!session.subscriptionId || !session.subscriptionInfo) {
    throw new Error('invalid payment session');
  }
  if (session.subscriptionId !== subscription.subscriptionId) {
    throw new Error('subscription id mismatch');
  }

  const subscriptionInfo = session.subscriptionInfo;
  const orderNo = getSnowId();
  const order = {
    id: getUuid(),
    orderNo,
    userId: subscription.userId,
    userEmail: subscription.userEmail,
    status: OrderStatus.PAID,
    amount: subscription.amount,
    currency: subscription.currency,
    productId: subscription.productId,
    paymentType: PaymentType.RENEW,
    paymentInterval: subscription.interval,
    paymentProvider: session.provider || subscription.paymentProvider,
    checkoutInfo: '',
    createdAt: new Date(),
    productName: subscription.productName,
    description: 'Subscription Renewal',
    callbackUrl: '',
    creditsAmount: subscription.creditsAmount,
    creditsValidDays: subscription.creditsValidDays,
    planName: subscription.planName || '',
    paymentProductId: subscription.paymentProductId,
    paymentResult: JSON.stringify(session.paymentResult),
    paymentAmount: session.paymentInfo?.paymentAmount,
    paymentCurrency: session.paymentInfo?.paymentCurrency,
    transactionId: session.paymentInfo?.transactionId,
    subscriptionNo,
    subscriptionId: session.subscriptionId,
    subscriptionResult: JSON.stringify(session.subscriptionResult),
  };

  let newCredit: any | undefined;
  if (order.creditsAmount && order.creditsAmount > 0) {
    const credits = order.creditsAmount;
    newCredit = {
      id: getUuid(),
      userId: order.userId,
      userEmail: order.userEmail,
      orderNo: order.orderNo,
      subscriptionNo,
      transactionNo: getSnowId(),
      transactionType: CreditTransactionType.GRANT,
      transactionScene: CreditTransactionScene.PAYMENT,
      credits,
      remainingCredits: credits,
      description: 'Grant credit',
      expiresAt: calculateCreditExpirationTime({
        creditsValidDays: order.creditsValidDays || 0,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      }),
      status: CreditStatus.ACTIVE,
    };
  }

  await updateSubscriptionInTransaction({
    subscriptionNo,
    updateSubscription: {
      currentPeriodStart: subscriptionInfo.currentPeriodStart,
      currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
    },
    newOrder: order,
    newCredit,
  });
}

export async function handleSubscriptionUpdated({
  subscription,
  session,
}: {
  subscription: any;
  session: PaymentSession;
}) {
  if (!subscription.subscriptionNo || !session.subscriptionInfo?.status) {
    throw new Error('invalid subscription info');
  }

  await updateSubscriptionBySubscriptionNo(subscription.subscriptionNo, {
    status: session.subscriptionInfo.status,
    currentPeriodStart: session.subscriptionInfo.currentPeriodStart,
    currentPeriodEnd: session.subscriptionInfo.currentPeriodEnd,
    canceledAt: session.subscriptionInfo.canceledAt || null,
    canceledEndAt: session.subscriptionInfo.canceledEndAt || null,
    canceledReason: session.subscriptionInfo.canceledReason || '',
    canceledReasonType: session.subscriptionInfo.canceledReasonType || '',
  });
}

export async function handleSubscriptionCanceled({
  subscription,
  session,
}: {
  subscription: any;
  session: PaymentSession;
}) {
  if (!subscription.subscriptionNo || !session.subscriptionInfo?.canceledAt) {
    throw new Error('invalid subscription info');
  }

  await updateSubscriptionBySubscriptionNo(subscription.subscriptionNo, {
    status: SubscriptionStatus.CANCELED,
    canceledAt: session.subscriptionInfo.canceledAt,
    canceledEndAt: session.subscriptionInfo.canceledEndAt,
    canceledReason: session.subscriptionInfo.canceledReason,
    canceledReasonType: session.subscriptionInfo.canceledReasonType,
  });
}

async function getCredentialParams(order: any): Promise<{
  durationPreset: '1m' | '3m' | '1y';
  maxBindings: number;
}> {
  try {
    const configs = await getAllConfigs();
    if (configs.pricing_products) {
      const allProducts = JSON.parse(configs.pricing_products);
      const productConfig = allProducts[order.productId || ''];
      if (productConfig?.duration_preset) {
        return {
          durationPreset: productConfig.duration_preset,
          maxBindings:
            productConfig.max_bindings ??
            (order.productId?.includes('team') ? 3 : 1),
        };
      }
    }
  } catch {
    // Fall through to route-compatible defaults.
  }

  const productId = order.productId || '';
  const interval = order.paymentInterval || '';
  const durationPreset =
    interval === 'year' ? '1y' : interval === 'month' ? '3m' : '1m';
  const maxBindings = productId.includes('team') ? 3 : 1;

  return { durationPreset, maxBindings };
}

function generateActivationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join('');

  return `ACT-${segment()}-${segment()}-${segment()}`;
}

function parsePriceRuleSnapshot(order: any): Record<string, any> {
  try {
    return order.priceRuleSnapshot ? JSON.parse(order.priceRuleSnapshot) : {};
  } catch {
    return {};
  }
}

async function issueCredentialLocally(order: any): Promise<string> {
  const orderNo = order.orderNo || '';
  const userId = order.userId || '';
  if (!orderNo || !userId) {
    throw new Error('invalid order for local issue');
  }

  const existed = await findCredentialBySourceOrderNo(orderNo);
  if (existed?.code) {
    return existed.code;
  }

  const { durationPreset, maxBindings } = await getCredentialParams(order);
  const expiresAt = getCredentialExpiresAt(durationPreset);

  let retries = 8;
  while (retries > 0) {
    const code = generateActivationCode();
    const duplicated = await findCredentialByCode(code);
    if (duplicated) {
      retries -= 1;
      continue;
    }

    const created = await createCredential({
      id: getUuid(),
      code,
      ownerUserId: userId,
      sourceOrderNo: orderNo,
      planCode: order.productId || 'unknown',
      durationPreset,
      maxBindings,
      expiresAt,
      status: 'active',
      partnerId: order.partnerId || null,
      variantId: order.variantId || 'official',
      notes: `local issue from order ${orderNo}`,
    });

    if (!created?.code) {
      throw new Error('local issue failed to create credential');
    }

    return created.code;
  }

  throw new Error('local issue failed after retry');
}

async function issuePartnerCredentialsLocally(order: any): Promise<string[]> {
  const orderNo = order.orderNo || '';
  const userId = order.userId || '';
  const partnerId = String(order.partnerId || '').trim();
  if (!orderNo || !userId || !partnerId) {
    throw new Error('invalid partner order for local issue');
  }

  const seats = Math.max(1, Math.floor(Number(order.seatCount || 1)));
  const { durationPreset, maxBindings } = await getCredentialParams(order);
  const snapshot = parsePriceRuleSnapshot(order);
  const creditsPerSeat = Math.max(0, Number(snapshot.creditsPerSeat || 0));
  const variantId = String(order.variantId || snapshot.variantId || 'official');
  const expiresAt = getCredentialExpiresAt(durationPreset);
  const now = new Date();
  const codes: string[] = [];

  for (let index = 1; index <= seats; index += 1) {
    const sourceOrderNo = index === 1 ? orderNo : `${orderNo}#${index}`;
    const existed = await findCredentialBySourceOrderNo(sourceOrderNo);
    if (existed?.code) {
      codes.push(existed.code);
      continue;
    }

    let retries = 8;
    let createdCode = '';
    while (retries > 0 && !createdCode) {
      const code = generateActivationCode();
      const duplicated = await findCredentialByCode(code);
      if (duplicated) {
        retries -= 1;
        continue;
      }

      const created = await createCredential({
        id: getUuid(),
        code,
        ownerUserId: userId,
        sourceOrderNo,
        planCode: order.productId || 'unknown',
        durationPreset,
        maxBindings,
        expiresAt,
        status: 'active',
        partnerId,
        variantId,
        notes: `partner ${partnerId} batch issue from order ${orderNo}`,
      });

      if (!created?.code) {
        throw new Error('partner local issue failed to create credential');
      }

      createdCode = created.code;
      codes.push(createdCode);

      if (creditsPerSeat > 0) {
        const creditExpiresAt = calculateCreditExpirationTime({
          creditsValidDays: Number(order.creditsValidDays || 0),
        });
        await db().insert(credit).values({
          id: getUuid(),
          userId,
          userEmail: order.userEmail,
          orderNo: sourceOrderNo,
          transactionNo: getSnowId(),
          transactionType: CreditTransactionType.GRANT,
          transactionScene: CreditTransactionScene.PAYMENT,
          credits: creditsPerSeat,
          remainingCredits: creditsPerSeat,
          description: 'Partner batch grant credit',
          expiresAt: creditExpiresAt,
          status: CreditStatus.ACTIVE,
          credentialCode: createdCode,
        });

        await db().insert(credentialCredit).values({
          id: getUuid(),
          credentialId: created.id,
          credentialCode: createdCode,
          userId,
          orderNo: sourceOrderNo,
          totalCredits: creditsPerSeat,
          usedCredits: 0,
          expiresAt: creditExpiresAt,
          status: 'active',
          activatedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (!createdCode) {
      throw new Error('partner local issue failed after retry');
    }
  }

  return codes;
}

async function rechargeCredentialLocally(order: any): Promise<void> {
  const code = order.credentialCode || '';
  const userId = order.userId || '';
  if (!code || !userId) {
    throw new Error('invalid order for local recharge');
  }

  const owned = await findCredentialByCodeAndOwner({
    code,
    ownerUserId: userId,
  });

  if (!owned) {
    throw new Error('credential code is not owned by current user');
  }

  const creditsAmount = Number(order.creditsAmount || 0);
  if (!Number.isFinite(creditsAmount) || creditsAmount <= 0) {
    return;
  }

  const now = new Date();
  const [existingSummary] = await db()
    .select()
    .from(credentialCredit)
    .where(eq(credentialCredit.credentialCode, code))
    .limit(1);

  if (!existingSummary) {
    await db()
      .insert(credentialCredit)
      .values({
        id: getUuid(),
        credentialId: owned.id,
        credentialCode: code,
        userId,
        orderNo: order.orderNo || null,
        totalCredits: creditsAmount,
        usedCredits: 0,
        expiresAt: calculateCreditExpirationTime({
          creditsValidDays: Number(order.creditsValidDays || 0),
        }),
        status: 'active',
        activatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    return;
  }

  await db()
    .update(credentialCredit)
    .set({
      credentialId: existingSummary.credentialId || owned.id,
      userId: existingSummary.userId || userId,
      orderNo: order.orderNo || existingSummary.orderNo || null,
      totalCredits: (existingSummary.totalCredits || 0) + creditsAmount,
      usedCredits: existingSummary.usedCredits || 0,
      status: 'active',
      activatedAt: existingSummary.activatedAt || now,
      updatedAt: now,
    })
    .where(eq(credentialCredit.credentialCode, code));
}

export async function issueCredential(order: any): Promise<string | null> {
  const apiBase = envConfigs.license_api_base;
  const token = envConfigs.license_internal_token;
  const localMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.LICENSE_USE_REMOTE_IN_DEV !== 'true';

  if (localMode) {
    return issueCredentialLocally(order);
  }

  if (!apiBase || !token) {
    return null;
  }

  const { durationPreset, maxBindings } = await getCredentialParams(order);
  const resp = await fetch(`${apiBase}/api/internal/credential/issue`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify({
      orderNo: order.orderNo,
      durationPreset,
      maxBindings,
      notes: `official site paid order ${order.id}`,
    }),
  });

  const data = await resp.json();
  if (!data?.ok) {
    throw new Error(
      `issue failed: ${data?.reason || 'unknown'} - ${data?.message || ''}`
    );
  }

  return data.data?.code as string;
}

export async function rechargeCredential(order: any): Promise<void> {
  const apiBase = envConfigs.license_api_base;
  const token = envConfigs.license_internal_token;
  const localMode =
    process.env.NODE_ENV !== 'production' &&
    process.env.LICENSE_USE_REMOTE_IN_DEV !== 'true';

  if (localMode) {
    return rechargeCredentialLocally(order);
  }

  if (!apiBase || !token) {
    return;
  }

  const resp = await fetch(`${apiBase}/api/internal/credential/recharge`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-token': token,
    },
    body: JSON.stringify({
      orderNo: order.orderNo,
    }),
  });

  const data = await resp.json();
  if (!data?.ok) {
    throw new Error(
      `recharge failed: ${data?.reason || 'unknown'} - ${data?.message || ''}`
    );
  }
}

async function extendCredentialExpiration(order: any, credentialCode: string) {
  const owned = await findCredentialByCodeAndOwner({
    code: credentialCode,
    ownerUserId: order.userId,
  });
  if (!owned) {
    return;
  }

  const { durationPreset, maxBindings } = await getCredentialParams(order);
  const now = new Date();
  const baseDate =
    owned.expiresAt && owned.expiresAt.getTime() > now.getTime()
      ? new Date(owned.expiresAt)
      : new Date(now);

  if (durationPreset === '1y') {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  } else if (durationPreset === '3m') {
    baseDate.setMonth(baseDate.getMonth() + 3);
  } else {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }

  const isTrialCredential =
    String(owned.planCode || '')
      .trim()
      .toLowerCase() === 'trial';
  const upgradedPlanCode =
    String(
      order.productId || order.paymentProductId || order.planName || ''
    ).trim() || owned.planCode;

  await db()
    .update(credential)
    .set({
      expiresAt: baseDate,
      status: 'active',
      maxBindings,
      ...(isTrialCredential
        ? {
            planCode: upgradedPlanCode,
            durationPreset,
          }
        : {}),
    })
    .where(eq(credential.code, credentialCode));
}

async function processOrderCredentialSync(order: any) {
  const orderNo = order.orderNo;
  if (!orderNo) {
    throw new Error('invalid order');
  }

  const action =
    order.credentialAction ||
    (order.credentialCode
      ? OrderCredentialAction.RECHARGE
      : OrderCredentialAction.ISSUE);

  if (action === OrderCredentialAction.NONE) {
    return;
  }

  if (
    order.credentialSyncStatus === OrderCredentialSyncStatus.DONE &&
    order.credentialProcessedAt
  ) {
    return;
  }

  const lockedOrder = await beginOrderCredentialSync(orderNo);
  if (!lockedOrder) {
    return;
  }

  try {
    let credentialCode = order.credentialCode || '';

    if (action === OrderCredentialAction.RECHARGE) {
      if (!credentialCode) {
        throw new Error('credential code is required for recharge');
      }

      await rechargeCredential({
        ...order,
        credentialCode,
      });

      await extendCredentialExpiration(order, credentialCode);
    } else if (order.partnerId) {
      const credentialCodes = await issuePartnerCredentialsLocally(order);
      credentialCode = credentialCodes[0] || '';
      if (!credentialCode) {
        throw new Error('issue credential returned empty code');
      }

      await Promise.all(
        credentialCodes.map((code) =>
          syncCredentialCreditSummary({
            credentialCode: code,
            ownerUserId: order.userId,
            orderNo,
          })
        )
      );
    } else {
      credentialCode = credentialCode || (await issueCredential(order)) || '';
      if (!credentialCode) {
        throw new Error('issue credential returned empty code');
      }

      await updateCreditCredentialCodeByOrderNo({
        orderNo,
        credentialCode,
      });
    }

    if (!order.partnerId) {
      await syncCredentialCreditSummary({
        credentialCode,
        ownerUserId: order.userId,
        orderNo,
      });
    }

    await updateOrderByOrderNo(orderNo, {
      credentialCode: credentialCode || order.credentialCode || null,
      credentialSyncStatus: OrderCredentialSyncStatus.DONE,
      credentialProcessedAt: new Date(),
      credentialSyncError: null,
    });
  } catch (error: any) {
    await updateOrderByOrderNo(orderNo, {
      credentialSyncStatus: OrderCredentialSyncStatus.FAILED,
      credentialSyncError: error?.message || 'credential sync failed',
    });
    throw error;
  }
}

function getCredentialExpiresAt(durationPreset: '1m' | '3m' | '1y') {
  const expiresAt = new Date();
  if (durationPreset === '1y') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else if (durationPreset === '3m') {
    expiresAt.setMonth(expiresAt.getMonth() + 3);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
}
