import { createFileRoute } from '@tanstack/react-router';
import { and, eq, gte, inArray, isNull, lt } from 'drizzle-orm';

import { getAuth } from '@/core/auth';
import { db } from '@/core/db';
import {
  benefitRewardLedger,
  channelSurveyResponse,
  credential,
  credit,
  eventLog,
  experienceFeedbackResponse,
  order,
  referralWithdrawal,
} from '@/config/db/schema';
import { hasPermission } from '@/modules/rbac/service';
import { respData, respErr } from '@/lib/resp';

type Dateish = string | number | Date | null | undefined;

function asDate(value: Dateish) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function parseMonth(value?: string | null) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return startOfMonth(new Date());
  const month = Number(match[2]);
  if (month < 1 || month > 12) return startOfMonth(new Date());
  return new Date(Number(match[1]), month - 1, 1);
}

function resolveRange(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'month';
  const now = new Date();

  if (range === 'all') {
    return { range, start: null as Date | null, end: null as Date | null };
  }

  if (range === '7d') {
    return { range, start: addDays(now, -7), end: now };
  }

  if (range === '30d') {
    return { range, start: addDays(now, -30), end: now };
  }

  const start = parseMonth(searchParams.get('month'));
  return { range: 'month', start, end: addMonths(start, 1) };
}

function inPeriod(value: Dateish, start: Date | null, end: Date | null) {
  if (!start || !end) return true;
  const date = asDate(value);
  if (!date) return false;
  return date >= start && date < end;
}

function rangeWhere<T extends { createdAt: any }>(
  table: T,
  start: Date | null,
  end: Date | null
) {
  if (!start || !end) return undefined;
  return and(gte(table.createdAt, start), lt(table.createdAt, end));
}

function eventRangeWhere(start: Date | null, end: Date | null) {
  if (!start || !end) return undefined;
  return and(gte(eventLog.occurredAt, start), lt(eventLog.occurredAt, end));
}

function actorId(row: {
  id: string;
  userId: string;
  clientUuid: string;
  anonymousId: string;
  sessionId: string;
}) {
  return (
    row.userId || row.clientUuid || row.anonymousId || row.sessionId || row.id
  );
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function amountCents(row: { amount: number; paymentAmount?: number | null }) {
  return Number(row.paymentAmount ?? row.amount ?? 0);
}

function currencyCode(row: {
  currency: string;
  paymentCurrency?: string | null;
}) {
  return (row.paymentCurrency || row.currency || 'CNY').toUpperCase();
}

function sumRevenueByCurrency(
  rows: Array<{
    amount: number;
    paymentAmount?: number | null;
    currency: string;
    paymentCurrency?: string | null;
  }>
) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const currency = currencyCode(row);
    totals.set(currency, (totals.get(currency) || 0) + amountCents(row));
  });
  return Array.from(totals.entries()).map(([currency, amount]) => ({
    currency,
    amount,
  }));
}

async function requireAdmin(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw new Error('Unauthorized');
  const isAdmin = await hasPermission(session.user.id, 'admin.*');
  if (!isAdmin) throw new Error('Forbidden');
}

async function safeRead<T>(label: string, task: () => Promise<T>, fallback: T) {
  try {
    return await task();
  } catch (error) {
    console.warn(`[admin.analytics] ${label} unavailable`, error);
    return fallback;
  }
}

async function GET({ request }: { request: Request }) {
  try {
    await requireAdmin(request);

    const { range, start, end } = resolveRange(request);
    const eventRows = await safeRead(
      'event_log',
      () =>
        db()
          .select({
            id: eventLog.id,
            eventName: eventLog.eventName,
            source: eventLog.source,
            anonymousId: eventLog.anonymousId,
            userId: eventLog.userId,
            clientUuid: eventLog.clientUuid,
            sessionId: eventLog.sessionId,
            occurredAt: eventLog.occurredAt,
          })
          .from(eventLog)
          .where(eventRangeWhere(start, end)),
      []
    );

    const actorSet = (eventName: string, source?: string) => {
      const values = new Set<string>();
      eventRows.forEach((row) => {
        if (row.eventName !== eventName) return;
        if (source && row.source !== source) return;
        values.add(actorId(row));
      });
      return values;
    };

    const pageViews = eventRows.filter(
      (row) => row.eventName === 'page_view'
    ).length;
    const visitors = actorSet('page_view').size;
    const signUpUsers = actorSet('sign_up_success').size;
    const checkoutCreatedUsers = actorSet('checkout_created').size;
    const paymentSuccessUsers = actorSet('payment_success').size;
    const pricingViewUsers = actorSet('pricing_view').size;
    const downloadClickUsers = actorSet('download_click').size;
    const chromeStoreClickUsers = actorSet('chrome_store_click').size;
    const trialClaimStartedUsers = actorSet('trial_claim_started').size;
    const trialClaimSuccessUsers = actorSet('trial_claim_success').size;
    const extensionOpenedUsers = actorSet('extension_opened', 'extension').size;
    const credentialVerifiedUsers = actorSet(
      'credential_verify_success',
      'extension'
    ).size;
    const featureGateShownUsers = actorSet(
      'feature_gate_shown',
      'extension'
    ).size;
    const trialCtaClickedUsers = actorSet(
      'trial_cta_clicked',
      'extension'
    ).size;
    const pricingCtaClickedUsers = actorSet(
      'pricing_cta_clicked',
      'extension'
    ).size;
    const featureUsedActors = actorSet('feature_used', 'extension');
    const featureUseEvents = eventRows.filter(
      (row) => row.source === 'extension' && row.eventName === 'feature_used'
    ).length;

    const paidRows = await safeRead(
      'paid orders',
      () =>
        db()
          .select({
            userId: order.userId,
            orderNo: order.orderNo,
            amount: order.amount,
            currency: order.currency,
            paymentAmount: order.paymentAmount,
            paymentCurrency: order.paymentCurrency,
            paidAt: order.paidAt,
            createdAt: order.createdAt,
          })
          .from(order)
          .where(and(eq(order.status, 'paid'), isNull(order.deletedAt))),
      []
    );
    const periodPaidRows = paidRows.filter((row) =>
      inPeriod(row.paidAt || row.createdAt, start, end)
    );
    const paidUsers = new Set(periodPaidRows.map((row) => row.userId)).size;
    const totalOrdersByUser = new Map<string, number>();
    const firstPaidAtByUser = new Map<string, Date>();
    paidRows.forEach((row) => {
      totalOrdersByUser.set(
        row.userId,
        (totalOrdersByUser.get(row.userId) || 0) + 1
      );
      const paidAt = asDate(row.paidAt || row.createdAt);
      if (!paidAt) return;
      const current = firstPaidAtByUser.get(row.userId);
      if (!current || paidAt < current)
        firstPaidAtByUser.set(row.userId, paidAt);
    });
    const periodPaidUserIds = Array.from(
      new Set(periodPaidRows.map((row) => row.userId))
    );
    const newPaidUsers = periodPaidUserIds.filter((userId) =>
      inPeriod(firstPaidAtByUser.get(userId), start, end)
    ).length;
    const repeatPaidUsers = periodPaidUserIds.filter(
      (userId) => (totalOrdersByUser.get(userId) || 0) >= 2
    ).length;
    const paidAmountByCurrency = sumRevenueByCurrency(periodPaidRows);
    const paidAmount = paidAmountByCurrency.reduce(
      (total, item) => total + item.amount,
      0
    );

    const rewardRows = await safeRead(
      'benefit rewards',
      () =>
        db()
          .select({
            userId: benefitRewardLedger.userId,
            taskType: benefitRewardLedger.taskType,
            status: benefitRewardLedger.status,
            createdAt: benefitRewardLedger.createdAt,
          })
          .from(benefitRewardLedger)
          .where(rangeWhere(benefitRewardLedger, start, end)),
      []
    );
    const successRewards = rewardRows.filter((row) => row.status === 'success');
    const rewardUsersByFirstAt = new Map<string, Date>();
    successRewards.forEach((row) => {
      if (!row.userId) return;
      const createdAt = asDate(row.createdAt);
      if (!createdAt) return;
      const current = rewardUsersByFirstAt.get(row.userId);
      if (!current || createdAt < current)
        rewardUsersByFirstAt.set(row.userId, createdAt);
    });

    const formalCredentialRows = await safeRead(
      'formal credentials',
      () =>
        db()
          .select({
            ownerUserId: credential.ownerUserId,
            planCode: credential.planCode,
            createdAt: credential.createdAt,
          })
          .from(credential)
          .where(isNull(credential.deletedAt)),
      []
    );
    let convertedPaidUsers = 0;
    let formalCredentialUsers = 0;
    rewardUsersByFirstAt.forEach((firstRewardAt, userId) => {
      if (
        paidRows.some(
          (row) =>
            row.userId === userId &&
            (asDate(row.paidAt || row.createdAt)?.getTime() || 0) >=
              firstRewardAt.getTime()
        )
      ) {
        convertedPaidUsers += 1;
      }
      if (
        formalCredentialRows.some(
          (row) =>
            row.ownerUserId === userId &&
            row.planCode &&
            row.planCode !== 'trial' &&
            (asDate(row.createdAt)?.getTime() || 0) >= firstRewardAt.getTime()
        )
      ) {
        formalCredentialUsers += 1;
      }
    });

    const creditRows = await safeRead(
      'credit usage',
      () =>
        db()
          .select({
            userId: credit.userId,
            transactionType: credit.transactionType,
            transactionScene: credit.transactionScene,
            credits: credit.credits,
            createdAt: credit.createdAt,
          })
          .from(credit)
          .where(
            and(
              inArray(credit.transactionType, ['consume', 'expense']),
              isNull(credit.deletedAt),
              rangeWhere(credit, start, end)
            )
          ),
      []
    );
    const consumedCredits = creditRows.reduce(
      (total, row) => total + Math.abs(Number(row.credits || 0)),
      0
    );
    const sceneMap = new Map<string, { count: number; value: number }>();
    creditRows.forEach((row) => {
      const name = row.transactionScene || 'unknown';
      const current = sceneMap.get(name) || { count: 0, value: 0 };
      current.count += 1;
      current.value += Math.abs(Number(row.credits || 0));
      sceneMap.set(name, current);
    });

    const surveyRows = await safeRead(
      'channel survey',
      () =>
        db()
          .select({
            role: channelSurveyResponse.role,
            createdAt: channelSurveyResponse.createdAt,
          })
          .from(channelSurveyResponse)
          .where(rangeWhere(channelSurveyResponse, start, end)),
      []
    );
    const feedbackRows = await safeRead(
      'experience feedback',
      () =>
        db()
          .select({
            rating: experienceFeedbackResponse.rating,
            createdAt: experienceFeedbackResponse.createdAt,
          })
          .from(experienceFeedbackResponse)
          .where(rangeWhere(experienceFeedbackResponse, start, end)),
      []
    );
    const roleMap = new Map<string, number>();
    surveyRows.forEach((row) => {
      const name = row.role || 'unknown';
      roleMap.set(name, (roleMap.get(name) || 0) + 1);
    });

    const pendingOrders = await safeRead(
      'pending orders',
      () =>
        db()
          .select({ id: order.id })
          .from(order)
          .where(
            and(
              inArray(order.status, ['pending', 'created']),
              isNull(order.deletedAt)
            )
          ),
      []
    );
    const credentialRows = await safeRead(
      'credential operations',
      () =>
        db()
          .select({
            ownerUserId: credential.ownerUserId,
            status: credential.status,
          })
          .from(credential)
          .where(isNull(credential.deletedAt)),
      []
    );
    const pendingWithdrawals = await safeRead(
      'referral withdrawals',
      () =>
        db()
          .select({ id: referralWithdrawal.id })
          .from(referralWithdrawal)
          .where(eq(referralWithdrawal.status, 'pending')),
      []
    );

    const rewardUsers = rewardUsersByFirstAt.size;
    const feedbackResponses = feedbackRows.length;
    const positiveFeedback = feedbackRows.filter(
      (row) => row.rating >= 4
    ).length;

    return respData({
      range: {
        type: range,
        start: start?.toISOString() || null,
        end: end?.toISOString() || null,
      },
      web: {
        pageViews,
        visitors,
        signUpUsers,
        checkoutCreatedUsers,
        paymentSuccessUsers,
        pricingViewUsers,
        downloadClickUsers,
        chromeStoreClickUsers,
        trialClaimStartedUsers,
        trialClaimSuccessUsers,
        visitorToSignupRate: rate(signUpUsers, visitors),
        signupToCheckoutRate: rate(checkoutCreatedUsers, signUpUsers),
        checkoutToPaymentRate: rate(paymentSuccessUsers, checkoutCreatedUsers),
      },
      paid: {
        paidUsers,
        newPaidUsers,
        repeatPaidUsers,
        repeatPaidRate: rate(repeatPaidUsers, paidUsers),
        paidOrders: periodPaidRows.length,
        paidAmount,
        paidAmountByCurrency,
        averageOrderAmount: periodPaidRows.length
          ? paidAmount / periodPaidRows.length
          : 0,
      },
      welfare: {
        rewardUsers,
        rewardCount: rewardRows.length,
        surveyRewardUsers: new Set(
          successRewards
            .filter((row) => row.taskType === 'channel_survey')
            .map((row) => row.userId)
            .filter(Boolean)
        ).size,
        feedbackRewardUsers: new Set(
          successRewards
            .filter((row) => row.taskType === 'experience_feedback')
            .map((row) => row.userId)
            .filter(Boolean)
        ).size,
        convertedPaidUsers,
        formalCredentialUsers,
        conversionRate: rate(convertedPaidUsers, rewardUsers),
        rewardSuccessRate: rate(successRewards.length, rewardRows.length),
      },
      funnel: {
        extensionOpenedUsers,
        credentialVerifiedUsers,
        featureGateShownUsers,
        trialCtaClickedUsers,
        pricingCtaClickedUsers,
        featureUsedUsers: featureUsedActors.size,
        featureUseEvents,
        openToCredentialRate: rate(
          credentialVerifiedUsers,
          extensionOpenedUsers
        ),
        openToFeatureUseRate: rate(
          featureUsedActors.size,
          extensionOpenedUsers
        ),
      },
      usage: {
        consumedCredits,
        activeConsumeUsers: new Set(creditRows.map((row) => row.userId)).size,
        consumeTransactions: creditRows.length,
        topCreditScenes: Array.from(sceneMap.entries())
          .map(([name, item]) => ({ name, ...item }))
          .sort((a, b) => b.value - a.value || b.count - a.count)
          .slice(0, 5),
      },
      feedback: {
        surveyResponses: surveyRows.length,
        feedbackResponses,
        averageRating: feedbackResponses
          ? feedbackRows.reduce((total, row) => total + row.rating, 0) /
            feedbackResponses
          : 0,
        positiveFeedbackRate: rate(positiveFeedback, feedbackResponses),
        rewardSuccessCount: successRewards.length,
        topRoles: Array.from(roleMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      operations: {
        pendingOrders: pendingOrders.length,
        unclaimedCredentials: credentialRows.filter(
          (row) => row.status === 'active' && !row.ownerUserId
        ).length,
        frozenCredentials: credentialRows.filter((row) =>
          ['frozen', 'revoked'].includes(row.status)
        ).length,
        pendingWithdrawals: pendingWithdrawals.length,
      },
    });
  } catch (error: any) {
    console.error('[admin.analytics] failed', error);
    return respErr(error.message || 'Internal error');
  }
}

export const Route = createFileRoute('/api/admin/analytics')({
  server: {
    handlers: { GET },
  },
});
