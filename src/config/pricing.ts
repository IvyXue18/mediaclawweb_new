/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * Defaults live here. Admin `pricing_products` config can override selected
 * business fields for a deployed environment.
 */

import { PaymentType, type PaymentInterval } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type CredentialPlanTier = 'personal' | 'team' | 'trial';

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
  /** Membership duration in days when it differs from creditsValidDays (e.g. starter card: 5-day membership, credits never expire). */
  durationDays?: number;
  /** Override the plan code written to the issued credential (defaults to productId). */
  grantPlanCode?: string;
  /** Granted credits never expire, regardless of membership duration. */
  creditsNeverExpire?: boolean;
  maxBindings?: number;
  /** Membership tier used to decide whether an existing credential can be renewed. */
  credentialTier?: CredentialPlanTier;
  plan?: PricingPlanInfo;
  status?: string;
};

type PricingProductConfig = {
  amount?: unknown;
  priceInCents?: unknown;
  currency?: unknown;
  credits?: unknown;
  type?: unknown;
  fulfillment?: unknown;
  duration_preset?: unknown;
  durationPreset?: unknown;
  duration_days?: unknown;
  durationDays?: unknown;
  valid_days?: unknown;
  validDays?: unknown;
  max_bindings?: unknown;
  maxBindings?: unknown;
  status?: unknown;
};

/**
 * MediaClaw pricing catalog.
 * Keys MUST match what the pricing UI sends as product_id.
 */
export const pricingCatalog: Record<string, PricingProduct> = {
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
  'trial-starter': {
    productId: 'trial-starter',
    productName: 'MediaClaw 9 元全能卡',
    planName: '9元全能卡',
    description: '全能体验卡',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 900,
    currency: 'cny',
    credits: 50,
    creditsValidDays: 0,
    durationDays: 5,
    grantPlanCode: 'trial',
    creditsNeverExpire: true,
    maxBindings: 1,
    credentialTier: 'trial',
  },
  'pro-1m': {
    productId: 'pro-1m',
    productName: 'MediaClaw 个人版月付',
    planName: '个人版月付',
    description: 'MediaClaw 个人版月付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 5900,
    currency: 'cny',
    credits: 180,
    creditsValidDays: 30,
    maxBindings: 1,
    credentialTier: 'personal',
  },
  'team-1m': {
    productId: 'team-1m',
    productName: 'MediaClaw 团队版月付',
    planName: '团队版月付',
    description: 'MediaClaw 团队版月付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 14900,
    currency: 'cny',
    credits: 700,
    creditsValidDays: 30,
    maxBindings: 3,
    credentialTier: 'team',
  },
  'pro-monthly': {
    productId: 'pro-monthly',
    productName: 'MediaClaw 个人版季付',
    planName: '个人版季付',
    description: 'MediaClaw 个人版季付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 9900,
    currency: 'cny',
    credits: 400,
    creditsValidDays: 90,
    maxBindings: 1,
    credentialTier: 'personal',
  },
  'team-monthly': {
    productId: 'team-monthly',
    productName: 'MediaClaw 团队版季付',
    planName: '团队版季付',
    description: 'MediaClaw 团队版季付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 26800,
    currency: 'cny',
    credits: 1500,
    creditsValidDays: 90,
    maxBindings: 3,
    credentialTier: 'team',
  },
  'pro-yearly': {
    productId: 'pro-yearly',
    productName: 'MediaClaw 个人版年付',
    planName: '个人版年付',
    description: 'MediaClaw 个人版年付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 29900,
    currency: 'cny',
    credits: 1500,
    creditsValidDays: 365,
    maxBindings: 1,
    credentialTier: 'personal',
  },
  'team-yearly': {
    productId: 'team-yearly',
    productName: 'MediaClaw 团队版年付',
    planName: '团队版年付',
    description: 'MediaClaw 团队版年付',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credential',
    priceInCents: 69900,
    currency: 'cny',
    credits: 5000,
    creditsValidDays: 365,
    maxBindings: 3,
    credentialTier: 'team',
  },
  'credits-emergency-150': {
    productId: 'credits-emergency-150',
    productName: 'MediaClaw 紧急补量积分包',
    planName: '紧急补量积分包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 2900,
    currency: 'cny',
    credits: 200,
    creditsValidDays: 0,
  },
  'credits-creator-600': {
    productId: 'credits-creator-600',
    productName: 'MediaClaw 创作者常用包',
    planName: '创作者常用包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 7900,
    currency: 'cny',
    credits: 1000,
    creditsValidDays: 0,
  },
  'credits-team-3000': {
    productId: 'credits-team-3000',
    productName: 'MediaClaw 多内容线团队包',
    planName: '多内容线团队包',
    description: '给已有正式激活码加量',
    type: PaymentType.ONE_TIME,
    fulfillment: 'credits_only',
    priceInCents: 16900,
    currency: 'cny',
    credits: 2500,
    creditsValidDays: 0,
  },
};

function pricingProductIdCandidates(...productIds: string[]): string[] {
  const candidates = new Set<string>();
  for (const productId of productIds) {
    const trimmed = String(productId || '').trim();
    if (!trimmed) continue;
    candidates.add(trimmed);
    candidates.add(trimmed.replace(/_/g, '-'));
    candidates.add(trimmed.replace(/-/g, '_'));
  }
  return [...candidates];
}

function getPricingProductEntry(
  productId: string
): { product: PricingProduct; catalogKey: string } | null {
  for (const candidate of pricingProductIdCandidates(productId)) {
    const product = pricingCatalog[candidate];
    if (product) return { product, catalogKey: candidate };
  }
  return null;
}

export function getPricingProduct(productId: string): PricingProduct | null {
  return getPricingProductEntry(productId)?.product ?? null;
}

export function getCredentialPlanTier(params: {
  planCode?: string | null;
  maxBindings?: number | null;
}): CredentialPlanTier | null {
  const planCode = String(params.planCode || '').trim();
  const catalogTier = planCode
    ? getPricingProduct(planCode)?.credentialTier
    : undefined;
  if (catalogTier) return catalogTier;
  if (planCode.toLowerCase() === 'trial') return 'trial';

  const maxBindings = Number(params.maxBindings || 0);
  if (maxBindings > 0) return maxBindings > 1 ? 'team' : 'personal';
  return null;
}

export function credentialTierLabel(tier: CredentialPlanTier) {
  if (tier === 'personal') return '个人版';
  if (tier === 'team') return '团队版';
  return '试用版';
}

function numberFromConfig(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
}

function durationDaysFromConfig(
  config: PricingProductConfig
): number | undefined {
  const explicit =
    numberFromConfig(config.duration_days) ??
    numberFromConfig(config.durationDays) ??
    numberFromConfig(config.valid_days) ??
    numberFromConfig(config.validDays);
  if (explicit !== undefined) return Math.max(0, explicit);

  const preset = String(config.duration_preset ?? config.durationPreset ?? '')
    .trim()
    .toLowerCase();
  if (preset === '1y' || preset === 'yearly') return 365;
  if (preset === '3m' || preset === 'quarterly') return 90;
  if (preset === '1m' || preset === 'monthly') return 30;
  return undefined;
}

function applyStarterCardConfig(
  product: PricingProduct,
  configs: Record<string, string>
): PricingProduct {
  if (product.productId !== 'trial-starter') return product;

  const next = { ...product };
  const enabled = configs.benefit_starter_card_enabled;
  const priceInCents = numberFromConfig(
    configs.benefit_starter_card_price_cents
  );
  const durationDays = numberFromConfig(
    configs.benefit_starter_card_duration_days
  );
  const credits = numberFromConfig(configs.benefit_starter_card_credits);

  if (enabled !== undefined && enabled !== '') {
    next.status = ['true', '1', 'yes', 'on'].includes(
      String(enabled).toLowerCase()
    )
      ? 'active'
      : 'inactive';
  }
  if (priceInCents !== undefined && priceInCents >= 0) {
    next.priceInCents = priceInCents;
  }
  if (durationDays !== undefined && durationDays >= 0) {
    next.durationDays = durationDays;
  }
  if (credits !== undefined && credits >= 0) next.credits = credits;

  return next;
}

export function resolvePricingProduct(
  productId: string,
  configs: Record<string, string>
): PricingProduct | null {
  const entry = getPricingProductEntry(productId);
  if (!entry) return null;
  const base = entry.product;

  let config: PricingProductConfig | null = null;
  try {
    const allProducts = JSON.parse(configs.pricing_products || '{}');
    for (const candidate of pricingProductIdCandidates(
      productId,
      entry.catalogKey,
      base.productId
    )) {
      const candidateConfig = allProducts?.[candidate];
      if (candidateConfig && typeof candidateConfig === 'object') {
        config = candidateConfig;
        break;
      }
    }
  } catch (error) {
    console.error('[pricing] failed to parse pricing_products config:', error);
  }

  if (!config || typeof config !== 'object') {
    return applyStarterCardConfig(base, configs);
  }

  const amount = numberFromConfig(config.amount ?? config.priceInCents);
  const credits = numberFromConfig(config.credits);
  const maxBindings = numberFromConfig(
    config.max_bindings ?? config.maxBindings
  );
  const fulfillment = String(config.fulfillment ?? config.type ?? '')
    .trim()
    .toLowerCase();
  const next: PricingProduct = { ...base };

  if (amount !== undefined && amount >= 0) next.priceInCents = amount;
  if (typeof config.currency === 'string' && config.currency.trim()) {
    next.currency = config.currency.trim().toLowerCase();
  }
  if (credits !== undefined && credits >= 0) next.credits = credits;
  if (maxBindings !== undefined) {
    if (maxBindings > 0) next.maxBindings = maxBindings;
    else delete next.maxBindings;
  }

  const durationDays = durationDaysFromConfig(config);
  if (durationDays !== undefined) {
    if (base.productId === 'trial-starter') next.durationDays = durationDays;
    else next.creditsValidDays = durationDays;
  }

  if (fulfillment === 'credits_only' || fulfillment === 'credits') {
    next.fulfillment = 'credits_only';
    next.type = PaymentType.ONE_TIME;
    delete next.plan;
  } else if (fulfillment === 'credential') {
    next.fulfillment = 'credential';
    next.type = PaymentType.ONE_TIME;
    delete next.plan;
  } else if (fulfillment === 'generic') {
    next.fulfillment = 'generic';
  }

  if (typeof config.status === 'string' && config.status.trim()) {
    next.status = config.status.trim().toLowerCase();
  }

  return applyStarterCardConfig(next, configs);
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}
