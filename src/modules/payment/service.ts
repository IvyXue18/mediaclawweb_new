import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import {
  AlipayProvider,
  CreemProvider,
  PaymentManager,
  StripeProvider,
  WechatPayProvider,
  ZpayProvider,
} from '@/core/payment';
import {
  PaymentStatus,
  PaymentType,
  type CheckoutSession,
  type PaymentEvent,
  type PaymentOrder,
} from '@/core/payment/types';
import { envConfigs } from '@/config';
import { credential, credit, order, subscription } from '@/config/db/schema';
import { getAllConfigs } from '@/modules/config/service';
import {
  createCredential,
  getCredentialByCode,
  rechargeCredential,
} from '@/modules/credentials/service';
import { calculateCreditExpirationTime } from '@/modules/credits/service';
import {
  cancelReferralCommissionForOrder,
  processReferralCommissionForPaidOrder,
} from '@/modules/referral/service';
import {
  findByProviderSubscriptionId,
  findBySubscriptionNo,
  SubscriptionStatus,
  updateBySubscriptionNo,
  type NewSubscription,
  type UpdateSubscription,
} from '@/modules/subscriptions/service';
import { getSnowId, getUniSeq, getUuid } from '@/lib/hash';
import { recordServerAnalyticsEvent } from '@/lib/server-analytics';

// --- Order types ---

enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  PAID = 'paid',
  FAILED = 'failed',
}

function parsePriceRuleSnapshot(value?: string | null): Record<string, any> {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function getCredentialDurationPreset(row: typeof order.$inferSelect) {
  const days = Number(row.creditsValidDays || 0);
  if (days >= 365) return '1y';
  if (days >= 90) return '3m';
  if (days >= 30) return 'monthly';

  const interval = String(row.paymentInterval || '').toLowerCase();
  if (interval === 'year') return '1y';
  if (interval === 'month') return '3m';
  if (String(row.productId || '').includes('year')) return '1y';
  if (String(row.productId || '').includes('month')) return '3m';
  return 'monthly';
}

function getCredentialExpiresAt(durationPreset: string, durationDays?: number) {
  const now = new Date();
  const expiresAt = new Date(now);
  if (durationDays && durationDays > 0) {
    expiresAt.setDate(expiresAt.getDate() + durationDays);
  } else if (durationPreset === '1y' || durationPreset === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else if (durationPreset === '3m' || durationPreset === 'quarterly') {
    expiresAt.setMonth(expiresAt.getMonth() + 3);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  expiresAt.setHours(23, 59, 59, 999);
  return expiresAt;
}

async function getCredentialBySourceOrderNo(sourceOrderNo: string) {
  const [row] = await db()
    .select()
    .from(credential)
    .where(
      and(
        eq(credential.sourceOrderNo, sourceOrderNo),
        isNull(credential.deletedAt)
      )
    )
    .limit(1);
  return row ?? null;
}

function getCredentialMaxBindings(row: typeof order.$inferSelect) {
  const snapshot = parsePriceRuleSnapshot(row.priceRuleSnapshot);
  const snapshotBindings = Math.floor(Number(snapshot.maxBindings || 0));
  if (snapshotBindings > 0) return snapshotBindings;
  return String(row.productId || '').includes('team') ? 3 : 1;
}

async function issuePartnerCredentialsForPaidOrder(
  paidOrder: typeof order.$inferSelect
) {
  if (!paidOrder.partnerId) return [];

  const seats = Math.min(
    500,
    Math.max(1, Math.floor(Number(paidOrder.seatCount || 1)))
  );
  const durationPreset = getCredentialDurationPreset(paidOrder);
  const expiresAt = getCredentialExpiresAt(
    durationPreset,
    Number(paidOrder.creditsValidDays || 0)
  );
  const snapshot = parsePriceRuleSnapshot(paidOrder.priceRuleSnapshot);
  const totalCredits = Math.max(
    0,
    Number(snapshot.creditsPerSeat || paidOrder.creditsAmount || 0)
  );
  const maxBindings = getCredentialMaxBindings(paidOrder);
  const codes: string[] = [];

  for (let index = 1; index <= seats; index += 1) {
    const sourceOrderNo =
      index === 1 ? paidOrder.orderNo : `${paidOrder.orderNo}#${index}`;
    const existing = await getCredentialBySourceOrderNo(sourceOrderNo);
    if (existing?.code) {
      codes.push(existing.code);
      continue;
    }

    const created = await createCredential({
      ownerEmail: paidOrder.userEmail,
      sourceOrderNo,
      planCode: paidOrder.productId || 'unknown',
      durationPreset,
      maxBindings,
      expiresAt,
      partnerId: paidOrder.partnerId,
      variantId: paidOrder.variantId || 'official',
      notes: `partner ${paidOrder.partnerId} batch issue from order ${paidOrder.orderNo}`,
      totalCredits: totalCredits > 0 ? totalCredits : null,
    });
    codes.push(created.code);
  }

  return codes;
}

async function issueCredentialForPaidOrder(
  paidOrder: typeof order.$inferSelect
) {
  const existing = await getCredentialBySourceOrderNo(paidOrder.orderNo);
  if (existing?.code) return existing.code;

  const durationPreset = getCredentialDurationPreset(paidOrder);
  const expiresAt = getCredentialExpiresAt(
    durationPreset,
    Number(paidOrder.creditsValidDays || 0)
  );
  const created = await createCredential({
    ownerEmail: paidOrder.userEmail,
    sourceOrderNo: paidOrder.orderNo,
    planCode: paidOrder.productId || 'unknown',
    durationPreset,
    maxBindings: getCredentialMaxBindings(paidOrder),
    expiresAt,
    notes: `paid issue from order ${paidOrder.orderNo}`,
    totalCredits:
      paidOrder.creditsAmount && paidOrder.creditsAmount > 0
        ? paidOrder.creditsAmount
        : null,
  });

  return created.code;
}

async function rechargeCredentialForPaidOrder(
  paidOrder: typeof order.$inferSelect
) {
  const code = String(paidOrder.credentialCode || '').trim();
  if (!code) throw new Error('credential code is required for recharge');

  const existing = await getCredentialByCode(code);
  if (!existing) throw new Error('Activation code not found');

  const durationPreset = getCredentialDurationPreset(paidOrder);
  await rechargeCredential({
    id: existing.id,
    credits: paidOrder.creditsAmount || 0,
    durationDays: paidOrder.creditsValidDays || 0,
    maxBindings: getCredentialMaxBindings(paidOrder),
    planCode:
      paidOrder.productId && paidOrder.productId.startsWith('credits-')
        ? existing.planCode
        : paidOrder.productId,
    durationPreset:
      paidOrder.productId && paidOrder.productId.startsWith('credits-')
        ? existing.durationPreset
        : durationPreset,
    status: 'active',
    notes: `paid recharge from order ${paidOrder.orderNo}`,
  });

  return existing.code;
}

async function processPaidOrderCredentialSync(
  paidOrder: typeof order.$inferSelect
) {
  const action = String(paidOrder.credentialAction || 'none');
  if (action === 'none') return;

  try {
    let credentialCode = paidOrder.credentialCode || null;

    if (action === 'recharge') {
      credentialCode = await rechargeCredentialForPaidOrder(paidOrder);
    } else if (paidOrder.partnerId) {
      const codes = await issuePartnerCredentialsForPaidOrder(paidOrder);
      credentialCode = codes[0] || credentialCode;
    } else {
      credentialCode = await issueCredentialForPaidOrder(paidOrder);
    }

    await db()
      .update(order)
      .set({
        credentialCode,
        credentialSyncStatus: 'done',
        credentialSyncError: null,
        credentialProcessedAt: new Date(),
      })
      .where(eq(order.id, paidOrder.id));
  } catch (error: any) {
    await db()
      .update(order)
      .set({
        credentialSyncStatus: 'failed',
        credentialSyncError: error?.message || 'credential sync failed',
      })
      .where(eq(order.id, paidOrder.id));
  }
}

async function processPaidOrderReferralCommission(
  paidOrder: typeof order.$inferSelect,
  orderUpdate: Record<string, any>
) {
  if (paidOrder.partnerId) return;

  try {
    await processReferralCommissionForPaidOrder({
      order: paidOrder,
      paymentAmount: orderUpdate.paymentAmount || paidOrder.amount,
      paymentCurrency: orderUpdate.paymentCurrency || paidOrder.currency,
    });
  } catch (error) {
    console.error('[payment] referral commission failed:', error);
  }
}

function getOrderNoFromPaymentEvent(event: PaymentEvent) {
  const session = event.paymentSession || {};
  const result =
    session.paymentResult ||
    event.eventResult?.resource ||
    event.eventResult ||
    {};
  const metadata = session.metadata || result.metadata || {};

  return (
    metadata.order_no ||
    metadata.orderNo ||
    result.order_no ||
    result.orderNo ||
    result.out_trade_no ||
    result.outTradeNo ||
    result.invoice_id ||
    ''
  );
}

async function handlePaymentRefunded(event: PaymentEvent) {
  const orderNo = getOrderNoFromPaymentEvent(event);
  if (!orderNo) return;
  await cancelReferralCommissionForOrder(orderNo, 'payment_refunded');
}

// --- Payment Manager ---

let manager: PaymentManager | null = null;
let managerConfigHash = '';

async function getPaymentManager(): Promise<PaymentManager> {
  const configs = await getAllConfigs();
  const c = (key: string) => configs[key] || '';

  // Rebuild manager if provider configs changed
  const hash = JSON.stringify([
    c('stripe_secret_key') || c('stripe_api_key'),
    c('creem_enabled'),
    c('creem_api_key'),
    c('alipay_app_id'),
    c('wechat_mch_id'),
    c('zpay_enabled'),
    c('zpay_pid'),
    c('zpay_pkey'),
    c('default_payment_provider'),
  ]);
  if (manager && hash === managerConfigHash) return manager;

  manager = new PaymentManager();
  managerConfigHash = hash;

  const stripeKey = c('stripe_secret_key') || c('stripe_api_key');
  if (stripeKey) {
    const isDefault =
      !c('default_payment_provider') ||
      c('default_payment_provider') === 'stripe';
    manager.addProvider(
      new StripeProvider({
        secretKey: stripeKey,
        publishableKey: c('stripe_publishable_key'),
        signingSecret:
          c('stripe_signing_secret') || c('stripe_webhook_secret') || undefined,
        allowPromotionCodes: true,
        allowedPaymentMethods: ['card', 'wechat_pay', 'alipay'],
      }),
      isDefault
    );
  }

  if (c('creem_enabled') === 'true' && c('creem_api_key')) {
    const isDefault = c('default_payment_provider') === 'creem';
    manager.addProvider(
      new CreemProvider({
        apiKey: c('creem_api_key'),
        signingSecret: c('creem_signing_secret') || undefined,
        environment:
          c('creem_environment') === 'production' ? 'production' : 'sandbox',
      }),
      isDefault
    );
  }

  if (c('alipay_app_id') && c('alipay_private_key')) {
    const isDefault = c('default_payment_provider') === 'alipay';
    manager.addProvider(
      new AlipayProvider({
        appId: c('alipay_app_id'),
        privateKey: c('alipay_private_key'),
        alipayPublicKey: c('alipay_public_key'),
        notifyUrl: c('alipay_notify_url') || undefined,
      }),
      isDefault
    );
  }

  if (c('wechat_mch_id') && c('wechat_private_key')) {
    const isDefault = c('default_payment_provider') === 'wechat';
    manager.addProvider(
      new WechatPayProvider({
        appId: c('wechat_app_id'),
        mchId: c('wechat_mch_id'),
        apiV3Key: c('wechat_api_v3_key'),
        privateKey: c('wechat_private_key'),
        serialNo: c('wechat_serial_no'),
        notifyUrl: c('wechat_notify_url') || undefined,
        platformCert: c('wechat_platform_cert') || undefined,
      }),
      isDefault
    );
  }

  const zpayEnabled =
    c('zpay_enabled') === 'true' || c('default_payment_provider') === 'zpay';
  const zpayPid = c('zpay_pid') || envConfigs.zpay_pid;
  const zpayPkey = c('zpay_pkey') || envConfigs.zpay_pkey;
  if (zpayEnabled && zpayPid && zpayPkey) {
    const isDefault = c('default_payment_provider') === 'zpay';
    manager.addProvider(
      new ZpayProvider({
        pid: zpayPid,
        pkey: zpayPkey,
        appUrl: c('app_url') || envConfigs.app_url,
      }),
      isDefault
    );
  }

  return manager;
}

// --- Checkout ---

export async function createCheckout(params: {
  userId: string;
  userEmail?: string;
  paymentOrder: PaymentOrder;
  provider?: string;
  productName?: string;
  planName?: string;
  credits?: number;
  creditsValidDays?: number;
  credentialAction?: string;
  credentialCode?: string | null;
  partnerId?: string | null;
  variantId?: string | null;
  seatCount?: number;
  priceRuleSnapshot?: string | null;
}): Promise<CheckoutSession> {
  const {
    userId,
    userEmail,
    paymentOrder,
    provider,
    productName,
    planName,
    credits,
    creditsValidDays,
    credentialAction,
    credentialCode,
    partnerId,
    variantId,
    seatCount,
    priceRuleSnapshot,
  } = params;
  const pm = await getPaymentManager();
  const orderNo = getUniSeq('ORD');

  // Resolve provider-specific product ID (e.g. Creem product_ids_mapping)
  const resolvedProvider = provider || pm.getDefaultProvider()?.name;
  let resolvedProductId = paymentOrder.productId;
  if (resolvedProvider === 'creem' && paymentOrder.productId) {
    const configs = await getAllConfigs();
    const mapping = configs.creem_product_ids_mapping;
    if (mapping) {
      try {
        const map = JSON.parse(mapping) as Record<string, string>;
        if (map[paymentOrder.productId]) {
          resolvedProductId = map[paymentOrder.productId];
        }
      } catch {
        // invalid JSON — fall through with original productId
      }
    }
  }

  const finalSuccessUrl =
    paymentOrder.successUrl ||
    `${envConfigs.app_url}/settings/payments?success=1`;
  const callbackSuccessUrl = `${envConfigs.app_url}/api/payment/callback?order_no=${orderNo}&redirect=${encodeURIComponent(finalSuccessUrl)}`;

  const providerOrder: PaymentOrder = {
    ...paymentOrder,
    productId: resolvedProductId,
    orderNo,
    metadata: {
      order_no: orderNo,
      user_id: userId,
      ...(paymentOrder.metadata || {}),
    },
    successUrl: callbackSuccessUrl,
    cancelUrl:
      paymentOrder.cancelUrl ||
      `${envConfigs.app_url}/settings/payments?canceled=1`,
  };

  const session = await pm.createPayment({
    order: providerOrder,
    provider,
  });

  await db()
    .insert(order)
    .values({
      id: getUuid(),
      orderNo,
      userId,
      userEmail: userEmail || '',
      status: OrderStatus.CREATED,
      amount: paymentOrder.price?.amount || 0,
      currency: paymentOrder.price?.currency || 'usd',
      productId: paymentOrder.productId || '',
      productName: productName || null,
      planName: planName || null,
      creditsAmount: credits ?? null,
      creditsValidDays: creditsValidDays ?? null,
      credentialAction: credentialAction || 'none',
      credentialSyncStatus: 'pending',
      credentialCode: credentialCode || null,
      partnerId: partnerId || null,
      variantId: variantId || null,
      seatCount: Math.max(1, Math.floor(Number(seatCount || 1))),
      priceRuleSnapshot: priceRuleSnapshot || null,
      paymentType: paymentOrder.type || 'one-time',
      paymentProvider: session.provider,
      paymentSessionId: session.checkoutInfo.sessionId,
      checkoutInfo: JSON.stringify(session.checkoutInfo),
      checkoutResult: JSON.stringify(session.checkoutResult),
      checkoutUrl: session.checkoutInfo.checkoutUrl,
      description: paymentOrder.description || '',
    });

  return session;
}

// --- Payment callback (return_url) ---

export async function handlePaymentCallback(orderNo: string) {
  // Find the order
  const [existingOrder] = await db()
    .select()
    .from(order)
    .where(eq(order.orderNo, orderNo))
    .limit(1);

  if (!existingOrder) return;
  if (existingOrder.status === OrderStatus.PAID) return;

  // Query the payment provider for latest status
  const pm = await getPaymentManager();
  const provider = pm.getProvider(existingOrder.paymentProvider);
  if (!provider) return;

  const session = await provider.getPaymentSession({
    sessionId: existingOrder.paymentSessionId || existingOrder.orderNo,
  });

  // Reuse the same atomic success handler as the webhook so that
  // subscriptions are created and credits granted on synchronous return too.
  // This is important in environments where webhooks aren't reachable (e.g. localhost).
  await handleCheckoutSuccess(session, existingOrder.paymentProvider);
}

// --- Webhook handling ---

export async function handleWebhook(params: {
  req: Request;
  provider: string;
}): Promise<PaymentEvent> {
  const pm = await getPaymentManager();
  const event = await pm.getPaymentEvent({
    req: params.req,
    provider: params.provider,
  });
  const session = event.paymentSession;
  if (!session) return event;

  const eventType = event.eventType;

  // Route event to appropriate handler
  if (eventType === 'checkout.success' || eventType === 'payment.success') {
    await handleCheckoutSuccess(session, params.provider);
  } else if (eventType === 'subscribe.updated') {
    await handleSubscriptionUpdated(session, params.provider);
  } else if (eventType === 'subscribe.canceled') {
    await handleSubscriptionCanceled(session, params.provider);
  } else if (eventType === 'payment.refunded') {
    await handlePaymentRefunded(event);
  }

  return event;
}

// --- Checkout Success: update order + create subscription + grant credits ---

export async function handleCheckoutSuccess(session: any, provider: string) {
  // Different providers expose the session identifier under different keys.
  // We try the common shapes; for Alipay the natural key is out_trade_no
  // (which equals our orderNo and the value we stored in paymentSessionId).
  const result = session.paymentResult || {};
  const metadata = session.metadata || result.metadata || {};
  const sessionId: string =
    result.id ||
    result.object?.id ||
    result.out_trade_no ||
    result.outTradeNo ||
    '';
  if (!sessionId) return;

  // Find order by session ID
  let [existingOrder] = await db()
    .select()
    .from(order)
    .where(and(eq(order.paymentSessionId, sessionId), isNull(order.deletedAt)))
    .limit(1);

  if (!existingOrder && (result.out_trade_no || result.outTradeNo)) {
    const orderNo = result.out_trade_no || result.outTradeNo;
    [existingOrder] = await db()
      .select()
      .from(order)
      .where(and(eq(order.orderNo, orderNo), isNull(order.deletedAt)))
      .limit(1);
  }

  if (!existingOrder && metadata.order_no) {
    [existingOrder] = await db()
      .select()
      .from(order)
      .where(and(eq(order.orderNo, metadata.order_no), isNull(order.deletedAt)))
      .limit(1);
  }

  if (!existingOrder) return;

  // Idempotency: skip if already paid
  if (existingOrder.status === OrderStatus.PAID) return;
  if (
    existingOrder.status !== OrderStatus.CREATED &&
    existingOrder.status !== OrderStatus.PENDING
  )
    return;

  const paymentInfo = session.paymentInfo;
  const subscriptionInfo = session.subscriptionInfo;

  if (session.paymentStatus === PaymentStatus.SUCCESS) {
    // Prepare order update
    const orderUpdate: Record<string, any> = {
      status: OrderStatus.PAID,
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: paymentInfo?.paymentAmount || null,
      paymentCurrency: paymentInfo?.paymentCurrency || null,
      paymentEmail: paymentInfo?.paymentEmail || null,
      paidAt: paymentInfo?.paidAt || new Date(),
      transactionId: paymentInfo?.transactionId || null,
      invoiceId: paymentInfo?.invoiceId || null,
      invoiceUrl: paymentInfo?.invoiceUrl || null,
      paymentUserName: paymentInfo?.paymentUserName || null,
      paymentUserId: paymentInfo?.paymentUserId || null,
      discountCode: paymentInfo?.discountCode || null,
      discountAmount: paymentInfo?.discountAmount || null,
    };

    // Atomically update order + create subscription + grant credits
    await db().transaction(async (tx: any) => {
      // 1. Create subscription if applicable
      if (subscriptionInfo && session.subscriptionId) {
        const subNo = getSnowId();
        const newSub: any = {
          id: getUuid(),
          subscriptionNo: subNo,
          userId: existingOrder.userId,
          userEmail:
            existingOrder.userEmail || existingOrder.paymentEmail || '',
          status: subscriptionInfo.status || SubscriptionStatus.ACTIVE,
          paymentProvider: provider,
          subscriptionId: session.subscriptionId,
          subscriptionResult: JSON.stringify(session.subscriptionResult),
          productId: existingOrder.productId,
          description: subscriptionInfo.description || 'Subscription Created',
          amount: subscriptionInfo.amount,
          currency: subscriptionInfo.currency,
          interval: subscriptionInfo.interval,
          intervalCount: subscriptionInfo.intervalCount,
          trialPeriodDays: subscriptionInfo.trialPeriodDays,
          currentPeriodStart: subscriptionInfo.currentPeriodStart,
          currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
          billingUrl: subscriptionInfo.billingUrl,
          planName: existingOrder.planName || existingOrder.productName,
          productName: existingOrder.productName,
          creditsAmount: existingOrder.creditsAmount,
          creditsValidDays: existingOrder.creditsValidDays,
          paymentProductId: existingOrder.paymentProductId,
          paymentUserId: paymentInfo?.paymentUserId,
        };
        await tx.insert(subscription).values(newSub);
        orderUpdate.subscriptionNo = subNo;
        orderUpdate.subscriptionId = session.subscriptionId;
        orderUpdate.subscriptionResult = JSON.stringify(
          session.subscriptionResult
        );
      }

      // 2. Grant credits if applicable
      if (
        !existingOrder.partnerId &&
        String(existingOrder.credentialAction || 'none') === 'none' &&
        existingOrder.creditsAmount &&
        existingOrder.creditsAmount > 0
      ) {
        const credits = existingOrder.creditsAmount;
        const expiresAt = calculateCreditExpirationTime({
          creditsValidDays: existingOrder.creditsValidDays || 0,
          currentPeriodEnd: subscriptionInfo?.currentPeriodEnd,
        });

        await tx.insert(credit).values({
          id: getUuid(),
          userId: existingOrder.userId,
          userEmail: existingOrder.userEmail || '',
          orderNo: existingOrder.orderNo,
          subscriptionNo: orderUpdate.subscriptionNo || '',
          transactionNo: getSnowId(),
          transactionType: 'grant',
          transactionScene:
            existingOrder.paymentType === 'subscription'
              ? 'subscription'
              : 'payment',
          credits,
          remainingCredits: credits,
          description: 'Grant credit',
          expiresAt,
          status: 'active',
        });
      }

      // 3. Update order
      await tx
        .update(order)
        .set(orderUpdate)
        .where(eq(order.id, existingOrder.id));
    });

    await processPaidOrderCredentialSync(existingOrder);
    await processPaidOrderReferralCommission(existingOrder, orderUpdate);
    await recordServerAnalyticsEvent({
      eventName: 'payment_success',
      source: 'server',
      userId: existingOrder.userId,
      orderNo: existingOrder.orderNo,
      properties: {
        productId: existingOrder.productId,
        productName: existingOrder.productName,
        planName: existingOrder.planName,
        paymentProvider: provider,
        paymentType: existingOrder.paymentType,
        credentialAction: existingOrder.credentialAction || 'none',
        credentialCode: existingOrder.credentialCode || undefined,
        amount: orderUpdate.paymentAmount || existingOrder.amount,
        currency: orderUpdate.paymentCurrency || existingOrder.currency,
        paidAt:
          orderUpdate.paidAt instanceof Date
            ? orderUpdate.paidAt.toISOString()
            : undefined,
      },
    });
  } else if (
    session.paymentStatus === PaymentStatus.FAILED ||
    session.paymentStatus === PaymentStatus.CANCELED
  ) {
    await db()
      .update(order)
      .set({
        status: OrderStatus.FAILED,
        paymentResult: JSON.stringify(session.paymentResult),
      })
      .where(eq(order.id, existingOrder.id));
  }
}

// --- Subscription Renewal ---

export async function handleSubscriptionRenewal(
  session: any,
  provider: string
) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub || !existingSub.amount || !existingSub.currency) return;

  const subscriptionInfo = session.subscriptionInfo;
  if (
    !subscriptionInfo.currentPeriodStart ||
    !subscriptionInfo.currentPeriodEnd
  )
    return;

  if (session.paymentStatus !== PaymentStatus.SUCCESS) return;

  const paymentInfo = session.paymentInfo;

  // Idempotency: drop duplicate renewals for the same provider transaction.
  if (paymentInfo?.transactionId) {
    const [dup] = await db()
      .select({ id: order.id })
      .from(order)
      .where(
        and(
          eq(order.transactionId, paymentInfo.transactionId),
          eq(order.paymentProvider, provider)
        )
      )
      .limit(1);
    if (dup) return;
  }

  const renewalOrderNo = getSnowId();

  await db().transaction(async (tx: any) => {
    // 1. Update subscription period
    await tx
      .update(subscription)
      .set({
        currentPeriodStart: subscriptionInfo.currentPeriodStart,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      })
      .where(eq(subscription.subscriptionNo, existingSub.subscriptionNo));

    // 2. Create renewal order
    await tx.insert(order).values({
      id: getUuid(),
      orderNo: renewalOrderNo,
      userId: existingSub.userId,
      userEmail: existingSub.userEmail || '',
      status: OrderStatus.PAID,
      amount: existingSub.amount,
      currency: existingSub.currency,
      productId: existingSub.productId || '',
      paymentType: 'renew',
      paymentInterval: existingSub.interval || '',
      paymentProvider: provider,
      checkoutInfo: '',
      description: 'Subscription Renewal',
      productName: existingSub.productName || '',
      planName: existingSub.planName || '',
      creditsAmount: existingSub.creditsAmount,
      creditsValidDays: existingSub.creditsValidDays,
      paymentProductId: existingSub.paymentProductId || '',
      paymentResult: JSON.stringify(session.paymentResult),
      paymentAmount: paymentInfo?.paymentAmount,
      paymentCurrency: paymentInfo?.paymentCurrency,
      paymentEmail: paymentInfo?.paymentEmail,
      paidAt: paymentInfo?.paidAt || new Date(),
      invoiceId: paymentInfo?.invoiceId,
      invoiceUrl: paymentInfo?.invoiceUrl,
      subscriptionNo: existingSub.subscriptionNo,
      subscriptionId: session.subscriptionId,
      transactionId: paymentInfo?.transactionId,
      paymentUserName: paymentInfo?.paymentUserName,
      paymentUserId: paymentInfo?.paymentUserId,
    });

    // 3. Grant credits for renewal
    if (existingSub.creditsAmount && existingSub.creditsAmount > 0) {
      const credits = existingSub.creditsAmount;
      const expiresAt = calculateCreditExpirationTime({
        creditsValidDays: existingSub.creditsValidDays || 0,
        currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      });

      await tx.insert(credit).values({
        id: getUuid(),
        userId: existingSub.userId,
        userEmail: existingSub.userEmail || '',
        orderNo: renewalOrderNo,
        subscriptionNo: existingSub.subscriptionNo,
        transactionNo: getSnowId(),
        transactionType: 'grant',
        transactionScene: 'renewal',
        credits,
        remainingCredits: credits,
        description: 'Grant credit',
        expiresAt,
        status: 'active',
      });
    }
  });
}

// --- Subscription Updated ---

async function handleSubscriptionUpdated(session: any, provider: string) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub) return;

  const info = session.subscriptionInfo;
  await updateBySubscriptionNo(existingSub.subscriptionNo, {
    status: info.status,
    currentPeriodStart: info.currentPeriodStart,
    currentPeriodEnd: info.currentPeriodEnd,
    canceledAt: info.canceledAt || null,
    canceledEndAt: info.canceledEndAt || null,
    canceledReason: info.canceledReason || '',
    canceledReasonType: info.canceledReasonType || '',
  });
}

// --- Subscription Canceled ---

async function handleSubscriptionCanceled(session: any, provider: string) {
  if (!session.subscriptionId || !session.subscriptionInfo) return;

  const existingSub = await findByProviderSubscriptionId({
    provider,
    subscriptionId: session.subscriptionId,
  });
  if (!existingSub) return;

  const info = session.subscriptionInfo;
  await updateBySubscriptionNo(existingSub.subscriptionNo, {
    status: SubscriptionStatus.CANCELED,
    canceledAt: info.canceledAt,
    canceledEndAt: info.canceledEndAt,
    canceledReason: info.canceledReason,
    canceledReasonType: info.canceledReasonType,
  });
}

// --- Cancel subscription (user-initiated) ---

export async function cancelUserSubscription(params: {
  userId: string;
  subscriptionNo: string;
}) {
  const { userId, subscriptionNo } = params;

  const sub = await findBySubscriptionNo(subscriptionNo);
  if (!sub) throw new Error('Subscription not found');
  if (sub.userId !== userId) throw new Error('Forbidden');

  if (
    sub.status === SubscriptionStatus.CANCELED ||
    sub.status === SubscriptionStatus.EXPIRED
  ) {
    return sub;
  }

  const pm = await getPaymentManager();
  const provider = pm.getProvider(sub.paymentProvider);
  if (!provider || !provider.cancelSubscription) {
    throw new Error('Cancellation not supported for this provider');
  }

  const session = await provider.cancelSubscription({
    subscriptionId: sub.subscriptionId,
  });

  const info = session.subscriptionInfo;
  const updated = await updateBySubscriptionNo(subscriptionNo, {
    status: info?.status || SubscriptionStatus.CANCELED,
    canceledAt: info?.canceledAt || new Date(),
    canceledEndAt: info?.canceledEndAt || null,
    canceledReason: info?.canceledReason || 'Canceled by user',
    canceledReasonType: info?.canceledReasonType || 'user_request',
  });

  return updated;
}

export async function getUserSubscriptionBillingPortal(params: {
  userId: string;
  subscriptionNo: string;
  returnUrl?: string;
}) {
  const { userId, subscriptionNo } = params;

  const sub = await findBySubscriptionNo(subscriptionNo);
  if (!sub) throw new Error('Subscription not found');
  if (sub.userId !== userId) throw new Error('Forbidden');
  if (!sub.paymentProvider || !sub.paymentUserId) {
    throw new Error('Subscription with no payment user id');
  }

  const pm = await getPaymentManager();
  const provider = pm.getProvider(sub.paymentProvider);
  if (!provider || !provider.getPaymentBilling) {
    throw new Error('Billing portal not supported for this provider');
  }

  const billing = await provider.getPaymentBilling({
    customerId: sub.paymentUserId,
    returnUrl: params.returnUrl || `${envConfigs.app_url}/settings/payments`,
  });
  if (!billing?.billingUrl) {
    throw new Error('Billing url not found');
  }

  await updateBySubscriptionNo(sub.subscriptionNo, {
    billingUrl: billing.billingUrl,
  });

  return {
    billingUrl: billing.billingUrl,
    subscriptionNo: sub.subscriptionNo,
    paymentProvider: sub.paymentProvider,
  };
}

// --- Query helpers ---

export async function getUserOrders(userId: string) {
  return db()
    .select()
    .from(order)
    .where(and(eq(order.userId, userId), isNull(order.deletedAt)))
    .orderBy(desc(order.createdAt));
}

export async function findOrderByOrderNo(orderNo: string) {
  const [row] = await db()
    .select()
    .from(order)
    .where(and(eq(order.orderNo, orderNo), isNull(order.deletedAt)))
    .limit(1);

  return row ?? null;
}

export async function repairOrderPayment(
  existingOrder: typeof order.$inferSelect
) {
  if (!existingOrder.orderNo) {
    throw new Error('invalid order');
  }

  await handlePaymentCallback(existingOrder.orderNo);
  const refreshed = await findOrderByOrderNo(existingOrder.orderNo);
  const paymentStatus = refreshed?.status || existingOrder.status || null;

  return {
    orderNo: existingOrder.orderNo,
    paymentStatus,
    repaired:
      existingOrder.status !== OrderStatus.PAID &&
      refreshed?.status === OrderStatus.PAID,
    order: refreshed,
  };
}
