import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '@/core/auth';
import { envConfigs } from '@/config';
import {
  credentialTierLabel,
  getCredentialPlanTier,
  resolvePricingProduct,
} from '@/config/pricing';
import { getAllConfigs } from '@/modules/config/service';
import { getCredentialByCode } from '@/modules/credentials/service';
import {
  findPartnerByBusinessId,
  isPartnerCurrentlyActive,
  partnerBusinessId,
} from '@/modules/partners/service';
import {
  cancelPendingCheckout,
  createCheckout,
  DEDUCTION_RESERVATION_CONFLICT_CODE,
} from '@/modules/payment/service';
import {
  applyDiscount,
  getInviteeDiscount,
  getInviteeDiscountReservationKey,
} from '@/modules/referral/service';
import {
  expireStaleStarterDeductionOrders,
  expireStaleStarterOrders,
  getActiveStarterDeductionOrder,
  getApplicableStarterDeduction,
  getStarterBrowserInstallHash,
  getStarterDeductionReservationKey,
  getStarterStatus,
  isPaidTrialCredential,
  STARTER_DEDUCTION_CODE,
  STARTER_PRODUCT_ID,
} from '@/modules/starter/service';
import {
  ATTRIBUTION_COOKIE_NAME,
  parseAttributionEnvelope,
} from '@/lib/analytics-attribution';
import { getCookieFromHeader } from '@/lib/cookie';
import { enforceMinIntervalRateLimit } from '@/lib/rate-limit';
import { respData, respErr } from '@/lib/resp';
import { recordServerAnalyticsEvent } from '@/lib/server-analytics';

function safeSameOriginPath(
  input: string | undefined | null,
  fallbackPath: string
): string {
  if (!input) return fallbackPath;
  try {
    const appUrl = new URL(envConfigs.app_url || 'http://localhost:3000');
    const candidate = new URL(input, appUrl);
    if (candidate.origin !== appUrl.origin) return fallbackPath;
    return candidate.pathname + candidate.search + candidate.hash;
  } catch {
    return fallbackPath;
  }
}

function clientIpFromHeaders(headers: Headers) {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    ''
  );
}

function normalizeDevice(input: unknown) {
  return input === 'mobile' ? 'mobile' : 'pc';
}

export async function POST({ request }: { request: Request }) {
  const limited = enforceMinIntervalRateLimit(request, {
    intervalMs: 1000,
    keyPrefix: 'checkout',
  });
  if (limited) return limited;

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return respErr('Unauthorized');
    }

    const body = await request.json().catch(() => ({}));
    const {
      product_id,
      payment_provider,
      redirect,
      metadata,
      partner_id,
      channel_code,
      credential_code,
      seats,
      device,
      browser_install_id,
    } = body;

    if (!product_id || typeof product_id !== 'string') {
      return respErr('Missing product_id');
    }

    const configs = await getAllConfigs({ bypassCache: true });

    // Look up product in the authoritative server-side catalog plus admin overrides.
    // We DO NOT trust price / credits / plan from the request body.
    const product = resolvePricingProduct(product_id, configs);
    if (!product) {
      return respErr('Unknown product');
    }
    if (product.status && product.status !== 'active') {
      return respErr('this product is currently unavailable');
    }

    const credentialCode =
      typeof credential_code === 'string'
        ? credential_code.trim().toUpperCase()
        : '';
    const fulfillment = product.fulfillment || 'generic';

    const parsedSeats = Math.floor(Number(seats || 1));
    const seatCount = Number.isFinite(parsedSeats)
      ? Math.max(1, parsedSeats)
      : 1;
    if (seatCount > 500) {
      return respErr('seat count exceeds partner checkout limit');
    }

    const requestedPartnerId = String(partner_id || channel_code || '').trim();
    const partnerRow = requestedPartnerId
      ? await findPartnerByBusinessId(requestedPartnerId)
      : null;
    if (requestedPartnerId && !partnerRow) {
      return respErr('partner not found or not bound to current user');
    }
    if (partnerRow && !isPartnerCurrentlyActive(partnerRow)) {
      return respErr('partner is not active for new purchases');
    }
    if (
      partnerRow &&
      partner_id &&
      partnerRow.ownerUserId !== session.user.id
    ) {
      return respErr('partner not found or not bound to current user');
    }
    if (partnerRow && fulfillment !== 'credential') {
      return respErr('partner checkout only supports credential products');
    }
    if (partnerRow && credentialCode) {
      return respErr('partner checkout does not support credential recharge');
    }

    if (fulfillment === 'credits_only' && !credentialCode) {
      return respErr('credential_code is required for credits-only products');
    }

    if (credentialCode) {
      const selectedCredential = await getCredentialByCode(credentialCode);
      if (
        !selectedCredential ||
        selectedCredential.ownerUserId !== session.user.id
      ) {
        return respErr('credential not found or not owned by current user');
      }
      if (selectedCredential.status !== 'active') {
        return respErr(`credential is ${selectedCredential.status}`);
      }
      if (fulfillment === 'credential') {
        const targetTier = product.credentialTier;
        const existingTier = getCredentialPlanTier(selectedCredential);
        if (
          !targetTier ||
          targetTier === 'trial' ||
          existingTier !== targetTier
        ) {
          const label = targetTier ? credentialTierLabel(targetTier) : '同版本';
          return respErr(`暂无${label}激活码，请选择新购激活码`);
        }
      }
      if (
        fulfillment === 'credits_only' &&
        String(selectedCredential.planCode || '').toLowerCase() === 'trial' &&
        !isPaidTrialCredential(selectedCredential)
      ) {
        return respErr(
          'trial activation codes cannot buy credit packs; upgrade to a paid plan first'
        );
      }
    }

    // 9 元全能卡：每个账号限购一次；领取过任何试用（免费或付费）的账号不可购买。
    const isStarterProduct = product.productId === STARTER_PRODUCT_ID;
    if (isStarterProduct) {
      if (partnerRow || credentialCode) {
        return respErr('starter card does not support partner or recharge');
      }
      const starterStatus = await getStarterStatus(
        session.user.id,
        browser_install_id
      );
      if (!starterStatus.eligible) {
        const pendingOrder = starterStatus.pendingOrder;
        if (
          starterStatus.reason === 'has_pending_order' &&
          pendingOrder &&
          ['created', 'pending'].includes(pendingOrder.status) &&
          pendingOrder.checkoutUrl
        ) {
          return respData({
            checkoutUrl: pendingOrder.checkoutUrl,
            checkout_url: pendingOrder.checkoutUrl,
            orderNo: pendingOrder.orderNo,
            reused: true,
          });
        }
        return respErr(`starter_not_eligible:${starterStatus.reason}`);
      }
      await expireStaleStarterOrders(session.user.id);
    }

    // Optional per-provider "test amount" override (admin-configured).
    // Only the charged amount is overridden — credits granted and order
    // amount stored both come from the authoritative catalog.
    const providerKey = payment_provider || configs.default_payment_provider;
    const testAmountRaw = providerKey
      ? configs[`${providerKey}_test_amount`]
      : undefined;
    const testAmount = testAmountRaw ? parseInt(testAmountRaw) : 0;
    const baseAmount = partnerRow
      ? product.priceInCents * seatCount
      : product.priceInCents;
    let chargeAmount = testAmount > 0 ? testAmount : baseAmount;

    // 邀请首单优惠与 9 元卡抵扣取最大力度，不叠加。
    let discountCode: string | null = null;
    let discountAmount = 0;
    let inviteeDiscountRate = 0;
    if (
      !partnerRow &&
      testAmount <= 0 &&
      product.currency.toUpperCase() === 'CNY'
    ) {
      inviteeDiscountRate = await getInviteeDiscount(session.user.id);
      if (inviteeDiscountRate > 0) {
        const discountedAmount = applyDiscount(
          chargeAmount,
          inviteeDiscountRate
        );
        const referralDiscountAmount = Math.max(
          0,
          chargeAmount - discountedAmount
        );
        if (referralDiscountAmount > 0) {
          discountCode = `referral_invitee_${inviteeDiscountRate}`;
          discountAmount = referralDiscountAmount;
        }
      }
    }

    if (
      fulfillment === 'credential' &&
      !isStarterProduct &&
      !partnerRow &&
      !credentialCode &&
      testAmount <= 0
    ) {
      await expireStaleStarterDeductionOrders(session.user.id);
      const activeDeductionOrder = await getActiveStarterDeductionOrder(
        session.user.id
      );
      if (activeDeductionOrder) {
        const referralDiscountIsLarger =
          discountAmount > Number(activeDeductionOrder.discountAmount || 0);
        if (
          activeDeductionOrder.productId === product.productId &&
          activeDeductionOrder.checkoutUrl &&
          !referralDiscountIsLarger
        ) {
          return respData({
            checkoutUrl: activeDeductionOrder.checkoutUrl,
            checkout_url: activeDeductionOrder.checkoutUrl,
            orderNo: activeDeductionOrder.orderNo,
            reused: true,
          });
        }

        const replaced = await cancelPendingCheckout({
          userId: session.user.id,
          orderNo: activeDeductionOrder.orderNo,
          reason: 'checkout_replaced',
        });
        if (!replaced.canceled) {
          return respErr(
            replaced.status === 'paid'
              ? 'starter_deduction_already_used'
              : 'starter_deduction_checkout_in_progress'
          );
        }
      }

      const deduction = await getApplicableStarterDeduction(session.user.id);
      const starterDiscountAmount = Math.min(
        deduction,
        Math.max(chargeAmount - 1, 0)
      );
      if (starterDiscountAmount > discountAmount) {
        discountAmount = starterDiscountAmount;
        if (starterDiscountAmount > 0) {
          discountCode = STARTER_DEDUCTION_CODE;
        }
      }
    }

    chargeAmount -= discountAmount;

    const defaultRedirectPath = isStarterProduct
      ? '/welfare/claim'
      : '/settings/payments';
    const clientip = clientIpFromHeaders(request.headers);
    const attribution = parseAttributionEnvelope(
      getCookieFromHeader(
        request.headers.get('cookie'),
        ATTRIBUTION_COOKIE_NAME
      )
    );

    // Build success/cancel URLs — only accept same-origin redirects.
    const baseUrl = envConfigs.app_url || 'http://localhost:3000';
    const safeRedirectPath = safeSameOriginPath(redirect, defaultRedirectPath);
    const successRedirect = `${baseUrl}${safeRedirectPath}`;
    const cancelUrl = `${baseUrl}/pricing`;

    const partnerId = partnerRow ? partnerBusinessId(partnerRow) : null;
    const partnerVariantId = partnerRow?.variantId || 'official';
    const partnerPath = channel_code
      ? `/partner/${encodeURIComponent(String(channel_code).trim())}/buy`
      : '/partner';
    const partnerSuccessUrl = partnerRow
      ? `${baseUrl}${partnerPath}`
      : successRedirect;
    const partnerCancelUrl = partnerRow
      ? `${baseUrl}${partnerPath}`
      : cancelUrl;
    const partnerPriceRuleSnapshot = partnerRow
      ? JSON.stringify({
          partnerId,
          variantId: partnerVariantId,
          seats: seatCount,
          unitAmount: product.priceInCents,
          baseTotalAmount: product.priceInCents * seatCount,
          finalAmount: chargeAmount,
          creditsPerSeat: product.credits,
          maxBindings: product.maxBindings || 1,
          currency: product.currency,
        })
      : isStarterProduct
        ? JSON.stringify({
            planCode: product.grantPlanCode || 'trial',
            durationDays: product.durationDays || 5,
            creditsNeverExpire: product.creditsNeverExpire !== false,
            maxBindings: product.maxBindings || 1,
          })
        : null;
    const credentialAction =
      fulfillment === 'credential'
        ? credentialCode
          ? 'recharge'
          : 'issue'
        : fulfillment === 'credits_only'
          ? 'recharge'
          : undefined;

    const checkout = await createCheckout({
      userId: session.user.id,
      userEmail: session.user.email,
      productName: product.productName,
      planName: product.planName,
      credits: partnerRow ? 0 : product.credits,
      creditsValidDays: product.creditsValidDays,
      paymentOrder: {
        productId: product.productId,
        price: { amount: chargeAmount, currency: product.currency },
        type: product.type,
        description: product.description,
        successUrl: partnerSuccessUrl,
        cancelUrl: partnerCancelUrl,
        metadata: {
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
          device: normalizeDevice(device),
          invitee_discount_rate: discountCode?.startsWith('referral_invitee_')
            ? inviteeDiscountRate
            : 0,
          ...(clientip ? { clientip } : {}),
          ...(partnerRow
            ? {
                partner_id: partnerId,
                variant_id: partnerVariantId,
                seats: seatCount,
              }
            : {}),
        },
        customer: {
          email: session.user.email,
          name: session.user.name,
        },
        plan: product.plan
          ? {
              name: product.plan.name,
              interval: product.plan.interval,
              intervalCount: product.plan.intervalCount,
            }
          : undefined,
      },
      provider: payment_provider,
      credentialAction: partnerRow ? 'issue' : credentialAction,
      credentialCode: credentialCode || null,
      partnerId,
      variantId: partnerRow ? partnerVariantId : null,
      seatCount: partnerRow ? seatCount : 1,
      priceRuleSnapshot: partnerPriceRuleSnapshot,
      starterBrowserInstallHash: isStarterProduct
        ? getStarterBrowserInstallHash(browser_install_id)
        : null,
      discountCode,
      discountAmount,
      deductionReservationKey:
        discountCode === STARTER_DEDUCTION_CODE
          ? getStarterDeductionReservationKey(session.user.id)
          : discountCode?.startsWith('referral_invitee_')
            ? getInviteeDiscountReservationKey(session.user.id)
            : null,
      attribution,
    });

    const checkoutUrl = checkout.checkoutInfo.checkoutUrl;
    await recordServerAnalyticsEvent({
      eventName: 'checkout_created',
      source: 'server',
      anonymousId: attribution?.anonymousId,
      sessionId: attribution?.sessionId,
      userId: session.user.id,
      pagePath: safeRedirectPath,
      referrer: attribution?.lastTouch.referrer,
      utmSource: attribution?.lastTouch.source,
      utmMedium: attribution?.lastTouch.medium,
      utmCampaign: attribution?.lastTouch.campaign,
      utmContent: attribution?.lastTouch.content,
      utmTerm: attribution?.lastTouch.term,
      channel: attribution?.lastTouch.channel,
      landingPage: attribution?.lastTouch.landingPage,
      attributionConfidence: attribution?.lastTouch.confidence,
      properties: {
        productId: product.productId,
        productName: product.productName,
        planName: product.planName,
        fulfillment,
        credentialAction,
        credentialCode: credentialCode || undefined,
        paymentProvider: checkout.provider,
        partnerId,
        variantId: partnerRow ? partnerVariantId : undefined,
        seats: partnerRow ? seatCount : undefined,
        amount: chargeAmount,
        currency: product.currency,
        redirect: safeRedirectPath,
        discountCode: discountCode || undefined,
        discountAmount: discountAmount || undefined,
        attribution,
      },
    });
    if (isStarterProduct) {
      await recordServerAnalyticsEvent({
        eventName: 'trial_card_pay_click',
        source: 'server',
        userId: session.user.id,
        properties: { productId: product.productId, amount: chargeAmount },
      });
    }
    return respData({ checkoutUrl, checkout_url: checkoutUrl });
  } catch (error: any) {
    if (error?.code === DEDUCTION_RESERVATION_CONFLICT_CODE) {
      return respErr(
        String(error?.reservationKey || '').endsWith(
          ':referral_invitee_discount'
        )
          ? 'referral_invitee_checkout_in_progress'
          : 'starter_deduction_checkout_in_progress'
      );
    }
    console.error('checkout error:', error);
    return respErr(error.message || 'Checkout failed');
  }
}

export const Route = createFileRoute('/api/payment/checkout')({
  server: {
    handlers: { POST },
  },
});
