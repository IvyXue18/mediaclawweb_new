/**
 * 9 元全能卡（trial-starter）domain logic.
 *
 * The starter card reuses plan_code='trial'. A PAID trial is a trial credential
 * with a non-empty sourceOrderNo; legacy free trials have no linked order.
 * Purchase is limited to accounts that never claimed ANY trial (free or paid).
 * The ¥9 paid amount is fully deductible on the first subscription order while
 * the starter card is still valid (expires with the card).
 */
import { and, desc, eq, inArray, isNotNull, isNull, lt } from 'drizzle-orm';

import { db } from '@/core/db';
import { benefitTask, credential, order } from '@/config/db/schema';
import { resolvePricingProduct } from '@/config/pricing';
import {
  getAllConfigs,
  type ConfigReadOptions,
} from '@/modules/config/service';
import { hashBrowserInstallId } from '@/lib/browser-install-id.server';

export const STARTER_PRODUCT_ID = 'trial-starter';
export const STARTER_DEDUCTION_CODE = 'trial_deduction';
export const STARTER_DEDUCTION_CENTS = 900;
export const STARTER_PENDING_ORDER_TTL_MS = 30 * 60 * 1000;
const LEGACY_TRIAL_TASK_TYPE = 'channel_survey_trial';

export async function getStarterProduct(options: ConfigReadOptions = {}) {
  const configs = await getAllConfigs(options);
  return resolvePricingProduct(STARTER_PRODUCT_ID, configs)!;
}

export type StarterStatus = {
  /** Whether this account may purchase the starter card. */
  eligible: boolean;
  /** Why the account is not eligible ('' when eligible). */
  reason:
    | ''
    | 'has_free_trial'
    | 'has_paid_trial'
    | 'has_pending_order'
    | 'browser_already_used';
  /** Existing starter order that should be resumed instead of duplicated. */
  pendingOrder: {
    orderNo: string;
    status: string;
    checkoutUrl: string | null;
    createdAt: string;
  } | null;
  /** The user's paid starter trial, if any. */
  paidTrial: {
    credentialId: string;
    code: string;
    expiresAt: string | null;
    active: boolean;
  } | null;
  /** Whether the ¥9 deduction can still be applied to a subscription order. */
  deductionAvailable: boolean;
  deductionCents: number;
  /** Deduction deadline (= card expiry) when a paid trial exists. */
  deductionExpiresAt: string | null;
};

function isTrialActive(row: {
  status: string | null;
  expiresAt: Date | null;
}): boolean {
  if (String(row.status || '') !== 'active') return false;
  if (!row.expiresAt) return true;
  return row.expiresAt.getTime() > Date.now();
}

async function findUserTrialCredentials(userId: string) {
  return db()
    .select({
      id: credential.id,
      code: credential.code,
      status: credential.status,
      expiresAt: credential.expiresAt,
      sourceOrderNo: credential.sourceOrderNo,
    })
    .from(credential)
    .where(
      and(
        eq(credential.ownerUserId, userId),
        eq(credential.planCode, 'trial'),
        isNull(credential.deletedAt)
      )
    )
    .orderBy(desc(credential.createdAt));
}

async function findLatestOpenStarterOrder(userId: string) {
  const rows = await db()
    .select({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      createdAt: order.createdAt,
    })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.productId, STARTER_PRODUCT_ID),
        inArray(order.status, ['created', 'pending', 'paid']),
        isNull(order.deletedAt)
      )
    )
    .orderBy(desc(order.createdAt));

  const paidOrder = rows.find((row) => row.status === 'paid');
  if (paidOrder) return paidOrder;

  return (
    rows.find(
      (row) =>
        row.createdAt.getTime() > Date.now() - STARTER_PENDING_ORDER_TTL_MS &&
        Boolean(String(row.checkoutUrl || '').trim())
    ) ?? null
  );
}

async function hasOtherAccountUsedBrowser(
  userId: string,
  browserInstallHash: string
) {
  if (!browserInstallHash) return false;

  // Preserve the free-trial protection: a browser that previously received a
  // survey trial cannot switch accounts to purchase the paid starter card.
  const legacyRows = await db()
    .select({ userId: benefitTask.userId })
    .from(benefitTask)
    .where(
      and(
        eq(benefitTask.browserInstallHash, browserInstallHash),
        eq(benefitTask.taskType, LEGACY_TRIAL_TASK_TYPE),
        eq(benefitTask.rewardType, 'trial_code')
      )
    )
    .limit(1);
  if (legacyRows.some((row) => row.userId !== userId)) return true;

  const starterOrders = await db()
    .select({
      userId: order.userId,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      createdAt: order.createdAt,
    })
    .from(order)
    .where(
      and(
        eq(order.starterBrowserInstallHash, browserInstallHash),
        eq(order.productId, STARTER_PRODUCT_ID),
        inArray(order.status, ['created', 'pending', 'paid']),
        isNull(order.deletedAt)
      )
    )
    .orderBy(desc(order.createdAt));

  return starterOrders.some((row) => {
    if (row.userId === userId) return false;
    if (row.status === 'paid') return true;
    return (
      row.createdAt.getTime() > Date.now() - STARTER_PENDING_ORDER_TTL_MS &&
      Boolean(String(row.checkoutUrl || '').trim())
    );
  });
}

/** Close stale unpaid starter orders before creating a replacement checkout. */
export async function expireStaleStarterOrders(userId: string) {
  await db()
    .update(order)
    .set({
      status: 'failed',
      paymentResult: JSON.stringify({ reason: 'starter_checkout_expired' }),
    })
    .where(
      and(
        eq(order.userId, userId),
        eq(order.productId, STARTER_PRODUCT_ID),
        inArray(order.status, ['created', 'pending']),
        lt(
          order.createdAt,
          new Date(Date.now() - STARTER_PENDING_ORDER_TTL_MS)
        ),
        isNull(order.deletedAt)
      )
    );
}

/** Release a starter deduction held by an abandoned checkout. */
export async function expireStaleStarterDeductionOrders(userId: string) {
  await db()
    .update(order)
    .set({
      status: 'failed',
      deductionReservationKey: null,
      paymentResult: JSON.stringify({
        reason: 'starter_deduction_checkout_expired',
      }),
    })
    .where(
      and(
        eq(order.userId, userId),
        eq(order.discountCode, STARTER_DEDUCTION_CODE),
        inArray(order.status, ['created', 'pending']),
        lt(
          order.createdAt,
          new Date(Date.now() - STARTER_PENDING_ORDER_TTL_MS)
        ),
        isNull(order.deletedAt)
      )
    );
}

async function hasUsedStarterDeduction(userId: string) {
  const [row] = await db()
    .select({ id: order.id })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.discountCode, STARTER_DEDUCTION_CODE),
        inArray(order.status, ['created', 'pending', 'paid']),
        isNull(order.deletedAt),
        isNotNull(order.discountAmount)
      )
    )
    .limit(1);
  return Boolean(row);
}

export function getStarterDeductionReservationKey(userId: string) {
  return `${String(userId || '').trim()}:${STARTER_DEDUCTION_CODE}`;
}

export async function getActiveStarterDeductionOrder(userId: string) {
  const [row] = await db()
    .select({
      orderNo: order.orderNo,
      productId: order.productId,
      status: order.status,
      checkoutUrl: order.checkoutUrl,
      discountAmount: order.discountAmount,
      createdAt: order.createdAt,
    })
    .from(order)
    .where(
      and(
        eq(order.userId, userId),
        eq(order.discountCode, STARTER_DEDUCTION_CODE),
        inArray(order.status, ['created', 'pending']),
        isNull(order.deletedAt),
        isNotNull(order.discountAmount)
      )
    )
    .orderBy(desc(order.createdAt))
    .limit(1);

  return row ?? null;
}

export async function getStarterStatus(
  userId: string,
  browserInstallId?: string
): Promise<StarterStatus> {
  const starterProduct = await getStarterProduct();
  const trials = await findUserTrialCredentials(userId);
  const paidTrialRow =
    trials.find((row) => String(row.sourceOrderNo || '').trim()) || null;
  const freeTrialRow =
    trials.find((row) => !String(row.sourceOrderNo || '').trim()) || null;

  const paidTrial = paidTrialRow
    ? {
        credentialId: paidTrialRow.id,
        code: paidTrialRow.code,
        expiresAt: paidTrialRow.expiresAt
          ? paidTrialRow.expiresAt.toISOString()
          : null,
        active: isTrialActive(paidTrialRow),
      }
    : null;

  let eligible = false;
  let reason: StarterStatus['reason'] = '';
  let pendingOrder: StarterStatus['pendingOrder'] = null;
  if (paidTrialRow) {
    reason = 'has_paid_trial';
  } else if (freeTrialRow) {
    reason = 'has_free_trial';
  } else if (
    await hasOtherAccountUsedBrowser(
      userId,
      hashBrowserInstallId(browserInstallId)
    )
  ) {
    reason = 'browser_already_used';
  } else {
    const starterOrder = await findLatestOpenStarterOrder(userId);
    if (starterOrder) {
      reason = 'has_pending_order';
      pendingOrder = {
        orderNo: starterOrder.orderNo,
        status: starterOrder.status,
        checkoutUrl: starterOrder.checkoutUrl || null,
        createdAt: starterOrder.createdAt.toISOString(),
      };
    } else {
      eligible = true;
    }
  }

  let deductionAvailable = false;
  if (paidTrial?.active) {
    deductionAvailable = !(await hasUsedStarterDeduction(userId));
  }

  return {
    eligible,
    reason,
    pendingOrder,
    paidTrial,
    deductionAvailable,
    deductionCents: starterProduct.priceInCents,
    deductionExpiresAt: paidTrial?.active ? paidTrial.expiresAt : null,
  };
}

export function getStarterBrowserInstallHash(browserInstallId: unknown) {
  return hashBrowserInstallId(browserInstallId);
}

/**
 * Returns the deduction amount (in cents) to apply to a subscription checkout,
 * or 0 when the user has no usable deduction.
 */
export async function getApplicableStarterDeduction(
  userId: string
): Promise<number> {
  const status = await getStarterStatus(userId);
  return status.deductionAvailable ? status.deductionCents : 0;
}

/** Whether a credential row represents a PAID starter trial. */
export function isPaidTrialCredential(row: {
  planCode: string | null;
  sourceOrderNo: string | null;
}): boolean {
  return (
    String(row.planCode || '')
      .trim()
      .toLowerCase() === 'trial' &&
    Boolean(String(row.sourceOrderNo || '').trim())
  );
}
