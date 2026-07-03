import {
  PaymentInterval,
  PaymentOrder,
  PaymentType,
} from '@/extensions/payment/types';
import { getSnowId, getUuid } from '@/shared/lib/hash';
import { getAllConfigs } from '@/shared/models/config';
import { findCredentialByCodeAndOwner } from '@/shared/models/credential';
import {
  createOrder,
  OrderCredentialAction,
  OrderCredentialSyncStatus,
  OrderStatus,
  updateOrderByOrderNo,
} from '@/shared/models/order';
import {
  calculatePartnerCheckoutAmount,
  findPartnerSupplierByChannelCode,
  findPartnerSupplierByPartnerId,
  isSupplierCurrentlyActive,
  normalizeChannelCode,
  normalizePartnerId,
} from '@/shared/models/partner';
import { getUserInfo } from '@/shared/models/user';
import { getPaymentService } from '@/shared/services/payment';
import { applyDiscount, getInviteeDiscount } from '@/shared/services/referral';

import { envConfigs } from '@/config';

type PricingItem = {
  product_id: string;
  product_name: string;
  plan_name?: string;
  description?: string;
  amount: number;
  currency: string;
  credits: number;
  valid_days: number;
  interval: PaymentInterval;
  group?: string;
  payment_providers?: string[];
  payment_product_id?: string;
};

function respData(data: any) {
  return Response.json({ code: 0, message: 'ok', data });
}

function respErr(message: string) {
  return Response.json({ code: -1, message });
}

function fallbackPricingItem(productId: string, config: Record<string, any>) {
  const isCreditsOnly =
    config.type === 'credits_only' || productId.startsWith('credits-');
  return {
    product_id: productId,
    product_name: isCreditsOnly ? 'MediaClaw Credits' : 'MediaClaw Pro',
    plan_name: isCreditsOnly ? undefined : 'Pro',
    description: isCreditsOnly ? 'Credits pack' : 'Pro monthly',
    amount: Number(config.amount || 0),
    currency: config.currency || 'CNY',
    credits: Number(config.credits || 0),
    valid_days: isCreditsOnly ? 0 : config.valid_days || 30,
    interval: PaymentInterval.ONE_TIME,
    group: isCreditsOnly ? 'credits' : undefined,
    payment_providers: ['zpay'],
  } satisfies PricingItem;
}

export async function POST(req: Request) {
  try {
    const {
      product_id,
      currency,
      locale,
      payment_provider,
      metadata,
      credential_code,
      partner_id,
      channel_code,
      seats,
      device,
    } = await req.json();
    if (!product_id) {
      return respErr('product_id is required');
    }

    const user = await getUserInfo();
    if (!user || !user.email) {
      return respErr('no auth, please sign in');
    }

    const configs = await getAllConfigs();
    let pricingProducts: Record<string, any> = {};
    try {
      pricingProducts = configs.pricing_products
        ? JSON.parse(configs.pricing_products)
        : {};
    } catch {
      pricingProducts = {};
    }

    const pricingProductConfig = pricingProducts[product_id] || null;
    if (!pricingProductConfig) {
      return respErr('this product is not configured');
    }

    if (
      pricingProductConfig.status &&
      pricingProductConfig.status !== 'active'
    ) {
      return respErr('this product is currently unavailable');
    }

    const pricingItem = fallbackPricingItem(product_id, pricingProductConfig);
    const productType = pricingProductConfig.type;
    if (!['credential', 'credits_only'].includes(productType)) {
      return respErr('invalid product type configuration');
    }

    const normalizedPartnerId = normalizePartnerId(partner_id || '');
    const normalizedChannelCode = normalizeChannelCode(channel_code || '');
    const parsedSeats = Math.floor(Number(seats || 1));
    const seatCount = Number.isFinite(parsedSeats)
      ? Math.max(1, parsedSeats)
      : 1;

    let partnerSupplier: any = undefined;
    if (normalizedPartnerId || normalizedChannelCode) {
      if (productType !== 'credential') {
        return respErr('partner checkout only supports credential products');
      }
      if (credential_code) {
        return respErr('partner checkout does not support credential recharge');
      }
      if (seatCount > 500) {
        return respErr('seat count exceeds partner checkout limit');
      }

      partnerSupplier = normalizedChannelCode
        ? await findPartnerSupplierByChannelCode(normalizedChannelCode)
        : await findPartnerSupplierByPartnerId(normalizedPartnerId);
      if (!partnerSupplier) {
        return respErr('partner not found or not bound to current user');
      }
      if (!normalizedChannelCode && partnerSupplier.userId !== user.id) {
        return respErr('partner not found or not bound to current user');
      }
      if (!isSupplierCurrentlyActive(partnerSupplier)) {
        return respErr('partner is not active for new purchases');
      }
    }

    if (productType === 'credits_only' && !credential_code) {
      return respErr('credential_code is required for credits-only products');
    }

    if (productType === 'credits_only') {
      const selectedCredential = await findCredentialByCodeAndOwner({
        code: String(credential_code || '').trim(),
        ownerUserId: user.id,
      });
      if (!selectedCredential) {
        return respErr('credential not found or not owned by current user');
      }
      if (String(selectedCredential.planCode || '').toLowerCase() === 'trial') {
        return respErr(
          'trial activation codes cannot buy credit packs; upgrade to a paid plan first'
        );
      }
    }

    const paymentProviderName =
      payment_provider || configs.default_payment_provider || '';
    if (!paymentProviderName) {
      return respErr('no payment provider configured');
    }

    if (
      pricingItem.payment_providers?.length &&
      !pricingItem.payment_providers.includes(paymentProviderName)
    ) {
      return respErr(
        `payment provider ${paymentProviderName} is not supported for this currency`
      );
    }

    const paymentService = await getPaymentService();
    const paymentProvider = paymentService.getProvider(paymentProviderName);
    if (!paymentProvider || !paymentProvider.name) {
      return respErr('no payment provider configured');
    }

    const defaultCurrency = (pricingItem.currency || 'usd').toLowerCase();
    const checkoutCurrency = currency
      ? String(currency).toLowerCase()
      : defaultCurrency;
    let checkoutAmount = Number(pricingItem.amount || 0);
    const paymentInterval = pricingItem.interval || PaymentInterval.ONE_TIME;
    const paymentType =
      paymentInterval === PaymentInterval.ONE_TIME
        ? PaymentType.ONE_TIME
        : PaymentType.SUBSCRIPTION;
    const orderNo = getSnowId();

    let originalCheckoutAmount = checkoutAmount;
    let inviteeDiscountRate = 0;
    let inviteeDiscountAmount = 0;
    let partnerPriceRuleSnapshot: Record<string, any> | null = null;
    const partnerVariantId =
      partnerSupplier?.defaultVariantId?.trim() || 'official';

    if (partnerSupplier) {
      const baseTotalAmount = checkoutAmount * seatCount;
      checkoutAmount = calculatePartnerCheckoutAmount({
        unitAmount: checkoutAmount,
        seats: seatCount,
        priceRuleType: partnerSupplier.priceRuleType,
        priceRuleValue: partnerSupplier.priceRuleValue,
      });
      partnerPriceRuleSnapshot = {
        partnerId: partnerSupplier.partnerId,
        variantId: partnerVariantId,
        seats: seatCount,
        unitAmount: pricingItem.amount,
        baseTotalAmount,
        priceRuleType: partnerSupplier.priceRuleType,
        priceRuleValue: partnerSupplier.priceRuleValue,
        finalAmount: checkoutAmount,
        creditsPerSeat: Number(pricingProductConfig.credits || 0),
        currency: checkoutCurrency,
      };
      originalCheckoutAmount = baseTotalAmount;
    } else if (checkoutCurrency.toUpperCase() === 'CNY') {
      inviteeDiscountRate = await getInviteeDiscount(user.id);
      if (inviteeDiscountRate > 0) {
        const discountedAmount = applyDiscount(
          checkoutAmount,
          inviteeDiscountRate
        );
        inviteeDiscountAmount = Math.max(0, checkoutAmount - discountedAmount);
        checkoutAmount = discountedAmount;
      }
    }

    const appBaseUrl = String(
      configs.app_url || envConfigs.app_url || new URL(req.url).origin
    ).replace(/\/+$/, '');
    const callbackBaseUrl =
      locale && locale !== configs.default_locale
        ? `${appBaseUrl}/${locale}`
        : appBaseUrl;
    const clientip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const partnerCallbackPath = normalizedChannelCode
      ? `/partner/${normalizedChannelCode}/buy`
      : '/partner';
    const callbackUrl = partnerSupplier
      ? `${callbackBaseUrl}${partnerCallbackPath}?order_no=${orderNo}`
      : paymentType === PaymentType.SUBSCRIPTION
        ? `${callbackBaseUrl}/settings/billing?order_no=${orderNo}`
        : `${callbackBaseUrl}/settings/payments?order_no=${orderNo}`;

    const checkoutOrder: PaymentOrder = {
      description: pricingItem.product_name,
      customer: {
        name: user.name,
        email: user.email,
      },
      type: paymentType,
      metadata: {
        app_name: configs.app_name,
        order_no: orderNo,
        user_id: user.id,
        invitee_discount_rate: inviteeDiscountRate || 0,
        callback_url: callbackUrl,
        device: device || 'pc',
        clientip,
        ...(partnerSupplier
          ? {
              partner_id: partnerSupplier.partnerId,
              variant_id: partnerVariantId,
              seats: seatCount,
            }
          : {}),
        ...(metadata || {}),
      },
      successUrl: `${appBaseUrl}/api/payment/callback?order_no=${orderNo}`,
      cancelUrl: partnerSupplier
        ? `${callbackBaseUrl}${partnerCallbackPath}`
        : `${callbackBaseUrl}/pricing`,
      price: {
        amount: checkoutAmount,
        currency: checkoutCurrency,
      },
    };

    if (paymentType === PaymentType.SUBSCRIPTION) {
      checkoutOrder.plan = {
        interval: paymentInterval,
        name: pricingItem.product_name,
      };
    }

    const credentialAction = credential_code
      ? OrderCredentialAction.RECHARGE
      : OrderCredentialAction.ISSUE;
    const orderCredits = partnerSupplier
      ? 0
      : Number(pricingProductConfig.credits ?? pricingItem.credits ?? 0);

    await createOrder({
      id: getUuid(),
      orderNo,
      userId: user.id,
      userEmail: user.email,
      status: OrderStatus.PENDING,
      amount: originalCheckoutAmount,
      currency: checkoutCurrency,
      productId: pricingItem.product_id,
      paymentType,
      paymentInterval,
      paymentProvider: paymentProvider.name,
      checkoutInfo: JSON.stringify(checkoutOrder),
      createdAt: new Date(),
      productName: pricingItem.product_name,
      description: pricingItem.description,
      callbackUrl,
      creditsAmount: orderCredits,
      creditsValidDays: pricingItem.valid_days ?? 0,
      planName: pricingItem.plan_name || '',
      paymentProductId: '',
      discountCode: partnerSupplier
        ? `partner_${partnerSupplier.partnerId}`
        : inviteeDiscountAmount > 0
          ? `referral_invitee_${inviteeDiscountRate}`
          : '',
      discountAmount: partnerSupplier
        ? Math.max(0, originalCheckoutAmount - checkoutAmount)
        : inviteeDiscountAmount,
      discountCurrency: checkoutCurrency,
      credentialAction,
      credentialSyncStatus: OrderCredentialSyncStatus.PENDING,
      credentialCode: credential_code || null,
      partnerId: partnerSupplier?.partnerId || null,
      variantId: partnerSupplier ? partnerVariantId : null,
      seatCount: partnerSupplier ? seatCount : 1,
      priceRuleSnapshot: partnerPriceRuleSnapshot
        ? JSON.stringify(partnerPriceRuleSnapshot)
        : null,
    });

    try {
      const result = await paymentProvider.createPayment({
        order: checkoutOrder,
      });

      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.CREATED,
        checkoutInfo: JSON.stringify(result.checkoutParams),
        checkoutResult: JSON.stringify(result.checkoutResult),
        checkoutUrl: result.checkoutInfo.checkoutUrl,
        paymentSessionId: result.checkoutInfo.sessionId,
        paymentProvider: result.provider,
      });

      return respData(result.checkoutInfo);
    } catch (error: any) {
      await updateOrderByOrderNo(orderNo, {
        status: OrderStatus.COMPLETED,
        checkoutInfo: JSON.stringify(checkoutOrder),
      });

      return respErr('checkout failed: ' + error.message);
    }
  } catch (error: any) {
    return respErr('checkout failed: ' + error.message);
  }
}
