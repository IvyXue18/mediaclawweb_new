/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  fulfillment?: 'generic' | 'credential' | 'credits_only';
  priceInCents: number;
  currency: string;
  credits: number;
  creditsValidDays?: number;
  maxBindings?: number;
  plan?: PricingPlanInfo;
};

/**
 * Default demo catalog. Replace with your real products when launching.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  starter_monthly: {
    productId: 'starter_monthly',
    productName: 'Starter',
    planName: 'Starter',
    description: 'Starter Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 900,
    currency: 'usd',
    credits: 5000,
    plan: {
      name: 'Starter',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  pro_monthly: {
    productId: 'pro_monthly',
    productName: 'Pro',
    planName: 'Pro',
    description: 'Pro Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 2900,
    currency: 'usd',
    credits: 50000,
    plan: { name: 'Pro', interval: PaymentInterval.MONTH, intervalCount: 1 },
  },
  enterprise_monthly: {
    productId: 'enterprise_monthly',
    productName: 'Enterprise',
    planName: 'Enterprise',
    description: 'Enterprise Monthly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 9900,
    currency: 'usd',
    credits: 500000,
    plan: {
      name: 'Enterprise',
      interval: PaymentInterval.MONTH,
      intervalCount: 1,
    },
  },
  starter_yearly: {
    productId: 'starter_yearly',
    productName: 'Starter',
    planName: 'Starter',
    description: 'Starter Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 8600,
    currency: 'usd',
    credits: 60000,
    plan: { name: 'Starter', interval: PaymentInterval.YEAR, intervalCount: 1 },
  },
  pro_yearly: {
    productId: 'pro_yearly',
    productName: 'Pro',
    planName: 'Pro',
    description: 'Pro Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 27800,
    currency: 'usd',
    credits: 600000,
    plan: { name: 'Pro', interval: PaymentInterval.YEAR, intervalCount: 1 },
  },
  enterprise_yearly: {
    productId: 'enterprise_yearly',
    productName: 'Enterprise',
    planName: 'Enterprise',
    description: 'Enterprise Yearly',
    type: PaymentType.SUBSCRIPTION,
    priceInCents: 95000,
    currency: 'usd',
    credits: 6000000,
    plan: {
      name: 'Enterprise',
      interval: PaymentInterval.YEAR,
      intervalCount: 1,
    },
  },
  starter_lifetime: {
    productId: 'starter_lifetime',
    productName: 'Starter',
    planName: 'Starter Lifetime',
    description: 'Starter Lifetime',
    type: PaymentType.ONE_TIME,
    priceInCents: 14900,
    currency: 'usd',
    credits: 100000,
  },
  pro_lifetime: {
    productId: 'pro_lifetime',
    productName: 'Pro',
    planName: 'Pro Lifetime',
    description: 'Pro Lifetime',
    type: PaymentType.ONE_TIME,
    priceInCents: 49900,
    currency: 'usd',
    credits: 1000000,
  },
  enterprise_lifetime: {
    productId: 'enterprise_lifetime',
    productName: 'Enterprise',
    planName: 'Enterprise Lifetime',
    description: 'Enterprise Lifetime',
    type: PaymentType.ONE_TIME,
    priceInCents: 199900,
    currency: 'usd',
    credits: 10000000,
  },
  free: {
    productId: 'free',
    productName: 'MediaClaw Free',
    planName: 'Free',
    description: 'MediaClaw Free',
    type: PaymentType.ONE_TIME,
    fulfillment: 'generic',
    priceInCents: 0,
    currency: 'cny',
    credits: 0,
    creditsValidDays: 0,
  },
  'pro-1m': {
    productId: 'pro-1m',
    productName: 'MediaClaw 个人版月付',
    planName: '个人版月付',
    description: 'MediaClaw 个人版月付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 4900,
    currency: 'cny',
    credits: 180,
    creditsValidDays: 30,
    maxBindings: 1,
  },
  'team-1m': {
    productId: 'team-1m',
    productName: 'MediaClaw 团队版月付',
    planName: '团队版月付',
    description: 'MediaClaw 团队版月付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 12900,
    currency: 'cny',
    credits: 700,
    creditsValidDays: 30,
    maxBindings: 3,
  },
  'pro-monthly': {
    productId: 'pro-monthly',
    productName: 'MediaClaw 个人版季付',
    planName: '个人版季付',
    description: 'MediaClaw 个人版季付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 11800,
    currency: 'cny',
    credits: 600,
    creditsValidDays: 90,
    maxBindings: 1,
  },
  'team-monthly': {
    productId: 'team-monthly',
    productName: 'MediaClaw 团队版季付',
    planName: '团队版季付',
    description: 'MediaClaw 团队版季付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 31800,
    currency: 'cny',
    credits: 2000,
    creditsValidDays: 90,
    maxBindings: 3,
  },
  'pro-yearly': {
    productId: 'pro-yearly',
    productName: 'MediaClaw 个人版年付',
    planName: '个人版年付',
    description: 'MediaClaw 个人版年付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 39900,
    currency: 'cny',
    credits: 2500,
    creditsValidDays: 365,
    maxBindings: 1,
  },
  'team-yearly': {
    productId: 'team-yearly',
    productName: 'MediaClaw 团队版年付',
    planName: '团队版年付',
    description: 'MediaClaw 团队版年付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 108800,
    currency: 'cny',
    credits: 9000,
    creditsValidDays: 365,
    maxBindings: 3,
  },
  'credits-emergency-150': {
    productId: 'credits-emergency-150',
    productName: 'MediaClaw 应急积分包',
    planName: '应急积分包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 2900,
    currency: 'cny',
    credits: 1000,
    creditsValidDays: 0,
  },
  'credits-creator-600': {
    productId: 'credits-creator-600',
    productName: 'MediaClaw 创作者积分包',
    planName: '创作者积分包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 7900,
    currency: 'cny',
    credits: 3000,
    creditsValidDays: 0,
  },
  'credits-team-3000': {
    productId: 'credits-team-3000',
    productName: 'MediaClaw 团队积分包',
    planName: '团队积分包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 36000,
    currency: 'cny',
    credits: 15000,
    creditsValidDays: 0,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
